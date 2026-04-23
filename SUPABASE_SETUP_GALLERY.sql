-- ==============================================================================
-- 🚀 KIOSKO: SQL CONFIGURATION FOR REAL-TIME GALLERY & ADMIN SYSTEM
-- ==============================================================================
-- Instrucciones: 
-- Copia y pega ESTE CÓDIGO en el SQL Editor de tu Dashboard de Supabase 
-- y ejecútalo (Run) para crear la infraestructura completa.
-- Este script es IDEMPOTENTE y SEGURO: puedes ejecutarlo varias veces 
-- sin perder datos y sin errores.
-- ==============================================================================

-- 0. CLEANUP (Idempotent approach - Policies only)
-- Borramos las políticas para recrearlas con la versión más reciente sin fallar
DROP POLICY IF EXISTS "Public view access for Gallery bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to gallery bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from gallery bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public view access for Ads bucket" ON storage.objects;
DROP POLICY IF EXISTS "SuperAdmins can manage ads bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can manage gallery" ON public.kiosk_gallery_photos;
DROP POLICY IF EXISTS "Everyone can view active ads" ON public.kiosk_ads;
DROP POLICY IF EXISTS "SuperAdmins can manage ads" ON public.kiosk_ads;

-- 1. Create User Profiles Table (Extended Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    avatar_url text,
    is_super_admin boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

-- 2. Trigger: Automatically create profile on User Signup with full metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove existing trigger if it exists to avoid duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2.1 Retroactive Sync: Create/Update profiles for existing users with full data
INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url',
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url;

-- 3. Create the Storage Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true), ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Create the Tables

-- 4.1 Gallery Table
CREATE TABLE IF NOT EXISTS public.kiosk_gallery_photos (
    id text PRIMARY KEY,           
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    machine_id text NOT null,      
    storage_path text NOT null,    
    template_id text,              
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.2 Advertising Table (With auto-migration Support)
CREATE TABLE IF NOT EXISTS public.kiosk_ads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT null,
    image_url text NOT null,
    is_active boolean DEFAULT true,
    display_duration integer DEFAULT 5000, -- in ms
    target_machine_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure newer columns exist for existing databases
ALTER TABLE public.kiosk_ads ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.kiosk_ads ADD COLUMN IF NOT EXISTS cta_text text;
ALTER TABLE public.kiosk_ads ADD COLUMN IF NOT EXISTS cta_url text;

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
ALTER TABLE public.kiosk_gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_ads ENABLE ROW LEVEL SECURITY;

-- Gallery RLS
CREATE POLICY "Authenticated users can manage gallery"
    ON public.kiosk_gallery_photos FOR ALL
    USING (auth.role() = 'authenticated');

-- Ads RLS
CREATE POLICY "Everyone can view active ads"
    ON public.kiosk_ads FOR SELECT
    USING (is_active = true);

CREATE POLICY "SuperAdmins can manage ads"
    ON public.kiosk_ads FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

-- 7. Set up Security Policies for Storage
-- GALLERY
CREATE POLICY "Public view access for Gallery bucket"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'gallery' );

CREATE POLICY "Authenticated users can upload to gallery bucket"
    ON storage.objects FOR INSERT
    WITH CHECK ( bucket_id = 'gallery' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can delete from gallery bucket"
    ON storage.objects FOR DELETE
    USING ( bucket_id = 'gallery' AND auth.role() = 'authenticated' );

-- ADS
CREATE POLICY "Public view access for Ads bucket"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'ads' );

CREATE POLICY "SuperAdmins can manage ads bucket"
    ON storage.objects FOR ALL
    USING ( bucket_id = 'ads' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));
