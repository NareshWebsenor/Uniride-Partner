import React, { createContext, ReactNode } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { AppLanguage } from '@/localizations';
import { useLanguageStore } from '@/store/languageStore';

// Define the type for the context
interface AppContextType {
  currentLanguage: AppLanguage;
  changeLanguage: (language: AppLanguage) => Promise<void>;
}

// Create the context with the default values
export const AppContext = createContext<AppContextType>({
  currentLanguage: 'en',
  changeLanguage: language =>
    useLanguageStore.getState().changeLanguage(language),
});

// Compatibility facade only: Zustand owns the preference and persistence.
export const ContextProvider = ({ children }: { children: ReactNode }) => {
  const { language, changeLanguage } = useLanguage();
  return (
    <AppContext.Provider
      value={{
        changeLanguage,
        currentLanguage: language,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
