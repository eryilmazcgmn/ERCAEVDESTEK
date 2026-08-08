import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, X, Save, Percent, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { api } from '../../services/api';
import { toast } from 'sonner';

export default function CouponsTab({ adminToken }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    type: 'fixed',
    value: 50,
    min_order_amount: 0,
    max_uses: 100
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${api.getApiUrl()}/admin/coupons`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setCoupons(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [adminToken]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${api.getApiUrl()}/admin/coupons`, formData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('İndirim kuponu başarıyla oluşturuldu!');
      setShowAddModal(false);
      setFormData({ code: '', type: 'fixed', value: 50, min_order_amount: 0, max_uses: 100 });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kupon oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Bu kuponu silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`${api.getApiUrl()}/admin/coupons/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Kupon silindi.');
      fetchCoupons();
    } catch (err) {
      toast.error('Kupon silinemedi.');
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-500" />
            İndirim Kodu ve Kupon Yönetimi
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            Müşterilerinizin teklif ekranında kullanabileceği özel indirim kodları tanımlayın.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/20"
        >
          <Plus className="w-4 h-4" />
          Yeni Kupon Oluştur
        </button>
      </div>

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                Yeni İndirim Kuponu
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase mb-1">
                  Kupon Kodu
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  required
                  placeholder="Örn: HOSGELDIN50"
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase mb-1">
                    İndirim Tipi
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="fixed">Sabit Tutar (TL)</option>
                    <option value="percent">Yüzdesel (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase mb-1">
                    İndirim Miktarı
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    required
                    placeholder="Örn: 50 veya 10"
                    className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase mb-1">
                    Min. Sipariş Tutarı (TL)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase mb-1">
                    Maks. Kullanım Adeti
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 100 }))}
                    placeholder="100"
                    className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 text-slate-700 dark:text-gray-300 text-xs font-semibold hover:bg-slate-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Kaydediliyor...' : 'Kuponu Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-400 uppercase tracking-wider font-bold">
              <th className="py-3 px-4">Kupon Kodu</th>
              <th className="py-3 px-4">İndirim Tipi / Değer</th>
              <th className="py-3 px-4">Min. Tutar</th>
              <th className="py-3 px-4">Kullanım</th>
              <th className="py-3 px-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800/60">
            {coupons.length > 0 ? (
              coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-900/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-emerald-500" />
                    {coupon.code}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-gray-300">
                    {coupon.type === 'percent' ? `%${coupon.value} İndirim` : `₺${coupon.value} TL İndirim`}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-gray-400">
                    {coupon.min_order_amount > 0 ? `₺${coupon.min_order_amount} TL` : 'Sınırsız'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-gray-400 font-mono">
                    {coupon.used_count} / {coupon.max_uses || '∞'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                      title="Kuponu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400 dark:text-gray-500">
                  Henüz indirim kuponu oluşturulmamış. YUKARIDAKİ <strong>"+ Yeni Kupon Oluştur"</strong> butonuna basarak ilk kuponunuzu ekleyin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
