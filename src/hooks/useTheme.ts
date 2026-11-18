import { useThemeStore } from '@/store/themeStore';

export function useTheme() {
  const colors = useThemeStore(state => state.themeColor);
  const mode = useThemeStore(state => state.preference);
  const resolvedTheme = useThemeStore(state => state.resolvedTheme);
  const setMode = useThemeStore(state => state.setPreference);
  return { colors, mode, resolvedTheme, setMode };
}
