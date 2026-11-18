import React from 'react';
import { StyleSheet, TextProps as NativeTextProps } from 'react-native';
import { ScaledText as NativeText } from '@/components/ui/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { fSize } from '@/utils/responsive.utils';

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
      style={[
        {
          color: toneColor[tone],
          fontSize:
            variant === 'caption'
              ? fSize(1.5)
              : variant === 'subtitle'
              ? fSize(2.25)
              : fSize(2),
        },
        style,
      ]}
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
            level === 1 ? fSize(4) : level === 2 ? fSize(3) : fSize(2.25),
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  heading: { fontWeight: '700', flexShrink: 1 },
});
