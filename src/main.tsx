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

const init = async () => {
  await configService.initialize();
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

init();
