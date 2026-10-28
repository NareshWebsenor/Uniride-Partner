import React from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextProps as NativeTextProps,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { typography } from '@/theme/tokens';

export type TextProps = NativeTextProps & {
  variant?: 'body' | 'caption' | 'subtitle';
  tone?: 'primary' | 'secondary' | 'error' | 'success';
};

export function Text({
  variant = 'body',
  tone = 'primary',
  style,
  ...props
}: TextProps) {
  const colors = useThemeColor();
  const toneColor = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    error: colors.error,
    success: colors.success,
  };
  return (
    <NativeText
      {...props}
      style={[{ color: toneColor[tone], fontSize: typography[variant] }, style]}
    />
  );
}

export function Heading({
  level = 2,
  style,
  ...props
}: NativeTextProps & { level?: 1 | 2 | 3 }) {
  const colors = useThemeColor();
  return (
    <NativeText
      accessibilityRole="header"
      {...props}
      style={[
        styles.heading,
        {
          color: colors.textPrimary,
          fontSize:
            level === 1
              ? typography.hero
              : level === 2
              ? typography.title
              : typography.subtitle,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  heading: { fontWeight: '700', flexShrink: 1 },
});
