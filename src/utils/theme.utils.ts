import { createElement, Fragment, useEffect } from "react";
import { StatusBar, useColorScheme } from "react-native";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import type { Theme } from "@react-navigation/native";
import type {
  ResolvedTheme,
  ThemeColors,
  ThemeProviderProps,
} from "@/interface/theme.type";

// Edit palette colors here. Semantic names below reuse these values.
// System mode resolves to one of these palettes; manual choices stay pinned.
const lightPalette = {
  // Base
  backgroundColor: "#FFFFFF",
  backgroundColorS1: "#FFFFFF",
  backgroundColorS2: "#F8F9FF",

  // Primary Family
  primary: "#293B80",
  primaryS1: "#E6E9FF",
  primaryS2: "#F2F1FD",
  primaryS3: "#C4CDF1",

  // Secondary / Tertiary
  secondary: "#A162F6",
  tertiary: "#9DB2CE",

  // Texts
  text: "#1D2433",
  textS1: "#606975",
  textS2: "#5B6472",
  descriptionText: "#0c79e6ff",
  extraLightText: "#697180",
  lightTextBlack: "#5B6472",
  lightTextwhite: "rgba(255, 255, 255, 0.7)",

  // Border / Placeholder
  borderColor: "#DFE2E7",
  placeHolderColor: "#737B87",

  // Utility colors
  white: "#FFFFFF",
  black: "#000000",
  red: "#e9353c",
  redS1: "#FEE2E2",
  gray: "#E5E5E5",
  grayS1: "#C8C8C8",
  grayS2: "#F3F4F6",
  grayS3: "#F9F9FB",
  green: "#23834A",
  greenS1: "#E8F5EC",
  brown: "#301230",
  yellow: "#FAB71D",
  yellowS1: "#FFF6E0",
  lightOrange: "#FFA432",
};

const darkPalette = {
  // === Base ===
  backgroundColor: "#0D0D0D", // Main app background
  backgroundColorS1: "#161616", // Secondary surface
  backgroundColorS2: "#1E1E1E", // Cards / section background

  // === Primary Family ===
  primary: "#6675FF", // Same brand color (works well on dark)
  primaryS1: "rgba(102, 117, 255, 0.15)",
  primaryS2: "rgba(102, 117, 255, 0.10)",
  primaryS3: "rgba(102, 117, 255, 0.05)",

  // === Secondary / Tertiary ===
  secondary: "#1E1E1E", // Component secondary surfaces
  tertiary: "#7C8CA5", // Softer version of your light theme tertiary

  // === Texts ===
  text: "#FFFFFF", // Primary text
  textS1: "#E5E5E5", // Subheading
  textS2: "#A1A1A1", // Caption / secondary text
  descriptionText: "#8CB4D9", // Slightly lighter than light theme to pop on dark
  extraLightText: "#CCCCCC",
  lightTextBlack: "#B3B3B3", // Balanced light gray for icons
  lightTextwhite: "rgba(255, 255, 255, 0.7)",

  // === Border / Placeholder ===
  borderColor: "#2A2A2A",
  placeHolderColor: "#7D7D7D",

  // === Utility colors ===
  white: "#FFFFFF",
  black: "#000000",

  red: "#FF5C5C",
  redS1: "#3A1F1F",

  gray: "#9A9A9A",
  grayS1: "#3A3A3A",
  grayS2: "#2C2C2C",
  grayS3: "#1A1A1A",

  green: "#28C76F",
  greenS1: "#1B3C2D",

  brown: "#5A2A5A",

  yellow: "#F4D03F",
  yellowS1: "#3A331A",

  lightOrange: "#FFAE48",
};

export const LightThemeColors: ThemeColors = {
  ...lightPalette,
  background: lightPalette.backgroundColor,
  surface: lightPalette.backgroundColorS1,
  surfaceRaised: lightPalette.grayS2,
  textPrimary: lightPalette.text,
  textSecondary: lightPalette.textS2,
  border: lightPalette.borderColor,
  onPrimary: lightPalette.white,
  tabActiveBackground: "#E9EBF3",
  tabInactive: "#A3A3A3",
  success: lightPalette.green,
  warning: lightPalette.yellow,
  error: lightPalette.red,
  disabled: lightPalette.gray,
  overlay: "rgba(0, 0, 0, 0.55)",
  transparent: "transparent",
  shadow: lightPalette.black,
  onImage: lightPalette.white,
  googleBlue: "#4285F4",
  googleGreen: "#34A853",
  googleYellow: "#FBBC05",
  googleRed: "#EA4335",
  brandAccent: "#F8C948",
  onBrandAccent: "#202020",
  brandMark: "#080808",
  onBrandMark: "#FFFFFF",
  brandLink: "#2945A8",
  confirmation: "#287A46",
  onConfirmation: "#FFFFFF",
  backgroundColorS3: "#EFE8DB",
  secondaryS1: "#121F3A",
  secondaryS2: "#64748B",
  greenS2: "#065F46",
  gold: "#9C6508",
  goldLight: "#FDE68A",
  goldLighter: "#FEF9E7",
  goldGradient: ["#FDE68A", "#FEF9E7"],
};

export const DarkThemeColors: ThemeColors = {
  ...darkPalette,
  background: darkPalette.backgroundColor,
  surface: darkPalette.backgroundColorS1,
  surfaceRaised: darkPalette.grayS2,
  textPrimary: darkPalette.text,
  textSecondary: darkPalette.textS2,
  border: darkPalette.borderColor,
  onPrimary: darkPalette.white,
  tabActiveBackground: "#282D47",
  tabInactive: "#A1A1A1",
  success: darkPalette.green,
  warning: darkPalette.yellow,
  error: darkPalette.red,
  disabled: darkPalette.grayS2,
  overlay: "rgba(0, 0, 0, 0.75)",
  transparent: "transparent",
  shadow: darkPalette.black,
  onImage: darkPalette.white,
  googleBlue: "#4285F4",
  googleGreen: "#34A853",
  googleYellow: "#FBBC05",
  googleRed: "#EA4335",
  brandAccent: "#F8C948",
  onBrandAccent: "#202020",
  brandMark: "#080808",
  onBrandMark: "#FFFFFF",
  brandLink: "#A9BAFF",
  confirmation: "#57BF75",
  onConfirmation: "#102819",
  backgroundColorS3: "#303A4B",
  secondaryS1: "#BCCCEB",
  secondaryS2: "#AABAD6",
  greenS2: "#A5EAC2",
  gold: "#F6CB73",
  goldLight: "#68552E",
  goldLighter: "#312C22",
  goldGradient: ["#68552E", "#312C22"],
};

// Compatibility names refer to the same palettes, never separate copies.
export { LightThemeColors as lightColors, DarkThemeColors as darkColors };

export const themes: Record<ResolvedTheme, ThemeColors> = {
  light: LightThemeColors,
  dark: DarkThemeColors,
};

// Derive icon contrast from the actual surface, including custom backgrounds.
export function statusBarStyleForColor(
  background: string,
  darkFallback = false
) {
  let hex = background.replace(/^#/, "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((value) => value + value)
      .join("");
  if (!/^[0-9a-f]{6}$/i.test(hex))
    return darkFallback ? "light-content" : "dark-content";
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 < 128
    ? "light-content"
    : "dark-content";
}

/** State is supplied by App so palette consumers do not import their own store. */
export function ThemeProvider({
  children,
  isDarkTheme,
  onSystemThemeChange,
}: ThemeProviderProps) {
  const scheme = useColorScheme();

  useEffect(() => {
    onSystemThemeChange(scheme === "dark" ? "dark" : "light");
  }, [scheme, onSystemThemeChange]);

  return createElement(
    Fragment,
    null,
    createElement(StatusBar, {
      barStyle: isDarkTheme ? "light-content" : "dark-content",
    }),
    children
  );
}

export function createNavigationTheme(
  mode: ResolvedTheme,
  colors: ThemeColors
): Theme {
  return {
    ...(mode === "dark" ? DarkTheme : DefaultTheme),
    dark: mode === "dark",
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.error,
    },
  };
}
