import { useThemeStore } from '@/store/themeStore';
import { radii, sizes, spacing, typography } from '@/theme/tokens';

export function useTheme() {
  const colors = useThemeStore(state => state.themeColor);
  const mode = useThemeStore(state => state.preference);
  const resolvedTheme = useThemeStore(state => state.resolvedTheme);
  const setMode = useThemeStore(state => state.setPreference);
  return { colors, mode, resolvedTheme, setMode, radii, sizes, spacing, typography };
}
