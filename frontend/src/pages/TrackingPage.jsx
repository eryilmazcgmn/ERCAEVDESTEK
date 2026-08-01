import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TrackingPageComponent from '../components/Customer/TrackingPage';

/**
 * Standalone tracking page with its own route (/tracking or /tracking/:sessionId).
 * Supports both session ID and phone number lookups.
 */
export default function TrackingPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-gray-200">
      {/* Simple Header */}
      <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white/60 dark:bg-gray-950/40 backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={() => navigate('/')}
          className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline"
        >
          ← Ana Sayfaya Dön
        </button>
        <h1 className="text-sm font-bold text-slate-900 dark:text-white">Sipariş Takip</h1>
      </header>

      <div className="py-8">
        <TrackingPageComponent
          initialSessionId={sessionId || ''}
          onBack={() => navigate('/')}
        />
      </div>
    </div>
  );
}
