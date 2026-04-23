import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AdminSecurity: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
      <ShieldCheck className="w-12 h-12 text-indigo-100 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">Configuración de Seguridad</h2>
      <p className="text-slate-500 max-w-sm mx-auto">
        Las reglas de seguridad RLS son aplicadas directamente desde Supabase para garantizar protección de Grado Bancario.
      </p>
    </div>
  );
};
