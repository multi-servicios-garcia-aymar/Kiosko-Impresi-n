# 📸 Nexo Kiosko Fotos
> **Industrial-grade Kiosk Solution for Photography & Smart Printing.**

[![Project Status: Active](https://img.shields.io/badge/Project_Status-Active-emerald.svg)](https://github.com/nexo-network/kiosko-fotos)
[![License: Commercial](https://img.shields.io/badge/License-Commercial-indigo.svg)](LICENSE)
[![Built with: React 19](https://img.shields.io/badge/Frontend-React_19-blue.svg)](https://react.dev/)
[![Backend: Supabase](https://img.shields.io/badge/Backend-Supabase-emerald.svg)](https://supabase.com/)
[![Style: Tailwind 4](https://img.shields.io/badge/Style-Tailwind_4-38b2ac.svg)](https://tailwindcss.com/)

**Nexo Kiosko Fotos** is a comprehensive software suite designed for modern photo printing stations. Built for **Nexo Network Ec**, it leverages localized Edge AI for image processing while maintaining real-time cloud synchronization for management and advertising.

---

## 📖 Table of Contents
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Database Setup](#-database-setup)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Support](#-support)

---

## ✨ Core Features

### 🤖 Smart Edge AI
- **Automated Background Removal**: Instant masking of complex backgrounds directly in the browser using WASM-powered ML models.
- **Intelligent SmartCrop**: Face-aware cropping for official formats (Carnet, Passport, Postcard).
- **Offline Resilience**: Essential features work without an internet connection once initialized.

### 📢 Dynamic Ads Engine
- **Cloud-Synced Campaigns**: Manage carousels, sidebar banners, and CTAs remotely.
- **Real-time Delivery**: Instant deployment of new media to physical kiosks via Supabase Realtime.
- **Priority Management**: Rule-based ad display logic.

### 🖨️ Professional Printing
- **Layout Templates**: Grid-based generation for various print sizes (3x4, 10x15, A4).
- **High-Fidelity PDF Export**: Precision-engineered for professional printer drivers.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Database/Auth**: [Supabase](https://supabase.com/) (Postgres, RLS, Storage)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Motion](https://motion.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **AI Libraries**: `@imgly/background-removal`, `smartcrop`
- **PDF Engine**: `jspdf` & `html2canvas`

---

## 🚀 Getting Started

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/nexo-network/kiosko-fotos.git
cd kiosko-fotos

# Install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Fill in your `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.

### 3. Database Initialization
1.  Navigate to your **Supabase Dashboard**.
2.  Open the **SQL Editor**.
3.  Paste and run the contents of [`SUPABASE_MASTER_SETUP.sql`](./SUPABASE_MASTER_SETUP.sql).

---

## 📁 Project Structure

```text
src/
├── components/    # Reusable UI components & Feature modules
├── context/       # Auth and License providers
├── lib/           # Core logic (AI tools, PDF engine, Supabase client)
├── pages/         # Main view entry points (Kiosk, Admin, Login)
├── store/         # Global state (Gallery, Ads, Config)
└── types/         # TypeScript definitions
public/            # Static assets & PWA configuration
```

---

## 📦 Deployment

### Web Deployment (Vercel / Netlify / Cloud Run)
1.  Connect your GitHub repository.
2.  Set the Build Command to `npm run build`.
3.  Set the Output Directory to `dist`.
4.  Configure all Environment Variables from `.env.example`.

### Local Kiosk Deployment
This application is designed as a **PWA (Progressive Web App)**. For physical installation:
1.  Deploy the web version.
2.  Navigate to the URL in a Chromium-based browser.
3.  Click "Install App" to run it as a standalone, chromeless application.

---

## 📜 Proprietary Information & Support

**© 2024 Nexo Network Ec.** All Rights Reserved.
This software is proprietary and intended for commercial use within authorized hardware stations.

- **Developer**: [Nexo Network Ec](https://nexonetwork.ec)
- **Optimization**: Powered by Google AI Studio.

---
*Empowering the next generation of physical printing stations.*
