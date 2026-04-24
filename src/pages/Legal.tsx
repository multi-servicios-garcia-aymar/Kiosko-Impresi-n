import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, ChevronLeft, Lock, Scale, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';

type LegalTab = 'terms' | 'privacy';

export default function Legal() {
  const [activeTab, setActiveTab] = useState<LegalTab>('terms');
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
      <SEO 
        title={activeTab === 'terms' ? 'Términos y Condiciones' : 'Política de Privacidad'}
        description="Información legal sobre el uso del Kiosko de Impresión Nexo Network Ec."
      />
      
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-6 hover:translate-x-[-4px] transition-transform group"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al Inicio
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Información Legal</h1>
              <p className="text-indigo-10/70 text-sm font-medium">Nexo Network Ec - Centro de Soluciones Tecnológicas</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                activeTab === 'terms' 
                  ? 'bg-indigo-50/50 text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Scale className="w-4 h-4" />
              Términos y Condiciones
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                activeTab === 'privacy' 
                  ? 'bg-indigo-50/50 text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Lock className="w-4 h-4" />
              Política de Privacidad
            </button>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12 prose prose-slate max-w-none">
            {activeTab === 'terms' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="terms"
              >
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <FileText className="w-6 h-6" />
                    <h2 className="text-2xl font-bold m-0 uppercase tracking-tight">Términos de Servicio</h2>
                  </div>
                  
                  <p>Bienvenido al Kiosko de Impresión Nexo Network Ec. Al utilizar nuestra aplicación, usted acepta cumplir con los siguientes términos y condiciones:</p>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">1. Uso del Software</h3>
                    <p>Este software es propiedad de Nexo Network Ec y está diseñado para el procesamiento de imágenes e impresión fotográfica. El uso comercial o reventa del software sin la debida licencia está estrictamente prohibido.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">2. Responsabilidad de Contenido</h3>
                    <p>El usuario es el único responsable de las imágenes que procesa e imprime. Nexo Network Ec no se hace responsable por el uso de imágenes protegidas por derechos de autor o contenido ilegal cargado por el usuario.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">3. Licenciamiento</h3>
                    <p>El software requiere una licencia activa para su funcionamiento pleno. La alteración, ingeniería inversa o bypass del sistema de licencias invalidará automáticamente cualquier garantía de servicio.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">4. Garantías</h3>
                    <p>Nexo Network Ec se esfuerza por mantener el sistema en funcionamiento continuo, sin embargo, no garantizamos la disponibilidad ininterrumpida del servicio de sincronización en la nube.</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4 text-amber-800 text-sm">
                    <Info className="w-5 h-5 shrink-0" />
                    <p className="m-0">Nos reservamos el derecho de modificar estos términos en cualquier momento para reflejar cambios en la legislación o el servicio.</p>
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="privacy"
              >
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Shield className="w-6 h-6" />
                    <h2 className="text-2xl font-bold m-0 uppercase tracking-tight">Privacidad de Datos</h2>
                  </div>

                  <p>En Nexo Network Ec, valoramos su privacidad. Esta política detalla cómo manejamos la información dentro de nuestra aplicación de kiosko:</p>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">1. Recolección de Imágenes</h3>
                    <p>Las imágenes cargadas al Kiosko se almacenan temporalmente en la nube de Supabase únicamente para facilitar su procesamiento y sincronización entre dispositivos del mismo usuario.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">2. Seguridad de los Archivos</h3>
                    <p>Utilizamos cifrado y políticas de seguridad a nivel de base de datos (RLS) para asegurar que solo el usuario propietario pueda acceder a sus fotografías.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">3. Eliminación de Datos</h3>
                    <p>El sistema cuenta con funciones para eliminar manualmente las fotos de la galería. Periódicamente, Nexo Network Ec puede realizar limpiezas de caché para optimizar el rendimiento del servidor.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">4. Información del Dispositivo</h3>
                    <p>Generamos un identificador de hardware (Hardware ID) único para vincular sus sesiones de trabajo a su máquina física sin necesidad de recolectar datos biométricos o personales invasivos.</p>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-4 text-indigo-800 text-sm">
                    <Lock className="w-5 h-5 shrink-0" />
                    <p className="m-0">Sus datos nunca son vendidos ni compartidos con terceros con fines publicitarios.</p>
                  </div>
                </section>
              </motion.div>
            )}
          </div>
        </motion.div>
        
        <div className="mt-12 text-center">
          <p className="text-slate-400 text-xs italic">
            © {new Date().getFullYear()} Nexo Network Ec. Todos los derechos reservados.
            <br />
            Última actualización: Abril 2026
          </p>
        </div>
      </div>
    </div>
  );
}
