import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Image as ImageIcon, PaintBucket, Type, Code2, AlertCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { api } from '../../services/api';

const SettingsTab = ({ adminToken }) => {
    const { settings, setSettings } = useSettings();
    const [formData, setFormData] = useState({ ...settings });
    const [logoFile, setLogoFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        setFormData({ ...settings });
    }, [settings]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setLogoFile(e.target.files[0]);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });
            if (logoFile) {
                data.append('logo', logoFile);
            }

            const apiUrl = api.getApiUrl();
            const res = await axios.post(`${apiUrl}/admin/settings`, data, {
                headers: { 
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi! Değişikliklerin tamamını görmek için sayfayı yenileyebilirsiniz.' });
            
            // Re-fetch or update context (Context might not instantly reflect logo if we don't refresh)
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            setMessage({ type: 'error', text: 'Ayarlar kaydedilirken hata oluştu.' });
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Genel Ayarlar</h2>
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Sitenizin genel görünümünü ve iletişim bilgilerini yönetin.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-primary-900/20 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400'}`}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* İletişim Bilgileri */}
                <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Type className="w-5 h-5 text-primary-500" />
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Kurumsal Bilgiler</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Firma / Site Adı</label>
                            <input 
                                type="text" 
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">İletişim E-posta</label>
                            <input 
                                type="text" 
                                name="contact_email"
                                value={formData.contact_email}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">İletişim Telefon</label>
                            <input 
                                type="text" 
                                name="contact_phone"
                                value={formData.contact_phone}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Hizmet Bölgesi / Adres</label>
                            <input 
                                type="text" 
                                name="company_address"
                                value={formData.company_address || ''}
                                onChange={handleChange}
                                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">WhatsApp Destek Numarası (Örn: 905551234567)</label>
                            <input 
                                type="text" 
                                name="whatsapp_number"
                                value={formData.whatsapp_number || ''}
                                onChange={handleChange}
                                placeholder="905551234567"
                                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Görsel Tasarım */}
                <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <PaintBucket className="w-5 h-5 text-primary-500" />
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Görsel & Tasarım</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Site Logosu
                            </label>
                            {settings.logo_path && (
                                <img src={`${api.getBackendUrl()}/${settings.logo_path}`} alt="Logo" className="h-12 mb-3 object-contain" />
                            )}
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full text-sm text-slate-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900/20 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/40 cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-gray-800 pt-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Ana Renk (Primary)</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        name="primary_color"
                                        value={formData.primary_color}
                                        onChange={handleChange}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                                    />
                                    <span className="text-sm font-mono text-slate-600 dark:text-gray-300">{formData.primary_color}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Butonlar ve vurgular için.</p>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase mb-1.5">Köşe Ovalliği</label>
                                <select 
                                    name="border_radius"
                                    value={formData.border_radius}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-500 dark:text-white"
                                >
                                    <option value="0rem">Keskin (0px)</option>
                                    <option value="0.25rem">Hafif (4px)</option>
                                    <option value="0.5rem">Orta (8px)</option>
                                    <option value="0.75rem">Yuvarlak (12px)</option>
                                    <option value="1rem">Ekstra Yuvarlak (16px)</option>
                                    <option value="9999px">Tam Yuvarlak (Hap)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gelişmiş Tasarım (Custom CSS) */}
                <div className="md:col-span-2 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Code2 className="w-5 h-5 text-primary-500" />
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Gelişmiş Tasarım (Özel CSS)</h3>
                    </div>
                    
                    <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">Buraya yazacağınız CSS kodları tüm sitede geçerli olur. Sayfadaki her bir öğenin rengini, boyutunu veya davranışını piksellerle kontrol edebilirsiniz.</p>
                        <textarea 
                            name="custom_css"
                            value={formData.custom_css}
                            onChange={handleChange}
                            rows={8}
                            placeholder="Örn: body { background-color: #f0f0f0 !important; }"
                            className="w-full font-mono bg-[#1e1e1e] text-[#d4d4d4] border border-slate-800 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary-500 transition shadow-inner"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
