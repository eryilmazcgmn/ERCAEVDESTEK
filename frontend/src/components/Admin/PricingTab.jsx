import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Info, Plus, Trash2, Edit2, X, HelpCircle, Layers, ListFilter, ChevronUp, ChevronDown, GitBranch } from 'lucide-react';

export default function PricingTab({
  crmPrices,
  crmServices,
  handleBulkUpdatePrices,
  handleCreateServicePrice,
  handleDeleteServicePrice,
  handleReorderServiceQuestions,
  handleReorderQuestionOptions,
  handleUpdateServiceQuestion,
  handleDeleteServiceQuestion,
  loadingCrmData,
  fetchCrmPrices
}) {
  const [activeService, setActiveService] = useState('paint');
  const [localPrices, setLocalPrices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('existing'); // 'existing' or 'new'
  
  // Form State
  const [targetQuestionId, setTargetQuestionId] = useState('');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionType, setNewQuestionType] = useState('radio'); // 'radio', 'select', 'number'
  const [optionRows, setOptionRows] = useState([
    { option_value: '', price: 0 }
  ]);

  // Default fallbacks for categories if crmServices is empty
  const fallbackCategories = [
    { id: 'paint', name: 'Boyama & Dekorasyon' },
    { id: 'tv-mount', name: 'TV Montajı & Askı' },
    { id: 'plumbing', name: 'Sıhhi Tesisat & Onarım' },
    { id: 'electric', name: 'Elektrik Tesisatı & Arıza' }
  ];

  const serviceCategories = (crmServices && crmServices.length > 0)
    ? crmServices.map(s => ({ id: s.slug || s.id, name: s.name }))
    : fallbackCategories;

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

  // Group by question_id
  const groupedPrices = filteredPrices.reduce((groups, item) => {
    const group = groups[item.question_id] || [];
    group.push(item);
    groups[item.question_id] = group;
    return groups;
  }, {});

  // Extract unique questions for current active service (for dropdown)
  const currentServiceQuestions = Object.keys(
    localPrices.filter(p => p.service_type === activeService).reduce((acc, item) => {
      const qTitle = item.label ? item.label.split(':')[0].trim() : item.question_id;
      acc[item.question_id] = { id: item.question_id, title: qTitle, type: item.question_type || 'radio' };
      return acc;
    }, {})
  ).map(qId => {
    const item = localPrices.find(p => p.service_type === activeService && p.question_id === qId);
    return {
      id: qId,
      title: item?.label ? item.label.split(':')[0].trim() : qId,
      type: item?.question_type || 'radio'
    };
  });

  const [editQuestionModal, setEditQuestionModal] = useState(null);

  const handlePriceChange = (id, newPrice) => {
    setLocalPrices(prev =>
      prev.map(p => (p.id === id ? { ...p, price: parseInt(newPrice) || 0 } : p))
    );
  };

  const handleLabelChange = (id, newSubText) => {
    setLocalPrices(prev =>
      prev.map(p => {
        if (p.id === id) {
          const parts = (p.label || '').split(':');
          const titlePrefix = parts[0] ? parts[0].trim() : '';
          const newLabel = titlePrefix ? `${titlePrefix}: ${newSubText}` : newSubText;
          return { ...p, label: newLabel, option_value: newSubText };
        }
        return p;
      })
    );
  };

  const handleOpenEditQuestion = (qId, currentTitle, currentType, parentQId = '', parentOptVal = '') => {
    setEditQuestionModal({
      questionId: qId,
      title: currentTitle,
      type: currentType,
      parentQuestionId: parentQId || '',
      parentOptionValue: parentOptVal || ''
    });
  };

  const handleConfirmQuestionEdit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editQuestionModal) return;
    if (handleUpdateServiceQuestion) {
      handleUpdateServiceQuestion(
        activeService,
        editQuestionModal.questionId,
        editQuestionModal.title,
        editQuestionModal.type,
        editQuestionModal.parentQuestionId || null,
        editQuestionModal.parentOptionValue || null
      );
    }
    setEditQuestionModal(null);
  };

  const onSave = () => {
    const updatedList = localPrices.map(p => ({
      id: p.id,
      price: p.price,
      label: p.label
    }));
    handleBulkUpdatePrices(updatedList);
  };

  const [newParentQuestionId, setNewParentQuestionId] = useState('');
  const [newParentOptionValue, setNewParentOptionValue] = useState('');

  const openAddModalForService = (presetQuestionId = '') => {
    if (presetQuestionId && currentServiceQuestions.some(q => q.id === presetQuestionId)) {
      setAddMode('existing');
      setTargetQuestionId(presetQuestionId);
    } else if (currentServiceQuestions.length > 0) {
      setAddMode('existing');
      setTargetQuestionId(currentServiceQuestions[0].id);
    } else {
      setAddMode('new');
      setTargetQuestionId('');
    }
    setNewQuestionTitle('');
    setNewQuestionType('radio');
    setNewParentQuestionId('');
    setNewParentOptionValue('');
    setOptionRows([{ option_value: '', price: 0 }]);
    setShowAddModal(true);
  };

  const addOptionRow = () => {
    setOptionRows(prev => [...prev, { option_value: '', price: 0 }]);
  };

  const removeOptionRow = (index) => {
    if (optionRows.length === 1) return;
    setOptionRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateOptionRow = (index, field, value) => {
    setOptionRows(prev => prev.map((row, idx) => idx === index ? { ...row, [field]: value } : row));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    let question_id = '';
    let question_title = '';
    let question_type = newQuestionType;

    if (addMode === 'existing') {
      const selectedQ = currentServiceQuestions.find(q => q.id === targetQuestionId);
      if (!selectedQ) return;
      question_id = selectedQ.id;
      question_title = selectedQ.title;
      question_type = selectedQ.type;
    } else {
      if (!newQuestionTitle.trim()) return;
      question_title = newQuestionTitle.trim();
      question_id = question_title.toLowerCase()
        .replace(/[çÇ]/g, 'c').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
        .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[ıİ]/g, 'i')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    const validRows = optionRows.filter(r => r.option_value.trim() !== '');
    if (validRows.length === 0) return;

    for (const row of validRows) {
      const label = `${question_title}: ${row.option_value.trim()}`;
      await handleCreateServicePrice({
        service_type: activeService,
        question_id,
        question_type,
        option_value: row.option_value.trim(),
        label,
        price: parseInt(row.price) || 0,
        parent_question_id: newParentQuestionId || null,
        parent_option_value: newParentOptionValue || null,
      });
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-gray-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dinamik Soru & Fiyat Yönetimi</h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Seçilen hizmetler için soru başlıkları, seçenekler (açılır menü, radyo buton vb.) ve fiyatları buradan kolayca yönetebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => openAddModalForService()}
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
          placeholder="Soru veya seçenek ara..."
          className="w-full md:w-56 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex gap-3 items-start">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>İpucu:</strong> Bir soruya istediğiniz kadar farklı cevap/seçenek ekleyebilirsiniz. Sorularınızı <strong>Açılır Liste (Dropdown)</strong> veya <strong>Radyo Buton</strong> olarak tanımlayabilirsiniz. Müşteri formunda anında geçerli olur.
        </div>
      </div>

      {/* Edit Question Modal */}
      {editQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-500" />
                Soruyu Düzenle & Koşul Belirle
              </h3>
              <button onClick={() => setEditQuestionModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuestionEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase mb-1">
                  Soru Başlığı
                </label>
                <input
                  type="text"
                  value={editQuestionModal.title}
                  onChange={(e) => setEditQuestionModal(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase mb-1">
                  Cevap Formatı / Türü
                </label>
                <select
                  value={editQuestionModal.type}
                  onChange={(e) => setEditQuestionModal(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="radio">Radyo Butonlar (Tekli Seçim)</option>
                  <option value="select">Açılır Menü / Dropdown (Tekli Seçim)</option>
                </select>
              </div>

              {/* Koşullu Mantık Bölümü */}
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <GitBranch className="w-4 h-4" />
                  <span>🔀 Koşullu Gösterim Mantığı (İsteğe Bağlı)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">
                  Bu sorunun sadece müşterinin <strong>önceki bir soruda seçtiği belirli bir cevaba göre</strong> görünmesini isterseniz aşağıdan kural tanımlayın.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">Bağlı Olduğu Soru</label>
                    <select
                      value={editQuestionModal.parentQuestionId || ''}
                      onChange={(e) => setEditQuestionModal(prev => ({ ...prev, parentQuestionId: e.target.value, parentOptionValue: '' }))}
                      className="w-full bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Her Zaman Göster (Bağımsız) --</option>
                      {currentServiceQuestions.filter(q => q.id !== editQuestionModal.questionId).map(pq => (
                        <option key={pq.id} value={pq.id}>{pq.title}</option>
                      ))}
                    </select>
                  </div>

                  {editQuestionModal.parentQuestionId && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-gray-400 mb-1">Hangi Cevap Seçilirse Gönsünsün?</label>
                      <select
                        value={editQuestionModal.parentOptionValue || ''}
                        onChange={(e) => setEditQuestionModal(prev => ({ ...prev, parentOptionValue: e.target.value }))}
                        className="w-full bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- Tüm Cevaplarda Göster --</option>
                        {groupedPrices[editQuestionModal.parentQuestionId]?.map(opt => (
                          <option key={opt.id} value={opt.option_value}>{opt.option_value}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditQuestionModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 text-slate-700 dark:text-gray-300 text-xs font-semibold hover:bg-slate-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Question/Option Modal */}
      {showAddModal && (
        <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl animate-fade-in-up">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Soru & Seçenek Yöneticisi</h3>
            </div>
            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-5">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-gray-900 rounded-xl">
              <button
                type="button"
                onClick={() => setAddMode('existing')}
                disabled={currentServiceQuestions.length === 0}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  addMode === 'existing'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                Mevcut Soruya Seçenek Ekle
              </button>
              <button
                type="button"
                onClick={() => setAddMode('new')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  addMode === 'new'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Sıfırdan Yeni Soru Oluştur
              </button>
            </div>

            {addMode === 'existing' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1">Eklenecek Soru Başlığı</label>
                <select
                  value={targetQuestionId}
                  onChange={(e) => setTargetQuestionId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                >
                  {currentServiceQuestions.map(q => (
                    <option key={q.id} value={q.id}>{q.title} ({q.type === 'select' ? 'Açılır Menü' : 'Radyo Buton'})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1">Yeni Soru Başlığı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Kaç Adet Avize Asılacak?"
                    value={newQuestionTitle}
                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1">Görünüm Tipi</label>
                  <select
                    value={newQuestionType}
                    onChange={(e) => setNewQuestionType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  >
                    <option value="radio">Radyo Butonlar (Kutu Görünüm)</option>
                    <option value="select">Açılır Liste (Dropdown)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Options List Rows */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 uppercase">Cevap Seçenekleri & Fiyatlar</label>
                <button
                  type="button"
                  onClick={addOptionRow}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Başka Seçenek Satırı Ekle
                </button>
              </div>

              {optionRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-gray-900/50 p-3 rounded-xl border border-slate-200/80 dark:border-gray-800">
                  <span className="text-xs font-bold text-slate-400 w-5 text-center">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    placeholder="Seçenek Metni (Örn: 1 Adet, 2-3 Adet, 55-65 inç...)"
                    value={row.option_value}
                    onChange={(e) => updateOptionRow(idx, 'option_value', e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 dark:text-white"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="0"
                      placeholder="Fiyat"
                      value={row.price}
                      onChange={(e) => updateOptionRow(idx, 'price', e.target.value)}
                      className="w-24 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-right focus:outline-none focus:border-blue-500 dark:text-white"
                    />
                    <span className="text-xs text-slate-400 font-semibold">TL</span>
                  </div>
                  {optionRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOptionRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 text-slate-700 dark:text-gray-300 text-xs font-semibold hover:bg-slate-200 transition"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-900/20 transition flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                Seçenekleri Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Question Modal */}
      {editQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-500" />
                Soruyu Düzenle
              </h3>
              <button 
                type="button" 
                onClick={() => setEditQuestionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuestionEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase mb-1">
                  Soru Metni / Başlığı
                </label>
                <input 
                  type="text" 
                  value={editQuestionModal.title}
                  onChange={(e) => setEditQuestionModal(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Örn: Kaç adet avize asılacak?"
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase mb-1">
                  Müşteri Cevap Tipi (Kontrol Türü)
                </label>
                <select 
                  value={editQuestionModal.type}
                  onChange={(e) => setEditQuestionModal(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="radio">🔘 Radyo Butonlar (Tekli Seçim Kartları)</option>
                  <option value="select">▼ Açılır Menü (Dropdown)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditQuestionModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-900 text-slate-700 dark:text-gray-300 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  Soruyu Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Inputs Grouped by Question */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(groupedPrices).length > 0 ? (
          Object.keys(groupedPrices).map((questionId, qIndex, qArray) => {
            const items = groupedPrices[questionId];
            const questionTitle = items[0]?.label.split(':')[0] || questionId;
            const qType = items[0]?.question_type || 'radio';

            const handleMoveQuestion = (direction) => {
              const targetIndex = direction === 'up' ? qIndex - 1 : qIndex + 1;
              if (targetIndex < 0 || targetIndex >= qArray.length) return;

              const newQuestionKeys = [...qArray];
              const temp = newQuestionKeys[qIndex];
              newQuestionKeys[qIndex] = newQuestionKeys[targetIndex];
              newQuestionKeys[targetIndex] = temp;

              if (handleReorderServiceQuestions) {
                handleReorderServiceQuestions(activeService, newQuestionKeys);
              }
            };

            return (
              <div key={questionId} className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    {/* Soru Sıralama Butonları */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-900 rounded-lg p-1 border border-slate-200 dark:border-gray-800">
                      <button
                        type="button"
                        disabled={qIndex === 0}
                        onClick={() => handleMoveQuestion('up')}
                        className="p-1 text-slate-500 hover:text-blue-500 disabled:opacity-30 transition rounded hover:bg-white dark:hover:bg-gray-800 cursor-pointer"
                        title="Yukarı Taşı"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 px-1">
                        Soru {qIndex + 1}
                      </span>
                      <button
                        type="button"
                        disabled={qIndex === qArray.length - 1}
                        onClick={() => handleMoveQuestion('down')}
                        className="p-1 text-slate-500 hover:text-blue-500 disabled:opacity-30 transition rounded hover:bg-white dark:hover:bg-gray-800 cursor-pointer"
                        title="Aşağı Taşı"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 capitalize">
                      {questionTitle}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-500/20">
                      {qType === 'select' ? 'Açılır Liste' : 'Radyo'}
                    </span>

                    {items[0]?.parent_question_id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-500/20 flex items-center gap-1" title={`Sadece "${items[0].parent_option_value}" seçildiğinde gösterilir`}>
                        <GitBranch className="w-3 h-3" />
                        {items[0]?.parent_option_value ? `Koşul: ${items[0].parent_option_value}` : 'Koşullu'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Soruyu Düzenle */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditQuestion(questionId, questionTitle, qType, items[0]?.parent_question_id, items[0]?.parent_option_value)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                      title="Soruyu Düzenle & Koşul Belirle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Soruyu Sil */}
                    <button
                      type="button"
                      onClick={() => handleDeleteServiceQuestion && handleDeleteServiceQuestion(activeService, questionId)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                      title="Tüm Soruyu Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Seçenek Ekle */}
                    <button
                      type="button"
                      onClick={() => openAddModalForService(questionId)}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-500 hover:text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition ml-1"
                      title="Bu soruya yeni seçenek ekle"
                    >
                      <Plus className="w-3 h-3" />
                      Seçenek Ekle
                    </button>
                  </div>
                </div>

                {/* Options List with Reordering & Inline Label Edit */}
                <div className="space-y-3">
                  {items.map((item, oIndex) => {
                    const optionSubText = item.label ? (item.label.split(':')[1]?.trim() || item.label) : item.option_value;

                    const handleMoveOption = (direction) => {
                      const targetIndex = direction === 'up' ? oIndex - 1 : oIndex + 1;
                      if (targetIndex < 0 || targetIndex >= items.length) return;

                      const newItems = [...items];
                      const temp = newItems[oIndex];
                      newItems[oIndex] = newItems[targetIndex];
                      newItems[targetIndex] = temp;

                      const orderedOptionIds = newItems.map(it => it.id);
                      if (handleReorderQuestionOptions) {
                        handleReorderQuestionOptions(orderedOptionIds);
                      }
                    };

                    return (
                      <div key={item.id} className="flex justify-between items-center gap-2">
                        {/* Seçenek Sıralama Okları */}
                        <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-gray-900 rounded p-0.5 border border-slate-200 dark:border-gray-800 shrink-0">
                          <button
                            type="button"
                            disabled={oIndex === 0}
                            onClick={() => handleMoveOption('up')}
                            className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-20 transition"
                            title="Seçeneği Yukarı Taşı"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={oIndex === items.length - 1}
                            onClick={() => handleMoveOption('down')}
                            className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-20 transition"
                            title="Seçeneği Aşağı Taşı"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Düzenlenebilir Seçenek Adı */}
                        <input
                          type="text"
                          value={optionSubText}
                          onChange={(e) => handleLabelChange(item.id, e.target.value)}
                          placeholder="Seçenek Adı"
                          className="flex-1 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
                        />

                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            className="w-20 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-right font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-[11px] text-slate-400 dark:text-gray-500 font-semibold">TL</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteServicePrice(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition ml-1"
                            title="Seçeneği Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
