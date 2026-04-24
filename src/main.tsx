import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { configService } from './services/ConfigService';
import { logger } from './services/LoggerService';
import './index.css';

const container = document.getElementById('root')!;
const root = createRoot(container);

// Initialize Global Telemetry
logger.setupGlobalHandlers();

// Service Worker Registration with Update Handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('✅ Service Worker registrado');
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ Nueva versión disponible. Recargando...');
              window.location.reload();
            }
          });
        }
      });
    }).catch(error => {
      console.error('❌ Error al registrar Service Worker:', error);
    });
  });
}

const init = async () => {
  await configService.initialize();
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

init();
