import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { servicesConfig } from '../config/servicesConfig';

export function useSession() {
  const [activeStep, setActiveStep] = useState(() => JSON.parse(sessionStorage.getItem('activeStep')) || 1);
  const [selectedService, setSelectedService] = useState(() => JSON.parse(sessionStorage.getItem('selectedService')) || null);
  const [sessionStarted, setSessionStarted] = useState(() => JSON.parse(sessionStorage.getItem('sessionStarted')) || false);
  const [sessionRequested, setSessionRequested] = useState(false);
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('sessionId') || '');
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem('sessionToken') || '');
  const [customerName, setCustomerName] = useState(() => sessionStorage.getItem('customerName') || '');
  const [customerPhone, setCustomerPhone] = useState(() => sessionStorage.getItem('customerPhone') || '');
  const [customerEmail, setCustomerEmail] = useState(() => sessionStorage.getItem('customerEmail') || '');
  const [customerAddress, setCustomerAddress] = useState(() => sessionStorage.getItem('customerAddress') || '');
  const [startingSession, setStartingSession] = useState(false);
  const [sessionError, setSessionError] = useState(null);
  const [formAnswers, setFormAnswers] = useState(() => JSON.parse(sessionStorage.getItem('formAnswers')) || {});
  const [uploadedPhotos, setUploadedPhotos] = useState(() => JSON.parse(sessionStorage.getItem('uploadedPhotos')) || []);
  const [analyzing, setAnalyzing] = useState(false);
  const [compiledQuotation, setCompiledQuotation] = useState(() => JSON.parse(sessionStorage.getItem('compiledQuotation')) || null);
  const [compiledWorkOrder, setCompiledWorkOrder] = useState(() => JSON.parse(sessionStorage.getItem('compiledWorkOrder')) || null);
  const [submittingQuotation, setSubmittingQuotation] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(() => JSON.parse(sessionStorage.getItem('contactSaved')) || false);
  const [declaringDeposit, setDeclaringDeposit] = useState(false);
  const [depositDeclared, setDepositDeclared] = useState(() => JSON.parse(sessionStorage.getItem('depositDeclared')) || false);
  const [approvingQuotation, setApprovingQuotation] = useState(false);
  const [utmParams, setUtmParams] = useState({});

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('activeStep', JSON.stringify(activeStep));
    sessionStorage.setItem('selectedService', JSON.stringify(selectedService));
    sessionStorage.setItem('sessionStarted', JSON.stringify(sessionStarted));
    sessionStorage.setItem('sessionId', sessionId);
    sessionStorage.setItem('sessionToken', sessionToken);
    sessionStorage.setItem('customerName', customerName);
    sessionStorage.setItem('customerPhone', customerPhone);
    sessionStorage.setItem('customerEmail', customerEmail);
    sessionStorage.setItem('customerAddress', customerAddress);
    sessionStorage.setItem('formAnswers', JSON.stringify(formAnswers));
    sessionStorage.setItem('uploadedPhotos', JSON.stringify(uploadedPhotos));
    sessionStorage.setItem('compiledQuotation', JSON.stringify(compiledQuotation));
    sessionStorage.setItem('compiledWorkOrder', JSON.stringify(compiledWorkOrder));
    sessionStorage.setItem('contactSaved', JSON.stringify(contactSaved));
    sessionStorage.setItem('depositDeclared', JSON.stringify(depositDeclared));
  }, [
    activeStep, selectedService, sessionStarted, sessionId, sessionToken,
    customerName, customerPhone, customerEmail, customerAddress,
    formAnswers, uploadedPhotos, compiledQuotation, compiledWorkOrder,
    contactSaved, depositDeclared
  ]);

  // Extract UTM parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = {
      utm_source: params.get('utm_source') || (params.get('gclid') ? 'google' : params.get('fbclid') ? 'meta' : null),
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null
    };
    setUtmParams(utm);
  }, []);

  /**
   * Lazy Session Start — only starts a session when explicitly requested
   * (triggered by service selection, not on page load).
   */
  const ensureSession = useCallback(async () => {
    // Already have a valid session
    if (sessionStarted && sessionId && sessionToken) {
      return { sessionId, sessionToken };
    }

    setSessionRequested(true);
    setStartingSession(true);
    setSessionError(null);

    try {
      const data = await api.startSession(null, null, utmParams);
      const resData = data.data || data;
      if (data.status || data.success) {
        setSessionId(resData.session_id);
        setSessionToken(resData.token);
        setSessionStarted(true);
        return { sessionId: resData.session_id, sessionToken: resData.token };
      } else {
        const errorMsg = data.message || 'Oturum başlatılamadı.';
        setSessionError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Session start failed:', err);
      const errorMsg = err.message || 'Sunucuya bağlanılamadı. Lütfen sunucunun çalıştığından emin olun.';
      setSessionError(errorMsg);
      throw err;
    } finally {
      setStartingSession(false);
    }
  }, [sessionStarted, sessionId, sessionToken, utmParams]);

  const handleInputChange = useCallback((questionId, value) => {
    setFormAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      if (questionId === 'spaceType') {
        if (value === 'Ev') {
          delete next.spaceSizeM2;
        } else {
          delete next.spaceSize;
        }
      }
      return next;
    });
  }, []);

  /**
   * Update contact info and generate quotation (but NOT auto-approve).
   * Quotation approval is now a separate explicit action.
   */
  const handleUpdateContactAndGetQuote = useCallback(async (formData) => {
    const phone = formData?.phone || customerPhone;
    const name = formData?.name || customerName;
    const email = formData?.email ?? customerEmail;
    const address = formData?.address || customerAddress;

    if (!phone.trim() || !name.trim() || !address.trim()) {
      toast.error('Lütfen Ad Soyad, Telefon Numarası ve Açık Adres alanlarını eksiksiz doldurunuz.');
      return;
    }

    // Ensure session exists
    let currentSessionId = sessionId;
    let currentToken = sessionToken;
    try {
      const sessionData = await ensureSession();
      currentSessionId = sessionData.sessionId;
      currentToken = sessionData.sessionToken;
    } catch {
      toast.error('Oturum başlatılamadı. Lütfen tekrar deneyiniz.');
      return;
    }

    setSubmittingContact(true);
    try {
      const contactRes = await api.updateContact(
        currentSessionId, phone, name, email, address, currentToken, utmParams
      );

      if (contactRes.status || contactRes.success) {
        setContactSaved(true);
        setCustomerName(name);
        setCustomerPhone(phone);
        setCustomerEmail(email);
        setCustomerAddress(address);

        setSubmittingQuotation(true);

        const quoteRes = await api.generateQuotation(
          currentSessionId, selectedService, formAnswers, [], 0, currentToken
        );

        if (quoteRes.status || quoteRes.success) {
          const qData = quoteRes.data || quoteRes.quotation;
          setCompiledQuotation(qData);
          toast.success('Fiyat teklifiniz hazırlandı! Lütfen inceleyip onaylayınız.');
          setActiveStep(4);
        } else {
          toast.error('Fiyat teklifi oluşturulurken bir hata oluştu: ' + (quoteRes.message || ''));
        }
      } else {
        toast.error('İletişim bilgileri kaydedilemedi: ' + (contactRes.message || ''));
      }
    } catch (err) {
      console.error(err);
      toast.error('İletişim ve teklif alırken bağlantı hatası oluştu: ' + err.message);
    } finally {
      setSubmittingContact(false);
      setSubmittingQuotation(false);
    }
  }, [customerPhone, customerName, customerEmail, customerAddress, sessionId, sessionToken, utmParams, selectedService, formAnswers, ensureSession]);

  /**
   * Separate Quotation Approval — explicit customer action.
   * Creates the work order only after customer confirms.
   */
  const handleApproveQuotation = useCallback(async () => {
    if (!compiledQuotation) {
      toast.error('Onaylanacak bir teklif bulunamadı.');
      return;
    }

    setApprovingQuotation(true);
    try {
      const quotationId = compiledQuotation.quotation_id || compiledQuotation.id;
      const approveRes = await api.approveQuotation(quotationId, sessionToken);

      if (approveRes.status || approveRes.success) {
        const rawWo = approveRes.data || approveRes.work_order;
        if (rawWo) {
          setCompiledWorkOrder({
            ...rawWo,
            id: rawWo.id || rawWo.work_order_id
          });
        }
        toast.success('Teklifiniz onaylandı! Kapora bilgisi aşağıda görüntülenmektedir.');
      } else {
        toast.error('Teklif onaylanırken hata: ' + (approveRes.message || ''));
      }
    } catch (err) {
      console.error(err);
      toast.error('Teklif onaylanırken bağlantı hatası: ' + err.message);
    } finally {
      setApprovingQuotation(false);
    }
  }, [compiledQuotation, sessionToken]);

  const handlePhotoUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Ensure session exists before upload
    let currentSessionId = sessionId;
    let currentToken = sessionToken;
    try {
      const sessionData = await ensureSession();
      currentSessionId = sessionData.sessionId;
      currentToken = sessionData.sessionToken;
    } catch {
      toast.error('Oturum başlatılamadı. Lütfen tekrar deneyiniz.');
      return;
    }

    setAnalyzing(true);
    try {
      const data = await api.uploadFile(currentSessionId, files[0], currentToken);
      if (data.status || data.success) {
        const filePath = data.data?.file_path || data.file_path;
        const fullUrl = filePath.startsWith('http') ? filePath : `${api.getBackendUrl()}/${filePath}`;
        setUploadedPhotos((prev) => [...prev, fullUrl].slice(0, 10));
        toast.success('Fotoğraf başarıyla yüklendi.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Fotoğraf yüklenirken sunucu hatası oluştu: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  }, [sessionId, sessionToken, ensureSession]);

  /**
   * Service selection — triggers lazy session start.
   */
  const handleQuickServiceSelect = useCallback(async (serviceId) => {
    setSelectedService(serviceId);
    setActiveStep(2);

    const questions = servicesConfig[serviceId] || [];
    const initialAnswers = {};
    questions.forEach((q) => {
      initialAnswers[q.id] = '';
    });
    setFormAnswers(initialAnswers);

    // Start session lazily in background (don't block UI)
    try {
      await ensureSession();
    } catch {
      // Session error will be displayed when user tries to upload or submit
      console.warn('Background session start failed — will retry on action.');
    }
  }, [ensureSession]);

  const removePhoto = useCallback((index) => {
    setUploadedPhotos((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleDeclareDeposit = useCallback(async () => {
    setDeclaringDeposit(true);
    try {
      const data = await api.declareDeposit(sessionId, sessionToken);
      if (data.status || data.success) {
        setDepositDeclared(true);
        toast.success('Ödeme bildiriminiz başarıyla alındı. Ekibimiz en kısa sürede kontrol edecektir.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ödeme bildirimi kaydedilirken hata oluştu: ' + err.message);
    } finally {
      setDeclaringDeposit(false);
    }
  }, [sessionId, sessionToken]);

  return {
    activeStep,
    setActiveStep,
    selectedService,
    setSelectedService,
    sessionStarted,
    sessionRequested,
    sessionId,
    sessionToken,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerEmail,
    setCustomerEmail,
    customerAddress,
    setCustomerAddress,
    startingSession,
    sessionError,
    formAnswers,
    uploadedPhotos,
    analyzing,
    compiledQuotation,
    compiledWorkOrder,
    submittingQuotation,
    submittingContact,
    contactSaved,
    declaringDeposit,
    depositDeclared,
    approvingQuotation,
    utmParams,
    handleInputChange,
    handlePhotoUpload,
    handleUpdateContactAndGetQuote,
    handleApproveQuotation,
    handleQuickServiceSelect,
    removePhoto,
    handleDeclareDeposit,
    ensureSession
  };
}
