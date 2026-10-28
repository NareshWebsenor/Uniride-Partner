import { themeType } from '@/interface';
import { DarkThemeColors, LightThemeColors } from '@/utils/theme.utils';
import { createSlice } from '@reduxjs/toolkit';
import { Appearance } from 'react-native';

type initialStateType = {
  isDarkTheme: boolean;
  themeColor: themeType;
};

const scheme = Appearance.getColorScheme();
const initialState: initialStateType = {
  isDarkTheme: scheme === 'dark',
  themeColor: scheme === 'dark' ? DarkThemeColors : LightThemeColors,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, { payload }) => {
      state.themeColor = {
        ...state.themeColor,
        primary: payload.primary_color,
        secondary: payload.secondary_color,
        tertiary: payload.tertiary_color,
      };
    },
    ToggleTheme: state => {
      state.isDarkTheme = !state.isDarkTheme;
      state.themeColor = state.isDarkTheme ? DarkThemeColors : LightThemeColors;
    },
    setSystemTheme: (state, { payload }) => {
      const isDark = payload === 'dark';
      state.isDarkTheme = isDark;
      state.themeColor = isDark ? DarkThemeColors : LightThemeColors;
    },
  },
});

export const ThemeManager = themeSlice.reducer;
export const { ToggleTheme, setTheme, setSystemTheme } = themeSlice.actions;
