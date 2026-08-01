import React, { useState } from 'react';
import { Download, Search, Users } from 'lucide-react';
import { api } from '../../services/api';

export default function CustomersTab({ crmCustomers = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCustomers = crmCustomers.filter(c =>
    (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const currentItems = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDownloadCsv = () => {
    const token = sessionStorage.getItem('adminToken');
    window.open(`${api.getBackendUrl()}/api/admin/export/customers?token=${token}`, '_blank');
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Kayıtlı Müşteri Listesi ({filteredCustomers.length})</h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="İsim, telefon veya adres ara..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            CSV İndir
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-500 dark:text-gray-400">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-800 dark:text-gray-200">
              <th className="py-3 px-4 whitespace-nowrap">ID</th>
              <th className="py-3 px-4 min-w-[150px]">Müşteri Adı</th>
              <th className="py-3 px-4 whitespace-nowrap">Telefon</th>
              <th className="py-3 px-4 min-w-[200px]">Adres</th>
              <th className="py-3 px-4 whitespace-nowrap">Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((cust, i) => (
                <tr key={i} className="border-b border-slate-200 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-900/20">
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">#{cust.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{cust.name}</td>
                  <td className="py-3 px-4 font-mono text-xs">{cust.phone}</td>
                  <td className="py-3 px-4 text-xs">{cust.address || 'Girilmedi'}</td>
                  <td className="py-3 px-4 text-xs">{new Date(cust.created_at).toLocaleDateString('tr-TR')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                  Kayıtlı müşteri bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-gray-800 text-xs">
          <span className="text-slate-500 dark:text-gray-400">
            Sayfa {currentPage} / {totalPages} (Toplam {filteredCustomers.length} müşteri)
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-gray-800 transition"
            >
              Önceki
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-gray-800 transition"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
