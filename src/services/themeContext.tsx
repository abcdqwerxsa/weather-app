import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadSettings, saveSettings } from './settingsService';

export type ThemeType = 'glass' | 'neo' | 'minimal';

interface ThemeContextType {
  activeTheme: ThemeType;
  setActiveTheme: (theme: ThemeType) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveThemeState] = useState<ThemeType>('glass');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initTheme = async () => {
      try {
        const settings = await loadSettings();
        if (settings.theme) {
          setActiveThemeState(settings.theme);
        }
      } catch (err) {
        console.error('Failed to load initial theme:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initTheme();
  }, []);

  const setActiveTheme = async (theme: ThemeType) => {
    setActiveThemeState(theme);
    try {
      const settings = await loadSettings();
      settings.theme = theme;
      await saveSettings(settings);
    } catch (err) {
      console.error('Failed to save theme setting:', err);
    }
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
