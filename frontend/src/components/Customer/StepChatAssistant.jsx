import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bot, User, ChevronLeft, ChevronRight, Tag, Sparkles, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { servicesConfig, calculateQuotation } from '../../config/servicesConfig';
import { api } from '../../services/api';
import axios from 'axios';

export default function StepChatAssistant({
  selectedService,
  formAnswers,
  handleInputChange,
  setActiveStep
}) {
  const [dbQuestions, setDbQuestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);

  // Fetch dynamic questions from DB (same logic as StepQuestions.jsx)
  useEffect(() => {
    let isMounted = true;
    const apiUrl = api.getApiUrl();
    axios.get(`${apiUrl}/service-prices`)
      .then(res => {
        if (!isMounted) return;
        const prices = res.data?.data || res.data || [];
        const servicePrices = prices.filter(p => p.service_type === selectedService);

        if (servicePrices.length > 0) {
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
        console.warn('DB soruları yüklenemedi, varsayılan konfigürasyona geçiliyor:', err);
        setDbQuestions([]);
      });

    return () => { isMounted = false; };
  }, [selectedService]);

  // Combine DB questions or static config
  const allQuestions = useMemo(() => {
    if (dbQuestions.length > 0) return dbQuestions;
    return servicesConfig[selectedService] || [];
  }, [dbQuestions, selectedService]);

  // Calculate dynamic active questions based on conditions
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

  // Live Price Estimate Calculation
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

  // Find index of current unanswered question
  const activeQuestionIndex = useMemo(() => {
    const idx = dynamicQuestions.findIndex(q => !formAnswers[q.id]);
    return idx === -1 ? dynamicQuestions.length : idx;
  }, [dynamicQuestions, formAnswers]);

  const isCompleted = activeQuestionIndex >= dynamicQuestions.length && dynamicQuestions.length > 0;
  const activeQuestion = dynamicQuestions[activeQuestionIndex];

  const chatContainerRef = useRef(null);

  // Auto scroll logic: On initial question, scroll to top so welcome message is 100% visible.
  // When user answers questions, scroll down smoothly to next active question.
  useEffect(() => {
    if (activeQuestionIndex === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = 0;
      }
    } else if (activeQuestionIndex > 0 || isTyping) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeQuestionIndex, isTyping]);

  // Handle Option Selection with short typing effect
  const handleSelectOption = (questionId, optionValue) => {
    if (isTyping) return;
    setIsTyping(true);
    handleInputChange(questionId, optionValue);

    setTimeout(() => {
      setIsTyping(false);
    }, 450);
  };

  // Handle Input Submit for number / text types
  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeQuestion) return;
    handleSelectOption(activeQuestion.id, inputValue.trim());
    setInputValue('');
  };

  // Handle Edit/Revert Answer to a specific question
  const handleRevertToQuestion = (questionId) => {
    const targetIdx = dynamicQuestions.findIndex(q => q.id === questionId);
    if (targetIdx === -1) return;

    // Reset answers for this and subsequent questions
    for (let i = targetIdx; i < dynamicQuestions.length; i++) {
      const q = dynamicQuestions[i];
      if (formAnswers[q.id] !== undefined) {
        handleInputChange(q.id, '');
      }
    }
    toast.info('Seçiminiz sıfırlandı. Lütfen tekrar yanıtlayınız.');
  };

  // Service Name Display
  const serviceTitle = useMemo(() => {
    const names = {
      'paint': 'Boya & Dekorasyon',
      'tv-mount': 'TV Montajı & Askı Aparatı',
      'plumbing': 'Sıhhi Tesisat',
      'electric': 'Elektrik İşleri'
    };
    return names[selectedService] || 'Ev Destek';
  }, [selectedService]);

  return (
    <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full">
      {/* ─── Header: Assistant Info & Live Price Badge ─── */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
            <Bot className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">ERCA Destek Asistanı</h2>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400">{serviceTitle} için detaylar belirleniyor</p>
          </div>
        </div>

        {/* Live Price Estimation Badge */}
        {priceEstimate.totalPrice > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
            <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              ~{priceEstimate.totalPrice.toLocaleString('tr-TR')} TL
            </span>
          </div>
        )}
      </div>

      {/* ─── Progress Indicator Bar ─── */}
      {dynamicQuestions.length > 0 && (
        <div className="mb-5 bg-slate-100 dark:bg-gray-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-gray-400">
            <span>İlerleme:</span>
            <span className="text-primary-600 dark:text-primary-400 font-bold">
              {Math.min(activeQuestionIndex + 1, dynamicQuestions.length)} / {dynamicQuestions.length}
            </span>
          </div>
          <div className="flex-1 max-w-[180px] bg-slate-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(Math.min(activeQuestionIndex, dynamicQuestions.length) / dynamicQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── Chat Stream Container ─── */}
      <div ref={chatContainerRef} className="space-y-4 min-h-[320px] max-h-[520px] overflow-y-auto pr-1 pb-4">
        {/* Welcome Bot Message */}
        <div className="flex items-start gap-3 animate-fade-in-up">
          <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200">
            <p className="font-semibold text-primary-600 dark:text-primary-400 text-xs mb-1">ERCA Asistan</p>
            <p>Merhaba! <strong>{serviceTitle}</strong> hizmetimiz için size en doğru fiyat teklifini hazırlayabilmem için lütfen birkaç hızlı soruyu yanıtlayın.</p>
          </div>
        </div>

        {/* Answered Questions & User Answers History */}
        {dynamicQuestions.slice(0, activeQuestionIndex).map((q) => {
          const userAnswer = formAnswers[q.id];
          if (!userAnswer) return null;

          return (
            <React.Fragment key={q.id}>
              {/* Bot Question Message */}
              <div className="flex items-start gap-3 animate-fade-in-up">
                <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200">
                  <p className="font-medium">{q.label}</p>
                </div>
              </div>

              {/* User Selected Answer Message */}
              <div className="flex items-start justify-end gap-3 animate-fade-in-up">
                <div className="group relative bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl rounded-tr-none p-3.5 shadow-md max-w-[80%] text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{userAnswer}</span>
                    <button
                      type="button"
                      onClick={() => handleRevertToQuestion(q.id)}
                      className="text-[11px] font-medium bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-lg transition shrink-0"
                      title="Bu cevabı değiştir"
                    >
                      Değiştir
                    </button>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Active Question & Options */}
        {!isCompleted && activeQuestion && (
          <div className="space-y-3 pt-2">
            {/* Bot Active Question Bubble */}
            <div className="flex items-start gap-3 animate-fade-in-up">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-900/50 rounded-2xl rounded-tl-none p-4 shadow-md max-w-[85%] text-sm text-slate-900 dark:text-white font-medium">
                <p>{activeQuestion.label}</p>
              </div>
            </div>

            {/* Options Buttons Grid */}
            <div className="pl-11 pr-2 animate-fade-in-up">
              {(activeQuestion.type === 'radio' || activeQuestion.type === 'select' || !activeQuestion.type) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeQuestion.options.map((opt, idx) => {
                    const priceAddon = activeQuestion.pricing ? activeQuestion.pricing[opt] : 0;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(activeQuestion.id, opt)}
                        disabled={isTyping}
                        className="w-full text-left p-3.5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 active:scale-[0.99] transition-all flex items-center justify-between group shadow-sm"
                      >
                        <span className="text-sm font-semibold text-slate-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Number / Text Input Option */}
              {(activeQuestion.type === 'number' || activeQuestion.type === 'text') && (
                <form onSubmit={handleInputSubmit} className="flex gap-2 max-w-md">
                  <input
                    type={activeQuestion.type === 'number' ? 'number' : 'text'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={activeQuestion.placeholder || 'Değeri yazınız...'}
                    autoFocus
                    className="flex-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-gray-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition disabled:opacity-50"
                  >
                    Devam
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Typing Indicator Animation */}
        {isTyping && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {isCompleted && !isTyping && (
          <div className="space-y-4 pt-2 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl rounded-tl-none p-4 shadow-sm text-sm text-emerald-900 dark:text-emerald-200 space-y-2">
                <p className="font-bold">Tebrikler! Hizmet detaylarınız tamamlandı. 🎉</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Fiyat teklifinizi ve size özel çözümü hazırlayabilmemiz için son adım olan iletişim bilgilerinize geçebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Work Area Photo Upload Card */}
        <div className="mt-6 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-gray-200 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              <span>📸 Çalışma Alanı / Arıza Fotoğrafı Ekle</span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">İsteğe Bağlı</span>
            </label>
            <span className="text-[10px] text-slate-500 dark:text-gray-400">En fazla 3 fotoğraf</span>
          </div>

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
                toast.success('Fotoğraflar başarıyla eklendi.');
              });
            }}
            className="w-full text-xs text-slate-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
          />

          {formAnswers.uploadedPhotos && formAnswers.uploadedPhotos.length > 0 && (
            <div className="flex gap-2 pt-2">
              {formAnswers.uploadedPhotos.map((src, idx) => (
                <div key={idx} className="w-16 h-16 rounded-xl border overflow-hidden bg-white shrink-0 shadow-sm relative group">
                  <img src={src} alt="Yüklenen Görsel" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div ref={chatEndRef} />
      </div>

      {/* ─── Footer Action Bar ─── */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-gray-800 mt-4">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800 transition flex items-center justify-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Hizmet Seçimine Dön
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isCompleted && dynamicQuestions.length > 0) {
              const unanswered = dynamicQuestions[activeQuestionIndex];
              if (unanswered) {
                toast.error(`Lütfen "${unanswered.label}" sorusunu yanıtlayınız.`);
                return;
              }
            }
            setActiveStep(3);
          }}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-lg ${
            isCompleted
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/20 animate-pulse'
              : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 shadow-primary-900/15'
          }`}
        >
          İletişim Bilgilerine Geç
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
