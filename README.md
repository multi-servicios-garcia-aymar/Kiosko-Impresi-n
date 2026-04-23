# Nexo Kiosko Fotos 📸
### Centro de Impresión Fotográfica Profesional - Nexo Network Ec

[![License: Commercial](https://img.shields.io/badge/License-Commercial-indigo.svg)](LICENSE)
[![React: 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Supabase: Database](https://img.shields.io/badge/Supabase-Realtime-emerald.svg)](https://supabase.com/)

**Nexo Kiosko Fotos** es una solución de software integral de grado empresarial diseñada para la gestión, edición y procesamiento automático de fotografías en estaciones de impresión y kioscos físicos. Optimizada para el ecosistema de **Nexo Network Ec**, combina inteligencia artificial avanzada con una arquitectura robusta en la nube.

---

## 🌟 Características Destacadas

### 🤖 Inteligencia Artificial & Procesamiento
- **Background Removal**: Eliminación automática de fondos complejos mediante modelos de IA locales.
- **SmartCrop Engine**: Análisis de entropía y detección de rostros para encuadres perfectos según el formato (Carnet, Pasaporte, Postal).
- **Procesamiento Offline**: Una vez activada, la lógica central de IA puede funcionar sin dependencia constante de la nube.

### 🖼️ Gestión Publicitaria (Ads Engine)
- **Campañas Dinámicas**: Sistema de cartelería digital integrado con soporte para títulos, descripciones y botones de llamada a la acción (CTA).
- **Sincronización en Tiempo Real**: Los anuncios se actualizan instantáneamente en todos los kioskos mediante Supabase Realtime.
- **Segmentación**: Capacidad para dirigir anuncios a kioskos específicos mediante IDs de máquina.

### 📄 Exportación Profesional
- **Motor de Layouts**: Generación dinámica de rejillas de impresión (3x4 carnet, 10x15 postal, etc.).
- **PDF de Alta Fidelidad**: Exportación de documentos listos para impresión profesional con precisión milimétrica.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4.
- **Estado Global**: Zustand & Context API.
- **Backend (Cloud)**: Supabase (PostgreSQL + Auth + Realtime + Storage).
- **IA/ML**: `@imgly/background-removal`, `smartcrop.js`.
- **Ecosistema PWA**: Manifest web y Service Workers para una experiencia instalable "App-like".

---

## 🚀 Despliegue Rápido (GitHub Ready)

Sigue estos pasos para poner en marcha tu propia instancia de Nexo Kiosko:

### 1. Clonar y Preparar
```bash
git clone https://github.com/nexo-network/kiosko-fotos.git
cd kiosko-fotos
npm install
```

### 2. Configuración de Base de Datos
Copia el contenido del archivo `SUPABASE_SETUP_GALLERY.sql` y ejecútalo en el **SQL Editor** de tu proyecto Supabase. Esto creará:
- Tablas de Perfiles, Fotos y Publicidad.
- Políticas de Seguridad (RLS).
- Buckets de almacenamiento (`gallery`, `ads`).
- Publicaciones en Tiempo Real.

### 3. Variables de Entorno
Crea un archivo `.env` basado en `.env.example`:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon
GEMINI_API_KEY=tu_clave_de_google_ai
```

### 4. Lanzamiento
```bash
npm run dev
```

---

## 📁 Estructura del Repositorio

```text
├── src/
│   ├── components/    # Componentes UI & Módulos (Editor, Carousel, Ads)
│   ├── context/       # Contextos (Licencias, Auth)
│   ├── lib/           # Utilidades (IA, PDF, Layouts, Supabase)
│   ├── store/         # Zustand Stores (Ads, Gallery)
│   └── pages/         # Vistas principales (Kiosko, Admin, Auth)
├── SUPABASE_SETUP_GALLERY.sql # Script maestro de DB
└── public/            # Assets estáticos y PWA logic
```

## 📜 Propiedad y Soporte

Este proyecto es propiedad intelectual de **Nexo Network Ec**. El software está diseñado para uso comercial bajo licencia.

- **Web**: [nexonetwork.ec](https://nexonetwork.ec)
- **Desarrollo**: Optimizado por AI Studio Build.

---
*Transformando la impresión fotográfica con tecnología de vanguardia.*
