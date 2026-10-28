import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';
import { ResolvedTheme, ThemeColors, ThemeMode, themes } from '@/theme/colors';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'theme-storage';
let writeQueue = Promise.resolve();
let initialization: Promise<void> | undefined;
let preferenceRevision = 0;

type ThemeStore = {
  preference: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDarkTheme: boolean;
  themeColor: ThemeColors;
  hasHydrated: boolean;
  persistenceError: boolean;
  setPreference: (preference: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  setSystemTheme: (scheme: ResolvedTheme | null | undefined) => void;
};

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'system';

const systemTheme = (): ResolvedTheme =>
  Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

export function resolveTheme(
  preference: ThemeMode,
  scheme: ResolvedTheme = systemTheme(),
) {
  const resolvedTheme = preference === 'system' ? scheme : preference;
  return {
    resolvedTheme,
    isDarkTheme: resolvedTheme === 'dark',
    themeColor: themes[resolvedTheme],
  };
}

/** One owner for theme state. Persist preference, never a stale color snapshot. */
export const useThemeStore = create<ThemeStore>((set, get) => ({
  preference: 'system',
  ...resolveTheme('system'),
  hasHydrated: false,
  persistenceError: false,
  setPreference: preference => {
    if (!isThemeMode(preference)) {
      return Promise.resolve();
    }
    preferenceRevision += 1;
    const revision = preferenceRevision;
    set({ preference, ...resolveTheme(preference), persistenceError: false });
    // Serialize writes so fast taps cannot persist an older selection last.
    writeQueue = writeQueue.then(async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ state: { preference }, version: 1 }),
        );
        if (revision === preferenceRevision) {
          set({ persistenceError: false });
        }
      } catch {
        if (revision === preferenceRevision) {
          set({ persistenceError: true });
        }
        logger.warn('theme.persistence_failed', { scope: 'preferences' });
      }
    });
    return writeQueue;
  },
  toggleTheme: () => get().setPreference(get().isDarkTheme ? 'light' : 'dark'),
  setSystemTheme: scheme => {
    const next = resolveTheme(get().preference, scheme === 'dark' ? 'dark' : 'light');
    if (next.resolvedTheme !== get().resolvedTheme) {
      set(next);
    }
  },
}));

export function readThemePreference(value: unknown): ThemeMode {
  if (!value || typeof value !== 'object' || !('state' in value)) {
    return 'system';
  }
  const state = value.state;
  if (!state || typeof state !== 'object') {
    return 'system';
  }
  if ('preference' in state) {
    return isThemeMode(state.preference) ? state.preference : 'system';
  }
  // Upgrade the template's existing persisted choice without losing it.
  if ('isDarkTheme' in state && typeof state.isDarkTheme === 'boolean') {
    return state.isDarkTheme ? 'dark' : 'light';
  }
  return 'system';
}

export function initializeTheme(): Promise<void> {
  if (!initialization) {
    const revisionAtStart = preferenceRevision;
    initialization = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const preference = raw ? readThemePreference(JSON.parse(raw)) : 'system';
        if (preferenceRevision === revisionAtStart) {
          useThemeStore.setState({ preference, ...resolveTheme(preference) });
        }
      } catch {
        if (preferenceRevision === revisionAtStart) {
          useThemeStore.setState({ persistenceError: true });
        }
        logger.warn('theme.hydration_failed', { scope: 'preferences' });
      } finally {
        useThemeStore.setState({ hasHydrated: true });
      }
    })();
  }
  return initialization;
}
