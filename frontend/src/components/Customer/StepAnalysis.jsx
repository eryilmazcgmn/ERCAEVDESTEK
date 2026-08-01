import React, { useState } from 'react';
import { UploadCloud, ChevronRight, Camera, Trash2, Image } from 'lucide-react';

export default function StepAnalysis({
  uploadedPhotos,
  analyzing,
  handlePhotoUpload,
  removePhoto,
  setActiveStep
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const syntheticEvent = { target: { files: e.dataTransfer.files } };
      handlePhotoUpload(syntheticEvent);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Fotoğraflı Keşif (İsteğe Bağlı)</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Yüklenen: {uploadedPhotos.length}/10</span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition cursor-pointer relative ${
              isDragging
                ? 'border-primary-500 bg-primary-100/50 dark:bg-primary-950/40 scale-[1.01]'
                : 'border-slate-200 dark:border-gray-800 bg-primary-50/50 dark:bg-primary-950/10 hover:border-primary-500/40'
            }`}
          >
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              onChange={handlePhotoUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              aria-label="Fotoğraf yükle"
            />
            <div className="p-4 rounded-2xl bg-primary-600/10 text-primary-400 mb-3">
              <UploadCloud className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-gray-200 mb-1">
              Fotoğrafları Buraya Sürükleyin veya Tıklayıp Seçin
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 max-w-xs mb-4">
              İşlem yapılacak alanın fotoğraflarını yükleyerek ustalarımızın doğru fiyat teklifi vermesine yardımcı olun.
            </p>

            {/* Mobile Camera shortcut */}
            <div className="relative z-20 flex gap-2">
              <label className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-gray-900 border border-slate-700 dark:border-gray-700 text-xs font-bold text-white hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-4 h-4 text-primary-400" />
                Kamera ile Çek (Mobil)
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {analyzing && (
          <div className="mt-4 flex items-center gap-2 text-sm text-primary-400 font-medium justify-center p-3 rounded-xl bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-500/20">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></span>
            Fotoğraf Güvenli Şekilde Yükleniyor...
          </div>
        )}

        {/* Uploaded Gallery Preview */}
        {uploadedPhotos.length > 0 && (
          <div className="mt-6 space-y-3">
            <span className="text-xs text-slate-500 dark:text-gray-400 font-bold block uppercase tracking-wider">
              Yüklenen Referans Fotoğrafları ({uploadedPhotos.length}/10)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {uploadedPhotos.map((url, i) => (
                <div key={i} className="h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800 relative group bg-slate-100 dark:bg-gray-900">
                  <img src={url} alt={`Referans ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition"
                      title="Büyüt"
                    >
                      <Image className="w-4 h-4" />
                    </a>
                    <button 
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-200 dark:border-gray-800 mt-6 md:relative fixed bottom-0 left-0 right-0 p-4 md:p-0 bg-white dark:bg-gray-950 md:bg-transparent border-t md:border-t-0 border-slate-200 dark:border-gray-800 z-30">
        <button 
          type="button" 
          onClick={() => setActiveStep(2)} 
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition flex items-center justify-center"
        >
          Geri
        </button>
        <button 
          type="button" 
          onClick={() => setActiveStep(4)} 
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-sm font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer"
        >
          İletişim & Adres Adımına Geç
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
