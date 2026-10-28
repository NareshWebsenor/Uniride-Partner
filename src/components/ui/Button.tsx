import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { radii, sizes, spacing } from '@/theme/tokens';
import { Text } from './Text';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'brand';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  activeOpacity?: number;
  gradient?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  textStyle,
  icon,
  activeOpacity = 0.7,
  gradient,
  accessibilityState,
  ...props
}: ButtonProps) {
  const colors = useThemeColor();
  const unavailable = disabled || loading;
  const foreground =
    variant === 'brand'
      ? colors.onBrandAccent
      : variant === 'primary'
      ? colors.onPrimary
      : colors.textPrimary;
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        disabled: unavailable,
        busy: loading,
      }}
      disabled={unavailable}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: unavailable
            ? colors.disabled
            : variant === 'brand'
            ? colors.brandAccent
            : variant === 'primary'
            ? colors.primary
            : variant === 'secondary'
            ? colors.surfaceRaised
            : colors.transparent,
          borderColor:
            variant === 'outline' ? colors.border : colors.transparent,
          opacity: pressed ? activeOpacity : 1,
        },
        style,
      ]}
    >
      {gradient && !unavailable ? (
        <LinearGradient
          pointerEvents="none"
          colors={[colors.secondary, colors.secondaryS1, colors.secondary]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {loading ? <ActivityIndicator color={foreground} /> : icon}
      <Text style={[styles.label, { color: foreground }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}

export type IconButtonProps = Omit<ButtonProps, 'title' | 'textStyle'> & {
  accessibilityLabel: string;
  icon: React.ReactNode;
};

export function IconButton({
  accessibilityLabel,
  icon,
  style,
  disabled,
  loading,
  variant: _variant,
  gradient: _gradient,
  activeOpacity = 0.7,
  accessibilityState,
  ...props
}: IconButtonProps) {
  const colors = useThemeColor();
  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        disabled: disabled || loading,
        busy: loading,
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: colors.surfaceRaised,
          opacity: disabled ? 0.4 : pressed ? activeOpacity : 1,
        },
        style,
      ]}
    >
      <View>
        {loading ? <ActivityIndicator color={colors.primary} /> : icon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  label: { fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  iconButton: {
    minWidth: sizes.touchTarget,
    minHeight: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
});
