import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Info } from 'lucide-react';

export default function PricingTab({
  crmPrices,
  handleBulkUpdatePrices,
  loadingCrmData,
  fetchCrmPrices
}) {
  const [activeService, setActiveService] = useState('paint');
  const [localPrices, setLocalPrices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync local state when crmPrices updates
  useEffect(() => {
    setLocalPrices(crmPrices.map(p => ({ ...p })));
  }, [crmPrices]);

  const serviceCategories = [
    { id: 'paint', name: 'Boyama & Dekorasyon' },
    { id: 'tv-mount', name: 'TV Montajı & Askı' },
    { id: 'plumbing', name: 'Sıhhi Tesisat & Onarım' },
    { id: 'electric', name: 'Elektrik Tesisatı & Arıza' }
  ];

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
    // Send updated prices to the parent handler
    const updatedList = localPrices.map(p => ({
      id: p.id,
      price: p.price
    }));
    handleBulkUpdatePrices(updatedList);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-gray-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dinamik Fiyatlandırma Yönetimi</h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Seçilen hizmet tipleri ve kullanılacak malzemelere göre teklif fiyatlarını bu ekrandan yönetebilirsiniz.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={loadingCrmData || localPrices.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/20 transition disabled:opacity-50"
        >
          {loadingCrmData ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Değişiklikleri Kaydet
        </button>
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
          placeholder="Fiyat kalemi ara..."
          className="w-full md:w-56 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Info Warning Banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex gap-3 items-start">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Bilgilendirme:</strong> Değiştirdiğiniz fiyatlar veri tabanına kaydedilecek ve müşterilerin dolduracağı dinamik teklif formlarında anlık olarak geçerli olacaktır. Fiyatı 0 TL olan seçenekler teklif formunda ara toplama eklenmez.
        </div>
      </div>

      {/* Pricing Inputs Grouped by Question */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(groupedPrices).length > 0 ? (
          Object.keys(groupedPrices).map(questionId => {
            const items = groupedPrices[questionId];
            // Format title
            const questionTitle = items[0]?.label.split(':')[0] || questionId;

            return (
              <div key={questionId} className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 border-b border-slate-200 dark:border-gray-800 pb-2 capitalize">
                  {questionTitle}
                </h3>
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center gap-4">
                      <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-gray-500 text-sm">
            Fiyat verileri yüklenemedi. Lütfen sayfayı yenileyin veya migrasyonları çalıştırın.
          </div>
        )}
      </div>
    </div>
  );
}
