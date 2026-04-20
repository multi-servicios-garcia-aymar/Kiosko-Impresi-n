# Photo Print Kiosk Pro

Una solución de software integral de grado empresarial diseñada para la gestión, edición y procesamiento automático de fotografías en estaciones de impresión y kioscos.

## 🚀 Características Principales

- **🤖 Inteligencia Artificial Integrada**:
  - **Eliminación de Fondo (IA)**: Procesa imágenes para eliminar fondos complejos automáticamente mediante modelos locales.
  - **Auto-Encuadre (SmartCrop)**: Analiza el contenido de la imagen (entropía/detección de rostros) para encuadrar automáticamente según el formato de impresión.
- **🖼️ Motor de Layouts Modular**:
  - Soporte para múltiples plantillas: Carnet (3x4), Carnet Plus (Híbrido), Postal (10x15), Cédula, y más.
  - Generación dinámica de rejillas de impresión mediante `layouts.ts`.
- **📄 Exportación de Alta Fidelidad**: Generación de Documentos PDF listos para impresión profesional con escala de alta resolución.
- **🔑 Gestión de Licencias & Cloud**:
  - Activación por licencia mediante Supabase.
  - Sincronización opcional de galería en la nube.
- **💾 Almacenamiento Robusto**: Uso de IndexedDB para gestión de grandes volúmenes de fotos locales sin pérdida de rendimiento.
- **📱 Responsive & Desktop Ready**: Interfaz optimizada tanto para tablets/móviles como para entornos de escritorio (.EXE).

## 🛠️ Tecnologías

- **Frontend**: React 19, TypeScript, Tailwind CSS 4.
- **Estado**: Zustand (Estado global), context-based state.
- **Animaciones**: Framer Motion.
- **Procesamiento de Imagen**: `smartcrop.js`, `@imgly/background-removal`, `react-easy-crop`.
- **Documentación**: `jsPDF`, `html2canvas`.
- **Backend/DB**: Supabase (Auth/DB), IndexedDB.

## 📦 Instalación

1.  Clona el repositorio:
    ```bash
    git clone https://github.com/tu-usuario/photo-print-kiosk.git
    cd photo-print-kiosk
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    ```

3.  Configura las variables de entorno:
    Copia `.env.example` a `.env` y añade tus credenciales de Supabase y Gemini.

4.  Inicia el modo desarrollo:
    ```bash
    npm run dev
    ```

## 🏗️ Arquitectura del Código

El proyecto sigue una estructura modular y escalable:

- `src/components/`: Componentes UI reutilizables y módulos complejos como el Editor y la Galería.
- `src/hooks/`: Lógica de negocio encapsulada (Impresión, IA, Licencias).
- `src/lib/`: Servicios de infraestructura (Layouts, PDF, Storage, Supabase).
- `src/store/`: Gestión de estado persistente con Zustand.

## 📜 Licencia

Este software incluye un sistema de validación de licencias corporativas. Consulte con Nexo Network Ec para términos de uso comercial.

---
Optimizado por AI Studio Build.
