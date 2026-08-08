import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Save, X, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const AVAILABLE_ICONS = [
  'Wrench', 'FlameKindling', 'Droplet', 'Zap', 'Hammer', 'PaintBucket',
  'Lightbulb', 'Fan', 'Thermometer', 'Shield', 'Home', 'Key',
  'Drill', 'Plug', 'Pipette', 'Brush', 'Shovel', 'Cog',
  'WashingMachine', 'AirVent', 'Sofa', 'DoorOpen', 'Lock', 'Wifi'
];

const COLOR_OPTIONS = [
  { value: 'text-primary-400', label: 'Mor', preview: '#c084fc' },
  { value: 'text-yellow-400', label: 'Sarı', preview: '#facc15' },
  { value: 'text-blue-400', label: 'Mavi', preview: '#60a5fa' },
  { value: 'text-red-400', label: 'Kırmızı', preview: '#f87171' },
  { value: 'text-green-400', label: 'Yeşil', preview: '#4ade80' },
  { value: 'text-orange-400', label: 'Turuncu', preview: '#fb923c' },
  { value: 'text-pink-400', label: 'Pembe', preview: '#f472b6' },
  { value: 'text-cyan-400', label: 'Cyan', preview: '#22d3ee' },
  { value: 'text-emerald-400', label: 'Zümrüt', preview: '#34d399' },
  { value: 'text-indigo-400', label: 'İndigo', preview: '#818cf8' },
];

const emptyService = {
  name: '',
  slug: '',
  description: '',
  icon: 'Wrench',
  color: 'text-primary-400',
  sort_order: 0,
  is_active: true,
  min_price: 0,
};

function getIconComponent(iconName) {
  return LucideIcons[iconName] || LucideIcons.Wrench;
}

export default function ServicesTab({
  crmServices,
  handleCreateService,
  handleUpdateService,
  handleDeleteService,
  loadingCrmData
}) {
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyService });
  const [showForm, setShowForm] = useState(false);

  const startCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyService, sort_order: (crmServices?.length || 0) + 1 });
    setShowForm(true);
  };

  const startEdit = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name || '',
      slug: service.slug || '',
      description: service.description || '',
      icon: service.icon || 'Wrench',
      color: service.color || 'text-primary-400',
      sort_order: service.sort_order || 0,
      is_active: service.is_active ?? true,
      min_price: service.min_price || 0,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyService });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Auto-generate slug from name
    if (field === 'name' && !editingId) {
      const slug = value.toLowerCase()
        .replace(/[çÇ]/g, 'c').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
        .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[ıİ]/g, 'i')
        .replace(/[&]/g, 've').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) return;
    const success = editingId
      ? await handleUpdateService(editingId, formData)
      : await handleCreateService(formData);
    if (success) cancelForm();
  };

  const handleMoveUp = async (service) => {
    const sorted = [...crmServices].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(s => s.id === service.id);
    if (idx <= 0) return;
    await handleUpdateService(sorted[idx].id, { sort_order: sorted[idx - 1].sort_order });
    await handleUpdateService(sorted[idx - 1].id, { sort_order: sorted[idx].sort_order });
  };

  const handleMoveDown = async (service) => {
    const sorted = [...crmServices].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(s => s.id === service.id);
    if (idx >= sorted.length - 1) return;
    await handleUpdateService(sorted[idx].id, { sort_order: sorted[idx + 1].sort_order });
    await handleUpdateService(sorted[idx + 1].id, { sort_order: sorted[idx].sort_order });
  };

  const sortedServices = [...(crmServices || [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-gray-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hizmet Yönetimi</h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Anasayfada görünen hizmetleri buradan ekleyebilir, düzenleyebilir ve sıralayabilirsiniz.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/20 transition"
        >
          <Plus className="w-4 h-4" />
          Yeni Hizmet Ekle
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              {editingId ? 'Hizmeti Düzenle' : 'Yeni Hizmet Oluştur'}
            </h3>
            <button onClick={cancelForm} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Hizmet Adı *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Örn: Klima Bakımı"
                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">URL Kodu (Slug) *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="Örn: klima-bakimi"
                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition font-mono"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Kısa Açıklama</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Örn: Ev ve ofis klima bakım hizmeti"
                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">İkon</label>
              <div className="grid grid-cols-6 gap-2 p-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl max-h-32 overflow-y-auto">
                {AVAILABLE_ICONS.map(iconName => {
                  const IconComp = getIconComponent(iconName);
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => handleChange('icon', iconName)}
                      title={iconName}
                      className={`p-2 rounded-lg transition ${formData.icon === iconName
                        ? 'bg-primary-100 dark:bg-primary-900/40 border border-primary-300 dark:border-primary-600'
                        : 'hover:bg-slate-100 dark:hover:bg-gray-800 border border-transparent'
                      }`}
                    >
                      <IconComp className="w-5 h-5 text-slate-600 dark:text-gray-300" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Renk</label>
              <div className="grid grid-cols-5 gap-2 p-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl">
                {COLOR_OPTIONS.map(col => (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => handleChange('color', col.value)}
                    title={col.label}
                    className={`w-8 h-8 rounded-full border-2 transition ${formData.color === col.value
                      ? 'border-white dark:border-gray-200 scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: col.preview }}
                  />
                ))}
              </div>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Başlangıç Fiyatı (₺)</label>
              <input
                type="number"
                min="0"
                value={formData.min_price}
                onChange={(e) => handleChange('min_price', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-end gap-3 pb-1">
              <button
                type="button"
                onClick={() => handleChange('is_active', !formData.is_active)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
                  formData.is_active
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400'
                    : 'bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400'
                }`}
              >
                {formData.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {formData.is_active ? 'Aktif (Müşteriler görebilir)' : 'Pasif (Gizli)'}
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-gray-800">
            <button
              onClick={cancelForm}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800 transition"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || !formData.slug.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </div>
      )}

      {/* Service List */}
      <div className="space-y-3">
        {sortedServices.length > 0 ? (
          sortedServices.map((service, idx) => {
            const IconComp = getIconComponent(service.icon);
            const colorEntry = COLOR_OPTIONS.find(c => c.value === service.color);
            return (
              <div
                key={service.id}
                className={`glass-panel rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all ${
                  service.is_active
                    ? 'border-slate-200 dark:border-gray-800'
                    : 'border-slate-200/50 dark:border-gray-800/50 opacity-60'
                }`}
              >
                {/* Reorder & Icon */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMoveUp(service)}
                      disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-20 transition"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(service)}
                      disabled={idx === sortedServices.length - 1}
                      className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-20 transition"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                  <div
                    className="p-3 rounded-xl border border-slate-200 dark:border-gray-700"
                    style={{ color: colorEntry?.preview || '#c084fc' }}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-gray-200">{service.name}</span>
                    {!service.is_active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500 font-semibold">GİZLİ</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{service.description || '—'}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-gray-600 bg-slate-100 dark:bg-gray-900 px-2 py-0.5 rounded">{service.slug}</span>
                    {service.min_price > 0 && (
                      <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">₺{service.min_price.toLocaleString('tr-TR')}'den</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(service)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 transition"
                    title="Düzenle"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 transition"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-400 dark:text-gray-500 text-sm">
            {loadingCrmData ? 'Hizmetler yükleniyor...' : 'Henüz hizmet eklenmemiş. "Yeni Hizmet Ekle" butonunu kullanarak başlayın.'}
          </div>
        )}
      </div>
    </div>
  );
}
