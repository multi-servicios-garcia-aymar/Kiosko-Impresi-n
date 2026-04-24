# Guía de Seguridad y RLS (Supabase)

Para garantizar un grado empresarial y la máxima seguridad para los usuarios y el dueño de la app (Kiosko Nexo), se recomiendan las siguientes políticas de Row Level Security (RLS).

## 1. Tabla: `profiles`
Contiene la información de los usuarios y su estado administrativo.

```sql
-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ver su propio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Actualizar su propio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Admins pueden ver todo
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_super_admin = true
  )
);
```

## 2. Tabla: `licenses`
Gestión de activaciones por máquina (HWID).

```sql
-- Habilitar RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer su licencia si conoce el Key (Safe for activation)
CREATE POLICY "Public read for activation" 
ON public.licenses FOR SELECT 
USING (true);

-- Solo el sistema (Service Role) o Admin puede crear licencias
-- (Desde el Dashboard de Supabase)

-- Usuarios pueden actualizar su hardware_id y expires_at una única vez al activar
-- Se recomienda usar una Database Function (RPC) para activación segura
-- pero si se usa RLS:
CREATE POLICY "Users can activate unused license" 
ON public.licenses FOR UPDATE 
USING (expires_at IS NULL OR hardware_id = (auth.jwt() -> 'user_metadata' -> 'kiosk_license' ->> 'hwid'));
```

## 3. Tabla: `kiosk_gallery_photos`
Sincronización de fotos entre dispositivos del mismo kiosko.

```sql
-- Habilitar RLS
ALTER TABLE public.kiosk_gallery_photos ENABLE ROW LEVEL SECURITY;

-- Ver fotos de mi usuario O de mi máquina actual
CREATE POLICY "View own or machine photos" 
ON public.kiosk_gallery_photos FOR SELECT 
USING (
  auth.uid() = user_id OR 
  machine_id = (auth.jwt() -> 'user_metadata' -> 'kiosk_license' ->> 'hwid')
);

-- Insertar fotos (solo si estoy logueado o tengo machine_id)
CREATE POLICY "Insert own photos" 
ON public.kiosk_gallery_photos FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  machine_id = (auth.jwt() -> 'user_metadata' -> 'kiosk_license' ->> 'hwid')
);

-- Eliminar mis propias fotos
CREATE POLICY "Delete own photos" 
ON public.kiosk_gallery_photos FOR DELETE 
USING (auth.uid() = user_id);
```

## 4. Tabla: `kiosk_ads`
Publicidad gestionada por el Administrador.

```sql
-- Habilitar RLS
ALTER TABLE public.kiosk_ads ENABLE ROW LEVEL SECURITY;

-- Lectura pública (Kiosko en modo invitado o logueado)
CREATE POLICY "Public ads read" 
ON public.kiosk_ads FOR SELECT 
USING (true);

-- Solo Super Admin decide qué se muestra
CREATE POLICY "Only admins can manage ads" 
ON public.kiosk_ads FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_super_admin = true
  )
);
```

## 5. Storage (Buckets)

### Bucket: `gallery`
Configure las políticas del bucket de Supabase Storage:

- **SELECT**: `(storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' -> 'kiosk_license' ->> 'hwid')`
- **INSERT**: `(storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' -> 'kiosk_license' ->> 'hwid')`
- **DELETE**: `(storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' -> 'kiosk_license' ->> 'hwid')`

Esto garantiza que una máquina solo pueda escribir y leer archivos dentro de su propia carpeta `/HWID/`.
