import React from 'react';
import { FileText } from 'lucide-react';

export const AdminLogs: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
      <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">Logs de Auditoría</h2>
      <p className="text-slate-500 max-w-sm mx-auto">
        Aquí podrás ver cada acción realizada por los usuarios. Actualmente los logs están siendo capturados en Supabase Auth Audit.
      </p>
    </div>
  );
};
