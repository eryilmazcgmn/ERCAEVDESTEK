import React, { useState, useEffect } from 'react';
import { HardHat, MapPin, Phone, MessageSquare, CheckCircle2, Clock, Navigation, Camera, LogOut, ExternalLink, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function TechnicianPortalPage() {
  const [techToken, setTechToken] = useState(() => sessionStorage.getItem('techToken') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [workOrders, setWorkOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeWo, setActiveWo] = useState(null);
  const [statusNote, setStatusNote] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoadingLogin(true);
    try {
      const res = await axios.post(`${api.getApiUrl()}/auth/login`, {
        username,
        password
      });
      const token = res.data?.data?.token || res.data?.token;
      if (token) {
        sessionStorage.setItem('techToken', token);
        setTechToken(token);
        toast.success('Usta girişi başarılı!');
      }
    } catch (err) {
      toast.error('Kullanıcı adı veya şifre hatalı.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const fetchTechWorkOrders = async () => {
    if (!techToken) return;
    setLoadingData(true);
    try {
      const res = await axios.get(`${api.getApiUrl()}/technician/work-orders`, {
        headers: { Authorization: `Bearer ${techToken}` }
      });
      setWorkOrders(res.data?.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem('techToken');
        setTechToken('');
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (techToken) {
      fetchTechWorkOrders();
    }
  }, [techToken]);

  const handleUpdateStatus = async (woId, newStatus) => {
    try {
      await axios.post(
        `${api.getApiUrl()}/technician/work-orders/${woId}/status`,
        { status: newStatus, completion_notes: statusNote },
        { headers: { Authorization: `Bearer ${techToken}` } }
      );
      toast.success('İş durumu güncellendi.');
      setActiveWo(null);
      setStatusNote('');
      fetchTechWorkOrders();
    } catch (err) {
      toast.error('Durum güncellenirken hata oluştu.');
    }
  };

  if (!techToken) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-white">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-slate-950/80 max-w-md w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <HardHat className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white">Usta Mobil Portalı</h1>
            <p className="text-xs text-slate-400">Atanan saha iş emirlerini görmek için giriş yapın.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="usta1"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loadingLogin}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-sm transition shadow-lg shadow-amber-500/20"
            >
              {loadingLogin ? 'Giriş Yapılıyor...' : 'Saha Portalına Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col pb-20">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardHat className="w-5 h-5 text-amber-400" />
          <span className="font-extrabold text-sm text-white">Saha İş Emirlerim</span>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem('techToken');
            setTechToken('');
          }}
          className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
          title="Çıkış"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Main Work Orders List */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4">
        {loadingData ? (
          <div className="text-center py-12 text-slate-400 text-xs">İş emirleri yükleniyor...</div>
        ) : workOrders.length > 0 ? (
          workOrders.map(wo => {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wo.customer?.address || 'Ankara Çankaya')}`;
            const phoneClean = wo.customer?.phone?.replace(/\D/g, '') || '';

            return (
              <div key={wo.id} className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4 shadow-xl">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-amber-400">#WO-{wo.id}</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-950/60 border border-blue-500/30 text-blue-400">
                    {wo.status === 'completed' ? 'Tamamlandı' : wo.status === 'in_progress' ? 'İşlemde' : 'Atandı'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Müşteri:</span>
                    <span className="font-bold text-white text-sm">{wo.customer?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Telefon:</span>
                    <a href={`tel:${phoneClean}`} className="font-bold text-blue-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {wo.customer?.phone}
                    </a>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 block">Adres:</span>
                    <p className="font-medium text-slate-200 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      {wo.customer?.address}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Navigation className="w-4 h-4" />
                    Haritada Aç
                  </a>

                  <a
                    href={`https://wa.me/${phoneClean.startsWith('0') ? '9' + phoneClean : phoneClean}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp Yaz
                  </a>
                </div>

                {/* Status Update Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(wo.id, 'in_progress')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition"
                  >
                    🚀 Yoldayım / Başladım
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(wo.id, 'completed')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tamamlandı Yap
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-slate-500 text-xs">
            Atanmış aktif bir iş emriniz bulunmuyor.
          </div>
        )}
      </main>
    </div>
  );
}
