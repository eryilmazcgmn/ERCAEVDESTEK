import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Wrench, ArrowLeft, ShieldCheck } from 'lucide-react';
import { loginSchema } from '../utils/schemas';

export default function LoginPage({ adminHook }) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const onValidSubmit = (data) => {
    adminHook.setAdminUsername(data.username);
    adminHook.setAdminPassword(data.password);
    adminHook.handleAdminLogin(null, data.username, data.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090a0f] p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary-500/5 blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to homepage */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 hover:text-primary-500 transition mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Ana Sayfaya Dön
        </button>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-gray-800 p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-500 shadow-lg shadow-primary-900/20 mx-auto">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ERCA Ev Destek</h1>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Yönetici & Usta Paneli Girişi</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">Kullanıcı Adı</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <ShieldCheck className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="text"
                  {...register('username')}
                  placeholder="Kullanıcı adınız"
                  autoComplete="username"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.username ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-gray-200 transition`}
                />
              </div>
              {errors.username && <p className="text-xs text-red-500 ml-1">{errors.username.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">Şifre</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.password ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-gray-200 transition`}
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={adminHook.adminLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-primary-900/20 mt-2"
            >
              {adminHook.adminLoggingIn ? (
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Giriş Yap
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 dark:text-gray-500">
            Bu sayfa sadece yetkili personel içindir.
          </p>
        </div>
      </div>
    </div>
  );
}
