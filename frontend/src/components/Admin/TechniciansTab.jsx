import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Trash2, Shield, User, Key } from 'lucide-react';
import { technicianSchema } from '../../utils/schemas';

export default function TechniciansTab({
  crmTechnicians,
  handleCreateTechnician,
  handleDeleteTechnician,
  loadingCrmData
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(technicianSchema),
    defaultValues: {
      name: '',
      username: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    const success = await handleCreateTechnician(data.name, data.username, data.password);
    if (success) {
      reset();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Add Technician Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-gray-800 pb-3">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Yeni Usta Ekle</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-sans">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 block">Usta Adı Soyadı</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Örn: Ahmet Usta"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.name ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-xl py-2.5 pl-10 pr-3 text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-gray-200 transition-all`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 block">Kullanıcı Adı (Giriş için)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Shield className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="text"
                  {...register('username')}
                  placeholder="Örn: ahmet_usta"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.username ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-xl py-2.5 pl-10 pr-3 text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-gray-200 transition-all`}
                />
              </div>
              {errors.username && <p className="text-xs text-red-500 ml-1">{errors.username.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 block">Şifre</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Key className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="Minimum 6 karakter"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.password ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-xl py-2.5 pl-10 pr-3 text-xs focus:outline-none focus:border-blue-500 text-slate-800 dark:text-gray-200 transition-all`}
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loadingCrmData}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg transition disabled:opacity-50"
            >
              Ustayı Kaydet
            </button>
          </form>
        </div>
      </div>

      {/* Technician List Table */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-gray-800 pb-3">Kayıtlı Ustalarımız</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 dark:text-gray-400">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-800 dark:text-gray-200">
                  <th className="py-3 px-4 whitespace-nowrap">Usta ID</th>
                  <th className="py-3 px-4 min-w-[150px]">Adı Soyadı</th>
                  <th className="py-3 px-4 whitespace-nowrap">Kullanıcı Adı</th>
                  <th className="py-3 px-4 whitespace-nowrap">Eklenme Tarihi</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {crmTechnicians && crmTechnicians.length > 0 ? (
                  crmTechnicians.map((tech, i) => (
                    <tr key={tech.id || i} className="border-b border-slate-200 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-900/10">
                      <td className="py-3 px-4 font-mono text-xs">{tech.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{tech.name}</td>
                      <td className="py-3 px-4">{tech.username}</td>
                      <td className="py-3 px-4 text-[10px]">
                        {tech.created_at ? new Date(tech.created_at).toLocaleDateString('tr-TR') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteTechnician(tech.id)}
                          className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-500/10 hover:border-red-500/30 text-red-400 transition"
                          title="Ustayı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 dark:text-gray-500">
                      Henüz kayıtlı usta bulunmuyor. Sol taraftaki formdan ekleyebilirsiniz.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
