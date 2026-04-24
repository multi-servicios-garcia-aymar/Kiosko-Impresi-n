-- ==============================================================================
-- 🚀 NEXO KIOSKO: SQL MASTER CONFIGURATION (V3.0 - UNIFIED & SECURED)
-- ==============================================================================
-- This script configures: Profiles, Licenses, Ads, Gallery, Logs, and Config.
-- Includes: Realtime, Hardened RLS, Storage, and Initial Branding.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE TABLES

-- 2.1 Profiles (User & Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    avatar_url text,
    is_super_admin boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 App Settings (Remote Config & Branding)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Audit Logs (System Events)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUSINESS TABLES

-- 3.1 Licenses (Kiosk Activation)
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

-- 3.2 Kiosk Ads (Marketing Engine)
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

-- 3.3 Photo Gallery (Multi-device Sync)
CREATE TABLE IF NOT EXISTS public.kiosk_gallery_photos (
    id text PRIMARY KEY,           
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    machine_id text NOT null,      
    storage_path text NOT null,    
    template_id text,              
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. HARDENED SECURITY (RLS)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_gallery_photos ENABLE ROW LEVEL SECURITY;

-- 4.0 Cleanup existing policies
DO $$ 
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    -- Licenses
    DROP POLICY IF EXISTS "Public read for activation" ON public.licenses;
    DROP POLICY IF EXISTS "Admins can view licenses" ON public.licenses;
    DROP POLICY IF EXISTS "Users can activate unused license" ON public.licenses;
    -- Ads
    DROP POLICY IF EXISTS "Public view for active ads" ON public.kiosk_ads;
    DROP POLICY IF EXISTS "Public ads read" ON public.kiosk_ads;
    DROP POLICY IF EXISTS "Admins can manage ads" ON public.kiosk_ads;
    DROP POLICY IF EXISTS "Only admins can manage ads" ON public.kiosk_ads;
    -- Gallery
    DROP POLICY IF EXISTS "Users can manage own gallery" ON public.kiosk_gallery_photos;
    DROP POLICY IF EXISTS "View own or machine photos" ON public.kiosk_gallery_photos;
    DROP POLICY IF EXISTS "Insert own photos" ON public.kiosk_gallery_photos;
    DROP POLICY IF EXISTS "Delete own photos" ON public.kiosk_gallery_photos;
    -- Settings
    DROP POLICY IF EXISTS "Public access to settings" ON public.app_settings;
    DROP POLICY IF EXISTS "Admins can manage settings" ON public.app_settings;
    -- Logs
    DROP POLICY IF EXISTS "Admins can read logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "System can insert logs" ON public.audit_logs;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 4.1 Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

-- 4.2 Licenses Policies
CREATE POLICY "Public read for activation" ON public.licenses FOR SELECT USING (true);
CREATE POLICY "Admins can manage licenses" ON public.licenses FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));
CREATE POLICY "Users can activate unused license" ON public.licenses FOR UPDATE USING (expires_at IS NULL OR hardware_id = (auth.jwt() -> 'user_metadata' -> 'kiosk_license' ->> 'hwid'));

-- 4.3 Kiosk Ads Policies
CREATE POLICY "Public ads read" ON public.kiosk_ads FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage ads" ON public.kiosk_ads FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

-- 4.4 Gallery Policies
CREATE POLICY "View own or machine photos" ON public.kiosk_gallery_photos FOR SELECT USING (auth.uid() = user_id OR machine_id = (auth.jwt() -> 'user_metadata' -> 'kiosk_license' ->> 'hwid'));
CREATE POLICY "Insert own photos" ON public.kiosk_gallery_photos FOR INSERT WITH CHECK (auth.uid() = user_id AND machine_id = (auth.jwt() -> 'user_metadata' -> 'kiosk_license' ->> 'hwid'));
CREATE POLICY "Delete own photos" ON public.kiosk_gallery_photos FOR DELETE USING (auth.uid() = user_id);

-- 4.5 Settings & Logs
CREATE POLICY "Public access to settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));
CREATE POLICY "Admins can read logs" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));
CREATE POLICY "System can insert logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 5. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true), ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Requires manual setup in dashboard or via SQL if supported by environment)
-- Note: These often need to be set via the Supabase Dashboard UI for best results.

-- 6. INITIAL DATA
INSERT INTO public.app_settings (key, value, description)
VALUES 
('branding', '{"name": "Nexo Kiosko", "primaryColor": "#6366f1", "secondaryColor": "#4f46e5"}', 'Brand identity configuration'),
('kiosk_config', '{"offlineMode": false, "autoPrint": false}', 'Global Kiosk behavior settings')
ON CONFLICT (key) DO NOTHING;

-- 7. AUTOMATION (TRIGGERS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. REALTIME REPLICATION
ALTER TABLE public.kiosk_ads REPLICA IDENTITY FULL;
ALTER TABLE public.kiosk_gallery_photos REPLICA IDENTITY FULL;
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_ads, public.kiosk_gallery_photos, public.app_settings;
    EXCEPTION WHEN others THEN NULL;
    END;
END $$;

-- 9. SCHEMA CACHE RELOAD
NOTIFY pgrst, 'reload schema';
