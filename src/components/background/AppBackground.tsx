import { StyleSheet, View } from 'react-native';
import React from 'react';
import { themeType } from '@/interface';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { ReactNode } from 'react';
import SafeAreaWrapper from '../hoc/SafeAreaWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppBackground({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(createStyle);
  const { top, bottom } = useSafeAreaInsets();
  return (
    <SafeAreaWrapper useSafeArea={false} StatusBarStyle="dark-content">
      <View
        style={[
          styles.gradiantBackground,
          { paddingTop: top, paddingBottom: bottom },
        ]}
      >
        {children}
      </View>
    </SafeAreaWrapper>
  );
}

const createStyle = (themeColor: themeType) =>
  StyleSheet.create({
    gradiantBackground: {
      flex: 1,
      backgroundColor: themeColor.backgroundColor,
    },
  });
