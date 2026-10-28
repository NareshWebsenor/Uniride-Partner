import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import English from './en/translation.json';
import Hindi from './hi/translation.json';

export const supportedLanguages = ['en', 'hi'] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export const isAppLanguage = (value: unknown): value is AppLanguage =>
  value === 'en' || value === 'hi';

// Bundled resources initialize synchronously without native helpers or storage.
export const i18nReady = i18n.use(initReactI18next).init({
  resources: {
    en: { translation: English },
    hi: { translation: Hindi },
  },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: [...supportedLanguages],
  initAsync: false,
  showSupportNotice: false,
  returnNull: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
