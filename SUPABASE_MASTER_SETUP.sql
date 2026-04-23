-- ==============================================================================
-- 🚀 KIOSKO: SQL MASTER CONFIGURATION (GALLERY, ADS, LICENSES, LOGS & CONFIG)
-- ==============================================================================
-- Instrucciones: 
-- 1. Copia y pega ESTE CÓDIGO en el SQL Editor de tu Dashboard de Supabase.
-- 2. Ejecútalo (Run) para crear la infraestructura completa.
-- Este script es IDEMPOTENTE y SEGURO.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE TABLES

-- 2.1 User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    avatar_url text,
    is_super_admin boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Remote Config (App Settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 License Management
CREATE TABLE IF NOT EXISTS public.licenses (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    client_name text NOT NULL,
    hardware_id text,
    duration_months integer DEFAULT 1,
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.5 Gallery Table
CREATE TABLE IF NOT EXISTS public.kiosk_gallery_photos (
    id text PRIMARY KEY,           
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    machine_id text NOT null,      
    storage_path text NOT null,    
    template_id text,              
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.6 Advertising Table
CREATE TABLE IF NOT EXISTS public.kiosk_ads (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT null,
    image_url text NOT null,
    description text,
    cta_text text,
    cta_url text,
    is_active boolean DEFAULT true,
    display_duration integer DEFAULT 5000,
    target_machine_id text,
    target_audience text DEFAULT 'all',
    placement text DEFAULT 'carousel',
    display_mode text DEFAULT 'fade',
    priority integer DEFAULT 0,
    media_items jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SECURITY (RLS) - ENABLE ONLY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_ads ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (DROP & RE-CREATE)
-- We drop policies individually to avoid "relation does not exist" errors on first run
DO $$ 
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    -- Audit Logs
    DROP POLICY IF EXISTS "Super Admins can read all logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "Anyone can insert logs" ON public.audit_logs;
    -- App Settings
    DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
    DROP POLICY IF EXISTS "Only super admins can manage app settings" ON public.app_settings;
    -- Licenses
    DROP POLICY IF EXISTS "Only super admins can view licenses" ON public.licenses;
    DROP POLICY IF EXISTS "Allow machine activation by key" ON public.licenses;
    -- Gallery
    DROP POLICY IF EXISTS "Authenticated users can manage gallery" ON public.kiosk_gallery_photos;
    -- Ads
    DROP POLICY IF EXISTS "Everyone can view active ads" ON public.kiosk_ads;
    DROP POLICY IF EXISTS "SuperAdmins can manage ads" ON public.kiosk_ads;
EXCEPTION WHEN undefined_table THEN
    -- Fallback for first run if tables somehow don't exist yet
    NULL;
END $$;

-- 4.1 Profile Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 4.2 Audit Logs Policies
CREATE POLICY "Super Admins can read all logs" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
);
CREATE POLICY "Anyone can insert logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 4.3 App Settings Policies
CREATE POLICY "Anyone can read app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Only super admins can manage app settings" ON public.app_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
);

-- 4.4 License Policies
CREATE POLICY "Only super admins can view licenses" ON public.licenses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
);
CREATE POLICY "Allow machine activation by key" ON public.licenses FOR ALL USING (true);

-- 4.5 Gallery Policies
CREATE POLICY "Authenticated users can manage gallery" ON public.kiosk_gallery_photos FOR ALL USING (auth.role() = 'authenticated');

-- 4.6 Ads Policies
CREATE POLICY "Everyone can view active ads" ON public.kiosk_ads FOR SELECT USING (is_active = true);
CREATE POLICY "SuperAdmins can manage ads" ON public.kiosk_ads FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
);

-- 5. STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true), ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

DO $$ 
BEGIN
    -- Gallery Storage
    DROP POLICY IF EXISTS "Public view access for Gallery bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload to gallery" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete from gallery" ON storage.objects;
    -- Ads Storage
    DROP POLICY IF EXISTS "Public view access for Ads bucket" ON storage.objects;
    DROP POLICY IF EXISTS "SuperAdmins can manage ads bucket" ON storage.objects;
END $$;

CREATE POLICY "Public view access for Gallery bucket" ON storage.objects FOR SELECT USING ( bucket_id = 'gallery' );
CREATE POLICY "Authenticated users can upload to gallery" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'gallery' AND auth.role() = 'authenticated' );
CREATE POLICY "Authenticated users can delete from gallery" ON storage.objects FOR DELETE USING ( bucket_id = 'gallery' AND auth.role() = 'authenticated' );
CREATE POLICY "Public view access for Ads bucket" ON storage.objects FOR SELECT USING ( bucket_id = 'ads' );
CREATE POLICY "SuperAdmins can manage ads bucket" ON storage.objects FOR ALL USING ( bucket_id = 'ads' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

-- 6. TRIGGERS & FUNCTIONS

-- 6.1 Update Profile on Auth Signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6.2 Generic Updated At Trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_kiosk_ads_updated_at BEFORE UPDATE ON public.kiosk_ads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. REALTIME SETUP
ALTER TABLE public.kiosk_gallery_photos REPLICA IDENTITY FULL;
ALTER TABLE public.kiosk_ads REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_gallery_photos, public.kiosk_ads;
    EXCEPTION WHEN others THEN
        -- Table might already be in publication
        NULL;
    END;
END $$;

