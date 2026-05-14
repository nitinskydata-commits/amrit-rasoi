import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    siteName: 'SBMI - Amrit Rasoi',
    tagline: 'Fresh & Authentic Indian Food Products',
    supportEmail: 'support@sbmi.com',
    supportPhone: '+91 1234567890',
    companyAddress: 'Your Address Here',
    logo: { url: '' },
    gstNumber: '',
    fssaiNumber: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`);
      if (response.data && response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Keep using default settings if fetch fails
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
