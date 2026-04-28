-- ==============================================================================
-- 🚀 NEXO KIOSKO: SQL MASTER CONFIGURATION (V5.0 - RECURSION-PROOF & MODULAR)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SECURITY LAYER: THE GLOBAL RECURSION BREAKER
-- This function MUST be created first. 
-- SECURITY DEFINER allows it to check the profiles table bypassing RLS constraints.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  is_admin_check boolean;
BEGIN
  SELECT is_super_admin INTO is_admin_check
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin_check, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. CORE SCHEMA DEFINITION
-- 3.1 Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    avatar_url text,
    is_super_admin boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.2 App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 Licenses
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

-- 3.5 Kiosk Ads
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
    priority integer DEFAULT 0,
    media_items jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.6 Gallery Photos
CREATE TABLE IF NOT EXISTS public.kiosk_gallery_photos (
    id text PRIMARY KEY,           
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    machine_id text NOT null,      
    storage_path text NOT null,    
    template_id text,              
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. HARDENED BUSINESS SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_gallery_photos ENABLE ROW LEVEL SECURITY;

-- 4.1 TOTAL CLEANUP: Wipe old policies safely
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 4.2 RE-CREATE FLATTENED POLICIES (Recursion-Free)

-- Profiles: Own view or Admin view
CREATE POLICY "View own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- App Settings: Public read, Admin manage
CREATE POLICY "Public read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage settings" ON public.app_settings FOR ALL USING (public.is_admin());

-- Audit Logs: Admin read, System write
CREATE POLICY "Admin read logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Public insert logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Licenses: Public read (for validation), Admin manage, and Self-activation
CREATE POLICY "Public read licenses" ON public.licenses FOR SELECT USING (true);
CREATE POLICY "Public activate licenses" ON public.licenses FOR UPDATE USING (expires_at IS NULL OR hardware_id IS NULL) WITH CHECK (true);
CREATE POLICY "Admin manage licenses" ON public.licenses FOR ALL USING (public.is_admin());

-- Ads: Public read (active), Admin manage
CREATE POLICY "View active ads" ON public.kiosk_ads FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage ads" ON public.kiosk_ads FOR ALL USING (public.is_admin());

-- Gallery: Secure sync
CREATE POLICY "View own machine photos" ON public.kiosk_gallery_photos 
FOR SELECT USING (auth.uid() = user_id OR machine_id = (auth.jwt() -> 'user_metadata' -> 'kiosk_license' ->> 'hwid'));

CREATE POLICY "Insert own machine photos" ON public.kiosk_gallery_photos 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Delete own machine photos" ON public.kiosk_gallery_photos 
FOR DELETE USING (auth.uid() = user_id);

-- 5. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true), ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- 6. INITIAL BRANDING
INSERT INTO public.app_settings (key, value, description)
VALUES 
('branding', '{"name": "Nexo Kiosko", "primaryColor": "#6366f1", "secondaryColor": "#4f46e5"}', 'Global UI Brand Identity'),
('kiosk_config', '{"offlineMode": false, "autoPrint": false}', 'System-wide Kiosk parameters')
ON CONFLICT (key) DO NOTHING;

-- 7. REPLICATION
ALTER TABLE public.kiosk_ads REPLICA IDENTITY FULL;
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_ads, public.app_settings;
    EXCEPTION WHEN others THEN NULL;
    END;
END $$;

NOTIFY pgrst, 'reload schema';
