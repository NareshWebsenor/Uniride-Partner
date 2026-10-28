import { useLanguageStore } from '@/store/languageStore';

export function useLanguage() {
  const language = useLanguageStore(state => state.language);
  const changeLanguage = useLanguageStore(state => state.changeLanguage);
  const isReady = useLanguageStore(state => state.hasHydrated);
  const error = useLanguageStore(state => state.error);
  return { language, changeLanguage, isReady, error };
}
