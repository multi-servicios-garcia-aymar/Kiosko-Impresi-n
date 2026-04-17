import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [
      react(), 
      tailwindcss(),
    ],
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://bxwjaljtkwvninohsesn.supabase.co"),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4d2phbGp0a3d2bmlub2hzZXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDYyNzgsImV4cCI6MjA4ODE4MjI3OH0.REtIkQv6jo85nGtDoqiUiDN78ov0b08s39xa8RuvxGY"),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
