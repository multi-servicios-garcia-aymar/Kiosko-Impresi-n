-- ==============================================================================
-- 🚀 KIOSKO: SQL CONFIGURATION FOR REAL-TIME GALLERY CLOUD SYNC
-- ==============================================================================
-- Instrucciones: 
-- Copia y pega ESTE CÓDIGO en el SQL Editor de tu Dashboard de Supabase 
-- y ejecútalo (Run) para crear la infraestructura de Sincronización.
-- ==============================================================================

-- 0. CLEANUP (Idempotent approach)
-- Destruimos la tabla vieja y las políticas antiguas para evitar colisiones
DROP TABLE IF EXISTS public.kiosk_gallery_photos CASCADE;
DROP POLICY IF EXISTS "Public view access for Gallery bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to gallery bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from gallery bucket" ON storage.objects;

-- 1. Create the Storage Bucket for the Gallery System
insert into storage.buckets (id, name, public) 
values ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the Cloud Gallery Table
create table public.kiosk_gallery_photos (
    id text primary key,           -- Text ID to match local Date.now() timestamp ID perfectly
    machine_id text not null,      -- Stores the license/machine ID grouping
    storage_path text not null,    -- Path inside the bucket
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Turn on Realtime for the table (Idempotent)
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

-- 4. Set up Row Level Security (RLS) for the Table
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

-- 5. Set up Security Policies for the Storage Bucket (gallery)
create policy "Public view access for Gallery bucket"
    on storage.objects for select
    using ( bucket_id = 'gallery' );

create policy "Authenticated users can upload to gallery bucket"
    on storage.objects for insert
    with check ( bucket_id = 'gallery' and auth.role() = 'authenticated' );

create policy "Authenticated users can delete from gallery bucket"
    on storage.objects for delete
    using ( bucket_id = 'gallery' and auth.role() = 'authenticated' );
