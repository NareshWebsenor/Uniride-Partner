import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { radii, spacing } from '@/theme/tokens';

export function Card({ style, ...props }: ViewProps) {
  const colors = useThemeColor();
  return (
    <View
      {...props}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
  },
});
