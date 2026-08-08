import React, { useState, useEffect, useMemo } from 'react';
import { FileText, AlertTriangle, ChevronRight, ChevronLeft, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { servicesConfig, calculateQuotation } from '../../config/servicesConfig';
import { api } from '../../services/api';
import axios from 'axios';

export default function StepQuestions({
  selectedService,
  formAnswers,
  handleInputChange,
  setActiveStep
}) {
  const [dbQuestions, setDbQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic questions from DB
  useEffect(() => {
    let isMounted = true;
    const apiUrl = api.getApiUrl();
    axios.get(`${apiUrl}/service-prices`)
      .then(res => {
        if (!isMounted) return;
        const prices = res.data?.data || res.data || [];
        const servicePrices = prices.filter(p => p.service_type === selectedService);

        if (servicePrices.length > 0) {
          // Group by question_id
          const grouped = servicePrices.reduce((groups, item) => {
            const qId = item.question_id;
            if (!groups[qId]) {
              groups[qId] = {
                id: qId,
                label: item.label.split(':')[0]?.trim() || qId,
                type: item.question_type || 'radio',
                parentQuestionId: item.parent_question_id || null,
                parentOptionValue: item.parent_option_value || null,
                options: [],
                pricing: {}
              };
            }
            groups[qId].options.push(item.option_value);
            groups[qId].pricing[item.option_value] = item.price;
            return groups;
          }, {});

          setDbQuestions(Object.values(grouped));
        } else {
          setDbQuestions([]);
        }
      })
      .catch(err => {
        console.warn('Could not fetch DB questions, fallback to static config:', err);
        setDbQuestions([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedService]);

  // Combined questions: DB questions if present, otherwise static config
  const allQuestions = useMemo(() => {
    if (dbQuestions.length > 0) return dbQuestions;
    return servicesConfig[selectedService] || [];
  }, [dbQuestions, selectedService]);

  const dynamicQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      if (q.condition) return q.condition(formAnswers);
      if (q.parentOptionValue && q.parentOptionValue.trim() !== '') {
        const allowedOptions = q.parentOptionValue.split(',').map(v => v.trim());
        const answersList = Object.values(formAnswers);
        return answersList.some(ans => allowedOptions.includes(ans));
      }
      return true;
    });
  }, [allQuestions, formAnswers]);

  // Live price estimate calculation
  const priceEstimate = useMemo(() => {
    if (dbQuestions.length > 0) {
      let total = 0;
      let items = [];
      dbQuestions.forEach(q => {
        const answer = formAnswers[q.id];
        if (answer && q.pricing && q.pricing[answer]) {
          const price = q.pricing[answer];
          if (price > 0) {
            items.push({ description: `${q.label}: ${answer}`, price });
            total += price;
          }
        }
      });
      return { items, totalPrice: total > 0 ? total : 500 };
    }
    return calculateQuotation(selectedService, formAnswers);
  }, [dbQuestions, selectedService, formAnswers]);

  const handleNextStep = () => {
    if (dynamicQuestions.length > 0) {
      const firstQuestion = dynamicQuestions[0];
      if (!formAnswers[firstQuestion.id]) {
        toast.error(`Lütfen "${firstQuestion.label}" sorusunu yanıtlayınız.`);
        return;
      }
    }
    setActiveStep(3);
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hizmet Detayları</h2>
          </div>
          {/* Live Price Badge */}
          {priceEstimate.totalPrice > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-500/30 animate-fade-in-up">
              <Tag className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                ~{priceEstimate.totalPrice.toLocaleString('tr-TR')} TL
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Question Render */}
        <div className="space-y-5 max-w-xl">
          {dynamicQuestions.length > 0 ? (
            dynamicQuestions.map(q => (
              <div key={q.id} className="space-y-3 bg-slate-50/80 dark:bg-gray-900/30 p-4 md:p-5 rounded-2xl border border-slate-200/80 dark:border-gray-800">
                <label className="block text-sm font-semibold text-slate-800 dark:text-gray-200">{q.label}</label>
                
                {q.type === 'select' && (
                  <select 
                    value={formAnswers[q.id] || ''} 
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    className="w-full bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-slate-800 dark:text-gray-200 transition"
                  >
                    <option value="" disabled>Lütfen seçiniz</option>
                    {q.options.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                
                {q.type === 'number' && (
                  <input 
                    type="number" 
                    value={formAnswers[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    placeholder={q.placeholder || 'Sayısal değer girin'} 
                    className="w-full bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-slate-800 dark:text-gray-200 transition"
                  />
                )}

                {q.type === 'text' && (
                  <input 
                    type="text" 
                    value={formAnswers[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    placeholder={q.placeholder || 'Metin girin'} 
                    className="w-full bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-slate-800 dark:text-gray-200 transition"
                  />
                )}
                
                {(q.type === 'radio' || !q.type) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, i) => {
                      const isSelected = formAnswers[q.id] === opt;
                      const optPrice = q.pricing ? q.pricing[opt] : null;
                      return (
                        <label 
                          key={i} 
                          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-slate-900 dark:text-white shadow-sm shadow-primary-500/10'
                              : 'border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 text-slate-600 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-600 hover:text-slate-800 dark:hover:text-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="radio" 
                              name={q.id} 
                              value={opt}
                              checked={isSelected}
                              onChange={() => handleInputChange(q.id, opt)}
                              className="hidden" 
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                              isSelected ? 'border-primary-500' : 'border-slate-300 dark:border-gray-600'
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-primary-500"></div>}
                            </div>
                            <span className="text-sm font-medium">{opt}</span>
                          </div>
                          {optPrice > 0 && (
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400 shrink-0 ml-2">
                              +₺{optPrice.toLocaleString('tr-TR')}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-sm flex gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <strong>{loading ? 'Sorular yükleniyor...' : 'Bu hizmet için henüz detay sorusu eklenmemiş.'}</strong>
                {!loading && ' Devam etmek için "İletişim Bilgilerine Geç" butonuna tıklayabilirsiniz.'}
              </div>
            </div>
          )}
        </div>

        {/* Photo Attachment Card */}
        <div className="mt-6 max-w-xl p-4 md:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-gray-200 flex items-center gap-2">
              <span>📸 Çalışma Alanı / Arıza Fotoğrafı Ekle</span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">İsteğe Bağlı</span>
            </label>
            <span className="text-[10px] text-slate-500 dark:text-gray-400">En fazla 3 fotoğraf</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-gray-400">
            Avizenizi, montaj yapılacak duvarı veya arızalı priz/tesisat alanını çekip yüklerseniz ustamız ön hazırlık yapabilir.
          </p>

          <input 
            type="file" 
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files).slice(0, 3);
              const filePromises = files.map(file => {
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (evt) => resolve(evt.target.result);
                  reader.readAsDataURL(file);
                });
              });
              Promise.all(filePromises).then(base64Photos => {
                handleInputChange('uploadedPhotos', base64Photos);
              });
            }}
            className="w-full text-xs text-slate-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
          />

          {formAnswers.uploadedPhotos && formAnswers.uploadedPhotos.length > 0 && (
            <div className="flex gap-2 pt-2">
              {formAnswers.uploadedPhotos.map((src, idx) => (
                <div key={idx} className="w-16 h-16 rounded-xl border overflow-hidden bg-white shrink-0 shadow-sm relative">
                  <img src={src} alt="Yüklenen Görsel" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-200 dark:border-gray-800 mt-6 md:relative fixed bottom-0 left-0 right-0 p-4 md:p-0 bg-white dark:bg-gray-950 md:bg-transparent border-t md:border-t-0 border-slate-200 dark:border-gray-800 z-30">
        <button 
          type="button" 
          onClick={() => setActiveStep(1)} 
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800 transition flex items-center justify-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Geri
        </button>
        <button 
          type="button" 
          onClick={handleNextStep} 
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-lg shadow-primary-900/15"
        >
          İletişim Bilgilerine Geç
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
