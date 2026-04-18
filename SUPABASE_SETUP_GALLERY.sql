-- ==============================================================================
-- 🚀 KIOSKO: SQL CONFIGURATION FOR REAL-TIME GALLERY CLOUD SYNC
-- ==============================================================================
-- Instrucciones: 
-- Copia y pega ESTE CÓDIGO en el SQL Editor de tu Dashboard de Supabase 
-- y ejecútalo (Run) para crear la infraestructura de Sincronización.
-- ==============================================================================

-- 1. Create the Storage Bucket for the Gallery System
insert into storage.buckets (id, name, public) 
values ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the Cloud Gallery Table
create table if not exists public.kiosk_gallery_photos (
    id uuid default gen_random_uuid() primary key,
    machine_id text not null,      -- Stores the license/machine ID grouping
    storage_path text not null,    -- Path inside the bucket
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Turn on Realtime for the table
alter publication supabase_realtime add table public.kiosk_gallery_photos;

-- 4. Set up Row Level Security (RLS) for the Table
alter table public.kiosk_gallery_photos enable row level security;

create policy "Users can view photos of their license"
    on public.kiosk_gallery_photos for select
    using (auth.role() = 'authenticated'); -- In a full prod app, we would match auth.uid() or jwt claim for machine_id.

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
