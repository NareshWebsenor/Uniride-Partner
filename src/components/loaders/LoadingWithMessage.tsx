import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import React from 'react';
import { themeType } from '@/interface/theme.type';
import { height, width } from '@/utils/responsive.utils';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

type props = {
  style?: ViewStyle;
  msg?: string;
};

export default function LoadingWithMessage({ style, msg = '' }: props) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  return (
    <View style={[styles.container, style]}>
      <View style={styles.subContainer}>
        <ActivityIndicator size={'large'} color={themeColor.primary} />
        <Text style={{ color: themeColor.textPrimary }}>{msg}</Text>
      </View>
    </View>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    container: {
      height: Platform.OS == 'android' ? height : height,
      width: width,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      backgroundColor: theme.overlay,
      position: 'absolute',
    },
    subContainer: {
      backgroundColor: theme.surface,
      minWidth: '60%',
      maxWidth: '90%',
      minHeight: 120,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      borderRadius: 10,
      zIndex: 99999,
    },
  });
