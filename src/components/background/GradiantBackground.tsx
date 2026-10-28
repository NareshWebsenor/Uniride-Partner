import { StyleSheet } from 'react-native';
import React from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';
import { themeType } from '@/interface';
import LinearGradient from 'react-native-linear-gradient';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { ReactNode } from 'react';
import SafeAreaWrapper from '../hoc/SafeAreaWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GradiantBackground({
  children,
}: {
  children: ReactNode;
}) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  const { top, bottom } = useSafeAreaInsets();
  return (
    <SafeAreaWrapper useSafeArea={false} StatusBarStyle="dark-content">
      <LinearGradient
        colors={[
          themeColor.backgroundColor,
          themeColor.backgroundColorS2,
          themeColor.backgroundColorS3,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.gradiantBackground,
          { paddingTop: top, paddingBottom: bottom },
        ]}
      >
        {children}
      </LinearGradient>
    </SafeAreaWrapper>
  );
}

const createStyle = (themeColor: themeType) =>
  StyleSheet.create({
    gradiantBackground: {
      flex: 1,
    },
  });
