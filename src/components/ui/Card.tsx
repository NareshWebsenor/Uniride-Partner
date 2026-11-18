import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { wp } from '@/utils/responsive.utils';

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
    padding: wp('4%'),
    gap: wp('4%'),
    borderWidth: 1,
    borderRadius: wp('5%'),
  },
});
