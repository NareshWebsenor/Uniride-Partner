import React from 'react';
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import SafeAreaWrapper from '@/components/hoc/SafeAreaWrapper';
import { Container } from './Container';

export type ScreenWrapperProps = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ScreenWrapper({
  children,
  scroll = true,
  style,
}: ScreenWrapperProps) {
  return (
    <SafeAreaWrapper>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <Container style={style}>{children}</Container>
        </ScrollView>
      ) : (
        <Container style={[styles.fill, style]}>{children}</Container>
      )}
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
});
