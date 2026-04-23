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
    is_super_admin boolean default false,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile" 
    on public.profiles for select 
    using (auth.uid() = id);

-- 2. Trigger: Automatically create profile on User Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Create the Storage Bucket for the Gallery System
insert into storage.buckets (id, name, public) 
values ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Create the Cloud Gallery Table
create table public.kiosk_gallery_photos (
    id text primary key,           -- Text ID to match local Date.now() timestamp ID perfectly
    machine_id text not null,      -- Stores the license/machine ID grouping
    storage_path text not null,    -- Path inside the bucket
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on REPLICA IDENTITY FULL so deletes transmit the entire row data to web clients
ALTER TABLE public.kiosk_gallery_photos REPLICA IDENTITY FULL;

-- 5. Turn on Realtime for the table (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'kiosk_gallery_photos'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_gallery_photos;';
    END IF;
END $$;

-- 6. Set up Row Level Security (RLS) for the Table
alter table public.kiosk_gallery_photos enable row level security;

create policy "Users can view photos of their license"
    on public.kiosk_gallery_photos for select
    using (auth.role() = 'authenticated'); 

create policy "Users can insert photos to their license"
    on public.kiosk_gallery_photos for insert
    with check (auth.role() = 'authenticated');

create policy "Users can delete their photos"
    on public.kiosk_gallery_photos for delete
    using (auth.role() = 'authenticated');

-- 7. Set up Security Policies for the Storage Bucket (gallery)
create policy "Public view access for Gallery bucket"
    on storage.objects for select
    using ( bucket_id = 'gallery' );

create policy "Authenticated users can upload to gallery bucket"
    on storage.objects for insert
    with check ( bucket_id = 'gallery' and auth.role() = 'authenticated' );

create policy "Authenticated users can delete from gallery bucket"
    on storage.objects for delete
    using ( bucket_id = 'gallery' and auth.role() = 'authenticated' );
