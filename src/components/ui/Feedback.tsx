import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  DimensionValue,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { radii, spacing } from '@/theme/tokens';
import { Button } from './Button';
import { Heading, Text } from './Text';

export function LoadingIndicator({ message }: { message?: string }) {
  const colors = useThemeColor();
  const { t } = useTranslation();
  return (
    <View accessibilityRole="progressbar" style={styles.state}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text tone="secondary">{message ?? t('ui.loading')}</Text>
    </View>
  );
}

export function Skeleton({
  width = '100%',
  height = spacing.lg,
}: {
  width?: DimensionValue;
  height?: number;
}) {
  const colors = useThemeColor();
  const opacity = useRef(new Animated.Value(0.4)).current;
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) {
        setReduceMotion(value);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.6);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reduceMotion]);
  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no"
      style={{
        width,
        height,
        opacity,
        borderRadius: radii.sm,
        backgroundColor: colors.disabled,
      }}
    />
  );
}

type StateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: StateProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.state}>
      <Heading level={3}>{title ?? t('ui.emptyTitle')}</Heading>
      <Text tone="secondary" style={styles.message}>
        {message ?? t('ui.emptyMessage')}
      </Text>
      {onAction ? (
        <Button title={actionLabel ?? t('ui.retry')} onPress={onAction} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title,
  message,
  actionLabel,
  onAction,
}: StateProps) {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={title ?? t('ui.errorTitle')}
      message={message ?? t('ui.errorMessage')}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}

const styles = StyleSheet.create({
  state: { padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
  message: { textAlign: 'center' },
});
