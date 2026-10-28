import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { sizes, spacing } from '@/theme/tokens';

export function Container({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.container, style]} />;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: sizes.maxContentWidth,
    alignSelf: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
});
