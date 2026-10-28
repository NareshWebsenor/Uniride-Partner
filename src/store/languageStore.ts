import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import i18n, {
  AppLanguage,
  i18nReady,
  isAppLanguage,
} from '@/localizations';
import { ASYNC_KEYS } from '@/constants/storage';
import { logger } from '@/utils/logger';

type LanguageError =
  | 'settings.languageReadError'
  | 'settings.languageSaveError'
  | null;

interface LanguageState {
  language: AppLanguage;
  hasHydrated: boolean;
  error: LanguageError;
  changeLanguage: (language: AppLanguage) => Promise<void>;
}

let hydration: Promise<void> | undefined;
let pendingChange = Promise.resolve();

export const useLanguageStore = create<LanguageState>()(set => ({
  language: 'en',
  hasHydrated: false,
  error: null,
  changeLanguage: language => {
    // Serialize writes so rapid taps cannot persist an older selection last.
    pendingChange = pendingChange.then(async () => {
      if (!isAppLanguage(language)) {
        return;
      }
      try {
        await initializeLanguage();
        await AsyncStorage.setItem(ASYNC_KEYS.LANGUAGE, JSON.stringify(language));
        await i18n.changeLanguage(language);
        set({ language, error: null });
        logger.debug('preferences.language.saved', { scope: 'language' });
      } catch {
        set({ error: 'settings.languageSaveError' });
        logger.warn('preferences.language.save_failed', { scope: 'language' });
      }
    });
    return pendingChange;
  },
}));

/** Resolve the legacy JSON-string preference before the app mounts screens. */
export function initializeLanguage(): Promise<void> {
  if (hydration) {
    return hydration;
  }
  hydration = (async () => {
    let language: AppLanguage = 'en';
    let error: LanguageError = null;
    try {
      await i18nReady;
      const stored = await AsyncStorage.getItem(ASYNC_KEYS.LANGUAGE);
      const parsed: unknown = stored === null ? 'en' : JSON.parse(stored);
      if (isAppLanguage(parsed)) {
        language = parsed;
      }
    } catch {
      error = 'settings.languageReadError';
      logger.warn('preferences.language.read_failed', { scope: 'language' });
    }
    try {
      await i18n.changeLanguage(language);
    } catch {
      language = 'en';
      error = 'settings.languageReadError';
      logger.warn('preferences.language.initialize_failed', {
        scope: 'language',
      });
    } finally {
      useLanguageStore.setState({ language, error, hasHydrated: true });
    }
  })();
  return hydration;
}
