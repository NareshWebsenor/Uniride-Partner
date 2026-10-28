import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Heading, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { BiometricFailure } from '@/service/biometricAppLock';
import { sizes, spacing } from '@/theme/tokens';
import { Ionicons } from '@/utils/fontIcon.utils';

type BiometricLockModalProps = {
  authenticating: boolean;
  error: BiometricFailure | null;
  onUnlock: () => void;
};

// An in-tree modal avoids presenting a second native window over the OS prompt.
export function BiometricLockModal({
  authenticating,
  error,
  onUnlock,
}: BiometricLockModalProps) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityViewIsModal
      style={[
        styles.overlay,
        {
          backgroundColor: colors.overlay,
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}
    >
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        style={StyleSheet.absoluteFill}
      />
      <Card style={styles.card}>
        <ScrollView contentContainerStyle={styles.content}>
          <View accessible={false} style={styles.icon}>
            <Ionicons
              name="lock-closed"
              size={sizes.brandMark}
              color={colors.primary}
            />
          </View>
          <Heading level={2} style={styles.centered}>
            {t('appLock.modalTitle')}
          </Heading>
          <Text tone="secondary" style={styles.centered}>
            {t('appLock.modalDescription')}
          </Text>
          {error && error !== 'cancelled' && !authenticating ? (
            <Text
              tone="error"
              accessibilityLiveRegion="polite"
              style={styles.centered}
            >
              {t(`appLock.errors.${error}`)}
            </Text>
          ) : null}
          <Button
            title={t('appLock.unlock')}
            accessibilityHint={t('appLock.retryHint')}
            loading={authenticating}
            onPress={onUnlock}
          />
        </ScrollView>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: { width: '100%', maxWidth: sizes.authContent, maxHeight: '100%' },
  content: { gap: spacing.md },
  icon: { alignItems: 'center' },
  centered: { textAlign: 'center' },
});
