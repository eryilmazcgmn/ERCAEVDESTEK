import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Info, Plus, Trash2, X, HelpCircle } from 'lucide-react';

export default function PricingTab({
  crmPrices,
  crmServices,
  handleBulkUpdatePrices,
  handleCreateServicePrice,
  handleDeleteServicePrice,
  loadingCrmData,
  fetchCrmPrices
}) {
  const [activeService, setActiveService] = useState('paint');
  const [localPrices, setLocalPrices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestionForm, setNewQuestionForm] = useState({
    service_type: 'paint',
    question_title: '',
    option_value: '',
    price: 0
  });

  // Default fallbacks for categories if crmServices is loading
  const fallbackCategories = [
    { id: 'paint', name: 'Boyama & Dekorasyon' },
    { id: 'tv-mount', name: 'TV Montajı & Askı' },
    { id: 'plumbing', name: 'Sıhhi Tesisat & Onarım' },
    { id: 'electric', name: 'Elektrik Tesisatı & Arıza' }
  ];

  const serviceCategories = (crmServices && crmServices.length > 0)
    ? crmServices.map(s => ({ id: s.slug || s.id, name: s.name }))
    : fallbackCategories;

  // Set active service default if current activeService is not in categories
  useEffect(() => {
    if (serviceCategories.length > 0 && !serviceCategories.some(c => c.id === activeService)) {
      setActiveService(serviceCategories[0].id);
    }
  }, [serviceCategories]);

  // Sync local state when crmPrices updates
  useEffect(() => {
    setLocalPrices((crmPrices || []).map(p => ({ ...p })));
  }, [crmPrices]);

  // Filter local prices by selected service and search query
  const filteredPrices = localPrices.filter(p => {
    const matchesService = p.service_type === activeService;
    const matchesSearch = !searchTerm.trim() || 
      (p.label && p.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.option_value && p.option_value.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesService && matchesSearch;
  });

  // Group by question_id (to keep it organized)
  const groupedPrices = filteredPrices.reduce((groups, item) => {
    const group = groups[item.question_id] || [];
    group.push(item);
    groups[item.question_id] = group;
    return groups;
  }, {});

  const handlePriceChange = (id, newPrice) => {
    setLocalPrices(prev =>
      prev.map(p => (p.id === id ? { ...p, price: parseInt(newPrice) || 0 } : p))
    );
  };

  const onSave = () => {
    const updatedList = localPrices.map(p => ({
      id: p.id,
      price: p.price
    }));
    handleBulkUpdatePrices(updatedList);
  };

  const openAddModal = () => {
    setNewQuestionForm({
      service_type: activeService,
      question_title: '',
      option_value: '',
      price: 0
    });
    setShowAddModal(true);
  };

  const handleAddQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestionForm.question_title.trim() || !newQuestionForm.option_value.trim()) return;

    // Slugify question_title into question_id
    const question_id = newQuestionForm.question_title.toLowerCase()
      .replace(/[çÇ]/g, 'c').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[ıİ]/g, 'i')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const label = `${newQuestionForm.question_title.trim()}: ${newQuestionForm.option_value.trim()}`;

    const payload = {
      service_type: newQuestionForm.service_type,
      question_id,
      option_value: newQuestionForm.option_value.trim(),
      label,
      price: parseInt(newQuestionForm.price) || 0
    };

    const success = await handleCreateServicePrice(payload);
    if (success) {
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-gray-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dinamik Soru & Fiyat Yönetimi</h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Seçilen hizmetler için detay sorularını, seçeneklerini ve teklif fiyatlarını bu ekrandan yönetebilir, yeni soru ve seçenekler ekleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={openAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-800 dark:text-white text-sm font-semibold border border-slate-200 dark:border-gray-700 transition"
          >
            <Plus className="w-4 h-4 text-blue-500" />
            Yeni Soru / Seçenek Ekle
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loadingCrmData || localPrices.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/20 transition disabled:opacity-50"
          >
            {loadingCrmData ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>

      {/* Service Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-slate-200 dark:border-gray-800 pb-2">
        <div className="flex overflow-x-auto gap-2 scrollbar-none">
          {serviceCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveService(cat.id)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 ${
                activeService === cat.id
                  ? 'border-blue-500 text-blue-400 bg-blue-950/10'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Fiyat veya soru kalemi ara..."
          className="w-full md:w-56 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex gap-3 items-start">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Bilgilendirme:</strong> Her bir hizmet kategorisine dilediğiniz kadar soru ve seçenek ekleyebilirsiniz. Eklediğiniz soru ve seçenekler müşterilerin dolduracağı dinamik teklif formunda (Adım 2) anında canlıya yansır.
        </div>
      </div>

      {/* Add New Question/Option Modal */}
      {showAddModal && (
        <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Yeni Soru & Seçenek Ekle</h3>
            </div>
            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleAddQuestionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1">Hizmet Kategori</label>
                <select
                  value={newQuestionForm.service_type}
                  onChange={(e) => setNewQuestionForm(prev => ({ ...prev, service_type: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                >
                  {serviceCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1">Soru Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Klima Tipi, Tavan Yüksekliği..."
                  value={newQuestionForm.question_title}
                  onChange={(e) => setNewQuestionForm(prev => ({ ...prev, question_title: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1">Seçenek Metni *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Duvar Tipi Split, 55-65 inç arası..."
                  value={newQuestionForm.option_value}
                  onChange={(e) => setNewQuestionForm(prev => ({ ...prev, option_value: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1">Ek Fiyat (₺)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newQuestionForm.price}
                  onChange={(e) => setNewQuestionForm(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-gray-900 text-slate-700 dark:text-gray-300 text-sm font-semibold hover:bg-slate-200 transition"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold transition"
              >
                Soru & Seçeneği Ekle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pricing Inputs Grouped by Question */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(groupedPrices).length > 0 ? (
          Object.keys(groupedPrices).map(questionId => {
            const items = groupedPrices[questionId];
            const questionTitle = items[0]?.label.split(':')[0] || questionId;

            return (
              <div key={questionId} className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-gray-800 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 capitalize">
                    {questionTitle}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-gray-600 bg-slate-100 dark:bg-gray-900 px-2 py-0.5 rounded">{questionId}</span>
                </div>

                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center gap-3">
                      <span className="text-xs text-slate-600 dark:text-gray-400 font-medium flex-1 min-w-0 truncate">
                        {item.label.split(':')[1]?.trim() || item.option_value}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          className="w-24 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-right text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-xs text-slate-400 dark:text-gray-500 font-semibold">TL</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteServicePrice(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                          title="Seçeneği Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-gray-500 text-sm">
            Bu hizmet kategorisi için henüz detay sorusu ve seçeneği eklenmemiş. Yukarıdaki <strong>"+ Yeni Soru / Seçenek Ekle"</strong> butonuna basarak ilk sorunuzu oluşturun.
          </div>
        )}
      </div>
    </div>
  );
}
