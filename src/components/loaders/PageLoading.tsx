import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import React from 'react';
import { themeType } from '@/interface/theme.type';
import { height } from '@/utils/responsive.utils';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';
type props = {
  style?: ViewStyle;
};

export default function PageLoading({ style }: props) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={'large'} color={themeColor.primary} />
    </View>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: height / 1.5,
    },
  });
