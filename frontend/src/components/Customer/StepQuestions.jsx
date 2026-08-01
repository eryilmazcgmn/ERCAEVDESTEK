import React from 'react';
import { FileText, AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { servicesConfig } from '../../config/servicesConfig';

export default function StepQuestions({
  selectedService,
  formAnswers,
  handleInputChange,
  setActiveStep
}) {
  const allQuestions = servicesConfig[selectedService] || [];
  const dynamicQuestions = allQuestions.filter(q => !q.condition || q.condition(formAnswers));

  const handleNextStep = () => {
    // Validate if at least the primary questions are answered
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
          <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Hızlı Teklif Sistemi
          </span>
        </div>

        {/* Dynamic Question Render */}
        <div className="space-y-6 max-w-xl font-sans">
          {dynamicQuestions.length > 0 ? (
            dynamicQuestions.map(q => (
              <div key={q.id} className="space-y-3 bg-slate-100 dark:bg-gray-900/30 p-5 rounded-2xl border border-slate-200 dark:border-gray-800">
                <label className="block text-sm font-semibold text-slate-800 dark:text-gray-200">{q.label}</label>
                
                {q.type === 'select' && (
                  <select 
                    value={formAnswers[q.id] || ''} 
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    className="w-full bg-white dark:bg-gray-950 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-gray-200"
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
                    className="w-full bg-white dark:bg-gray-950 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-gray-200"
                  />
                )}

                {q.type === 'text' && (
                  <input 
                    type="text" 
                    value={formAnswers[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    placeholder={q.placeholder || 'Metin girin'} 
                    className="w-full bg-white dark:bg-gray-950 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-gray-200"
                  />
                )}
                
                {q.type === 'radio' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, i) => {
                      const isSelected = formAnswers[q.id] === opt;
                      return (
                        <label 
                          key={i} 
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary-500 bg-primary-900/20 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                              : 'border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/50 text-slate-500 dark:text-gray-400 hover:border-slate-400 dark:hover:border-slate-400 dark:border-gray-600 hover:text-slate-800 dark:hover:text-gray-200'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name={q.id} 
                            value={opt}
                            checked={isSelected}
                            onChange={() => handleInputChange(q.id, opt)}
                            className="hidden" 
                          />
                          <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                            isSelected ? 'border-blue-500' : 'border-slate-400 dark:border-gray-600'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                          </div>
                          <span className="text-sm font-medium">{opt}</span>
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
                <strong>Dinamik form yüklenemedi.</strong> Lütfen ilk adımda geçerli bir kategori seçtiğinizden emin olun.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-200 dark:border-gray-800 mt-6 md:relative fixed bottom-0 left-0 right-0 p-4 md:p-0 bg-white dark:bg-gray-950 md:bg-transparent border-t md:border-t-0 border-slate-200 dark:border-gray-800 z-30">
        <button 
          type="button" 
          onClick={() => setActiveStep(1)} 
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition flex items-center justify-center"
        >
          Geri
        </button>
        <button 
          type="button" 
          onClick={handleNextStep} 
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition flex items-center justify-center gap-2"
        >
          Devam Et
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
