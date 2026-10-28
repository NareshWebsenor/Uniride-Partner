import { ActivityIndicator, StyleSheet, View } from 'react-native';
import React from 'react';
import { themeType } from '@/interface/theme.type';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

type props = {
  loading: boolean;
};

export default function FooterLoading({ loading }: props) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  if (!loading) return null;
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
      }}
    >
      <ActivityIndicator size={'small'} color={themeColor.primary} />
    </View>
  );
}

const createStyle = (theme: themeType) => StyleSheet.create({});
