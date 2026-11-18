import { StyleSheet, View } from 'react-native';
import { ScaledText as Text } from '@/components/ui/Typography';
import React from 'react';
import { themeType } from '@/interface/theme.type';
import { fontSize } from '@/utils/fontIcon.utils';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

interface props {
  errorMsg: string | undefined;
}

export default function ErrorText({ errorMsg }: props) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  return <Text style={styles.error}>{errorMsg}</Text>;
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    error: {
      color: theme.red,
      fontSize: fontSize.f12,
      marginLeft: 5,
      marginTop: 2,
    },
  });
