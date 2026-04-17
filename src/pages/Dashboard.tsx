import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { KioskButton } from '../components/KioskButton';
import { usePhotoStore } from '../store/usePhotoStore';
import { DEFAULT_TEMPLATES } from '../types/photo';

export default function Dashboard() {
  const navigate = useNavigate();
  const { templates, setTemplates } = usePhotoStore();

  useEffect(() => {
    const savedTemplates = localStorage.getItem('customPhotoTemplates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setTemplates([...DEFAULT_TEMPLATES, ...parsed]);
      } catch (e) {
        console.error('Failed to parse custom templates', e);
      }
    }
  }, [setTemplates]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 h-full overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center md:text-left"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Centro de <span className="text-indigo-600">Impresión Fotográfica</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl">
          Selecciona el formato de impresión que necesitas. Configura tus fotos para documentos o impresión postal con precisión milimétrica.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {templates.map((template) => (
          <KioskButton
            key={template.id}
            icon={template.id === 'carnet' || template.id === 'passport' ? User : ImageIcon}
            label={template.name}
            color="bg-white"
            onClick={() => navigate(`/photo-print/${template.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
