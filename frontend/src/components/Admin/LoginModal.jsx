import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { loginSchema } from '../../utils/schemas';

export default function LoginModal({
  showLoginModal,
  setShowLoginModal,
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,
  adminLoggingIn,
  handleAdminLogin
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: adminUsername || '',
      password: adminPassword || ''
    }
  });

  if (!showLoginModal) return null;

  const onValidSubmit = (data) => {
    setAdminUsername(data.username);
    setAdminPassword(data.password);
    handleAdminLogin(null, data.username, data.password);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800 relative overflow-hidden">
        <div className="text-center space-y-2 mb-6">
          <Lock className="w-10 h-10 text-primary-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yönetici Girişi</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">Lütfen kullanıcı bilgilerinizi doğrulayın.</p>
        </div>

        <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block">Kullanıcı Adı</label>
            <input
              type="text"
              {...register('username', {
                onChange: (e) => setAdminUsername(e.target.value)
              })}
              placeholder="admin"
              className={`w-full bg-white dark:bg-gray-950 border ${
                errors.username ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
              } rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-gray-200`}
            />
            {errors.username && <p className="text-xs text-red-500 ml-1">{errors.username.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block">Şifre</label>
            <input
              type="password"
              {...register('password', {
                onChange: (e) => setAdminPassword(e.target.value)
              })}
              placeholder="••••••••"
              className={`w-full bg-white dark:bg-gray-950 border ${
                errors.password ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
              } rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-gray-200`}
            />
            {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={adminLoggingIn}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-xs font-semibold text-white transition flex items-center justify-center"
            >
              {adminLoggingIn ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
