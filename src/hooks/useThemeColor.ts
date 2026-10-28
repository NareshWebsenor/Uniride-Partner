import { useThemeStore } from '@/store/themeStore';

export const useThemeColor = () => {
  return useThemeStore(state => state.themeColor);
};
