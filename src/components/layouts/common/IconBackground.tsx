import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import React, { ReactNode } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { themeType } from '@/interface';

type props = {
  children: ReactNode;
  style?: ViewStyle;
  colors?: string[];
};

export default function IconBackground({ children, style, colors }: props) {
  const styles = useThemedStyles(createStyles);
  const themeColor = useThemeColor();
  return (
    <LinearGradient
      style={[styles.amountIconBox, style]}
      colors={colors || [themeColor.primary, themeColor.primaryS1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const createStyles = (theme: themeType) =>
  StyleSheet.create({
    amountIconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
