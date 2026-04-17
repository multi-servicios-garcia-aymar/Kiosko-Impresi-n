import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, MailCheck, ArrowLeft } from 'lucide-react';
import { Logo } from './ui/Logo';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validación pre-vuelo para registro
    if (!isLogin && password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Este correo electrónico ya está en uso. Por favor, inicia sesión.');
        }

        setShowSuccessScreen(true);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let errorMsg = err.message || 'Error en la autenticación';
      
      if (errorMsg.toLowerCase().includes('email not confirmed')) {
        errorMsg = 'Debes verificar tu bandeja de correo antes de iniciar sesión.';
      } else if (errorMsg.toLowerCase().includes('invalid login credentials')) {
        errorMsg = 'Correo o contraseña incorrectos.';
      } else if (errorMsg.toLowerCase().includes('user already registered')) {
        errorMsg = 'Este correo electrónico ya está registrado. Por favor, inicia sesión.';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccessScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
            <MailCheck className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Revisa tu correo</h2>
          <p className="text-slate-500 mb-6 font-medium">
            Hemos enviado un enlace de confirmación a <span className="text-slate-800 font-bold">{email}</span>.
            Por favor, revisa tu bandeja de entrada o la carpeta de correo no deseado (SPAM) para activar tu cuenta.
          </p>
          <button
            onClick={() => {
              setShowSuccessScreen(false);
              setIsLogin(true);
              setPassword('');
              setConfirmPassword('');
            }}
            className="w-full flex justify-center items-center gap-2 bg-slate-50 text-slate-700 rounded-xl py-3.5 px-4 font-bold hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex justify-center">
              <Logo size="lg" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <p className="text-slate-500 mt-2">
              Sincroniza tus configuraciones y accede desde cualquier dispositivo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white rounded-xl py-3.5 px-4 font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                isLogin ? 'Ingresar a mi cuenta' : 'Registrarme ahora'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
            <span className="text-slate-500">
              {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes cuenta?"}
            </span>{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
