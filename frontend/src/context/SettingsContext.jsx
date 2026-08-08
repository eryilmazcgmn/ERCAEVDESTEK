import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../services/api';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        company_name: 'ERCA EV DESTEK',
        contact_email: '',
        contact_phone: '',
        company_phone: '',
        company_address: '',
        primary_color: '#9333ea',
        secondary_color: '#3b82f6',
        border_radius: '0.75rem',
        custom_css: '',
        logo_path: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${api.getApiUrl()}/settings`)
            .then(res => {
                const body = res.data;
                // API returns {status, message, data: {...settings}, errors}
                const payload = (body && body.data && typeof body.data === 'object') ? body.data : body;
                if(payload && typeof payload === 'object' && !payload.status && Object.keys(payload).length > 0) {
                    setSettings(prev => ({...prev, ...payload}));
                } else if (payload && typeof payload === 'object' && payload.status === true && payload.data) {
                    setSettings(prev => ({...prev, ...payload.data}));
                } else if (payload && typeof payload === 'object') {
                    // Filter out API meta fields
                    const { status, message, errors, ...settingsData } = payload;
                    if (Object.keys(settingsData).length > 0) {
                        setSettings(prev => ({...prev, ...settingsData}));
                    }
                }
            })
            .catch(err => console.error("Settings load error:", err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        // Inject CSS Variables for Dynamic Theme
        const root = document.documentElement;
        if(settings.primary_color) {
            root.style.setProperty('--dyn-primary-600', settings.primary_color);
            root.style.setProperty('--dyn-primary-50', `color-mix(in srgb, ${settings.primary_color} 10%, white)`);
            root.style.setProperty('--dyn-primary-100', `color-mix(in srgb, ${settings.primary_color} 20%, white)`);
            root.style.setProperty('--dyn-primary-200', `color-mix(in srgb, ${settings.primary_color} 40%, white)`);
            root.style.setProperty('--dyn-primary-300', `color-mix(in srgb, ${settings.primary_color} 60%, white)`);
            root.style.setProperty('--dyn-primary-400', `color-mix(in srgb, ${settings.primary_color} 80%, white)`);
            root.style.setProperty('--dyn-primary-500', `color-mix(in srgb, ${settings.primary_color} 90%, white)`);
            root.style.setProperty('--dyn-primary-700', `color-mix(in srgb, ${settings.primary_color} 85%, black)`);
            root.style.setProperty('--dyn-primary-800', `color-mix(in srgb, ${settings.primary_color} 70%, black)`);
            root.style.setProperty('--dyn-primary-900', `color-mix(in srgb, ${settings.primary_color} 50%, black)`);
            root.style.setProperty('--dyn-primary-950', `color-mix(in srgb, ${settings.primary_color} 30%, black)`);
        }
        if(settings.border_radius) {
            root.style.setProperty('--dyn-radius', settings.border_radius);
        }
        
        // Inject Custom CSS
        let customStyleEl = document.getElementById('dynamic-custom-css');
        if (!customStyleEl) {
            customStyleEl = document.createElement('style');
            customStyleEl.id = 'dynamic-custom-css';
            document.head.appendChild(customStyleEl);
        }
        customStyleEl.innerHTML = settings.custom_css || '';

    }, [settings]);

    return (
        <SettingsContext.Provider value={{ settings, setSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};
