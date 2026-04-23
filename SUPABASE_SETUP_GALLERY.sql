-- ==============================================================================
-- 🚀 KIOSKO: SQL CONFIGURATION FOR REAL-TIME GALLERY & ADMIN SYSTEM
-- ==============================================================================
-- Instrucciones: 
-- Copia y pega ESTE CÓDIGO en el SQL Editor de tu Dashboard de Supabase 
-- y ejecútalo (Run) para crear la infraestructura completa.
-- ==============================================================================

-- 0. CLEANUP (Idempotent approach)
-- Destruimos las tablas viejas y las políticas antiguas para evitar colisiones
DROP TABLE IF EXISTS public.kiosk_gallery_photos CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP POLICY IF EXISTS "Public view access for Gallery bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to gallery bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from gallery bucket" ON storage.objects;

-- 1. Create User Profiles Table (Extended Auth)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    full_name text,
    avatar_url text,
    is_super_admin boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile" 
    on public.profiles for select 
    using (auth.uid() = id);

-- 2. Trigger: Automatically create profile on User Signup with full metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Remove existing trigger if it exists to avoid duplication
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2.1 Retroactive Sync: Create/Update profiles for existing users with full data
insert into public.profiles (id, email, full_name, avatar_url, created_at)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url',
  created_at
from auth.users
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url;

-- 3. Create the Storage Buckets
insert into storage.buckets (id, name, public) 
values ('gallery', 'gallery', true), ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Create the Tables

-- 4.1 Gallery Table
create table public.kiosk_gallery_photos (
    id text primary key,           
    user_id uuid references auth.users(id) on delete cascade,
    machine_id text not null,      
    storage_path text not null,    
    template_id text,              
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4.2 Advertising Table
create table public.kiosk_ads (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    image_url text not null,
    is_active boolean default true,
    display_duration integer default 5000, -- in ms
    target_machine_id text, -- optional: only for specific kiosks
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on REPLICA IDENTITY FULL for Realtime Deletes
ALTER TABLE public.kiosk_gallery_photos REPLICA IDENTITY FULL;
ALTER TABLE public.kiosk_ads REPLICA IDENTITY FULL;

-- 5. Turn on Realtime (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Add Gallery Table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'kiosk_gallery_photos'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_gallery_photos;';
    END IF;

    -- Add Ads Table
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'kiosk_ads'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_ads;';
    END IF;
END $$;

-- 6. Set up Row Level Security (RLS)
alter table public.kiosk_gallery_photos enable row level security;
alter table public.kiosk_ads enable row level security;

-- Gallery RLS
create policy "Authenticated users can manage gallery"
    on public.kiosk_gallery_photos for all
    using (auth.role() = 'authenticated');

-- Ads RLS
create policy "Everyone can view active ads"
    on public.kiosk_ads for select
    using (is_active = true);

create policy "SuperAdmins can manage ads"
    on public.kiosk_ads for all
    using (exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true));

-- 7. Set up Security Policies for Storage
-- GALLERY
create policy "Public view access for Gallery bucket"
    on storage.objects for select
    using ( bucket_id = 'gallery' );

create policy "Authenticated users can upload to gallery bucket"
    on storage.objects for insert
    with check ( bucket_id = 'gallery' and auth.role() = 'authenticated' );

create policy "Authenticated users can delete from gallery bucket"
    on storage.objects for delete
    using ( bucket_id = 'gallery' and auth.role() = 'authenticated' );

-- ADS
create policy "Public view access for Ads bucket"
    on storage.objects for select
    using ( bucket_id = 'ads' );

create policy "SuperAdmins can manage ads bucket"
    on storage.objects for all
    using ( bucket_id = 'ads' and exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true));
