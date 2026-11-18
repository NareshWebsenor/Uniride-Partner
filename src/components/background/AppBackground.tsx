import { StyleSheet, View } from 'react-native';
import React, { useCallback } from 'react';
import type {
  AppBackgroundProps,
  AppBackgroundStyleOptions,
  themeType,
} from '@/interface';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import SafeAreaWrapper from '../hoc/SafeAreaWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AppBackground({
  children,
  style,
  backgroundColor,
  extendUnderStatusBar = false,
}: AppBackgroundProps) {
  const { top, bottom, left, right } = useSafeAreaInsets();
  const colors = useThemeColor();
  const themedStyle = useCallback(
    (theme: themeType) =>
      createStyle(theme, {
        top: extendUnderStatusBar ? 0 : top,
        bottom,
        left,
        right,
        backgroundColor,
      }),
    [top, bottom, left, right, backgroundColor, extendUnderStatusBar],
  );
  const styles = useThemedStyles(themedStyle);
  return (
    <SafeAreaWrapper
      useSafeArea={false}
      statusBarColor={
        extendUnderStatusBar ? colors.transparent : backgroundColor
      }
      StatusBarStyle={extendUnderStatusBar ? 'light-content' : undefined}
    >
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaWrapper>
  );
}

const createStyle = (
  theme: themeType,
  { top, bottom, left, right, backgroundColor }: AppBackgroundStyleOptions,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: top,
      paddingBottom: bottom,
      paddingLeft: left,
      paddingRight: right,
      backgroundColor: backgroundColor ?? theme.background,
    },
  });
