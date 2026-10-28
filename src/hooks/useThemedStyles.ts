import { useMemo } from 'react';
import { themeType } from '@/interface';
import { useThemeStore } from '@/store/themeStore';

export const useThemedStyles = <T>(styleFn: (theme: themeType) => T): T => {
  const theme = useThemeStore(state => state.themeColor);
  return useMemo(() => styleFn(theme), [theme, styleFn]);
};
