import { useThemeStore } from '@/store/themeStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  useSafeArea?: boolean;
  style?: ViewStyle;
  statusBarColor?: string;
  StatusBarStyle?: 'default' | 'light-content' | 'dark-content';
}

const SafeAreaWrapper = ({
  children,
  useSafeArea = true,
  style,
  statusBarColor,
  StatusBarStyle,
}: SafeAreaWrapperProps) => {
  const colors = useThemeColor();
  const isDarkTheme = useThemeStore(state => state.isDarkTheme);
  const backgroundColor = statusBarColor ?? colors.background;
  const Wrapper = useSafeArea ? SafeAreaView : View;

  return (
    <View style={[styles.outer, { backgroundColor }]}>
      <StatusBar
        backgroundColor={backgroundColor}
        barStyle={StatusBarStyle ?? (isDarkTheme ? 'light-content' : 'dark-content')}
        translucent={!useSafeArea} // Key for Android 33+
      />
      <Wrapper style={[styles.container, style]}>{children}</Wrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});

export default SafeAreaWrapper;
