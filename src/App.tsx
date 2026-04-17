import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { LicenseGuard } from './components/LicenseGuard';
import { LicenseProvider } from './context/LicenseContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import { Loader2 } from 'lucide-react';

// Lazy load components for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const PhotoPrintCreator = React.lazy(() => import('./components/PhotoPrintCreator').then(module => ({ default: module.PhotoPrintCreator })));

// Fallback loader component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center h-full bg-slate-50">
    <div className="flex flex-col items-center gap-3 text-indigo-600">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-sm font-medium animate-pulse">Cargando módulo...</span>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <LicenseProvider>
        <LicenseGuard>
          <Router>
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/photo-print/:templateId" element={<PhotoPrintCreator />} />
                </Routes>
              </Suspense>
            </MainLayout>
          </Router>
        </LicenseGuard>
      </LicenseProvider>
    </ErrorBoundary>
  );
}
