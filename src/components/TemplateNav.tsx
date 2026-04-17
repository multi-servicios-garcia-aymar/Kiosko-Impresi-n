import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { PhotoTemplate } from '../types/photo';

interface TemplateNavProps {
  templates: PhotoTemplate[];
  selectedTemplate: PhotoTemplate;
  onNavigateHome: () => void;
  onSelectTemplate: (id: string) => void;
}

export const TemplateNav: React.FC<TemplateNavProps> = ({
  templates,
  selectedTemplate,
  onNavigateHome,
  onSelectTemplate,
}) => {
  return (
    <div className="mb-4 shrink-0 overflow-x-auto pb-2 print:hidden">
      <div className="flex items-center gap-2 min-w-max">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors mr-1"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="w-4 h-4" />
          Inicio
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1"></div>
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedTemplate.id === template.id
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {template.name}
          </button>
        ))}
      </div>
    </div>
  );
};
