import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { BIOMETRY_TYPE } from 'react-native-keychain';
import { Alert, Button, Heading, SafeAreaWrapper, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { BiometricFailure } from '@/service/biometricAppLock';
import { getBiometricAppLockType } from '@/service/biometricAppLock';
import { radii, sizes, spacing } from '@/theme/tokens';
import { Ionicons, MaterialDesignIcons } from '@/utils/fontIcon.utils';

type BiometricLockScreenProps = {
  mode: 'checking' | 'locked';
  error: BiometricFailure | null;
  authenticating: boolean;
  onRetry?: () => void;
  onLogin?: () => void;
};

export function BiometricLockScreen({
  mode,
  error,
  authenticating,
  onRetry,
  onLogin,
}: BiometricLockScreenProps) {
  const colors = useThemeColor();
  const { t } = useAppTranslation();
  const [biometryType, setBiometryType] = useState<BIOMETRY_TYPE | null>(null);

  useEffect(() => {
    let active = true;
    if (mode === 'locked') {
      getBiometricAppLockType().then(type => {
        if (active) {
          setBiometryType(type);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [mode]);

  const isFaceBiometry =
    biometryType === BIOMETRY_TYPE.FACE_ID ||
    biometryType === BIOMETRY_TYPE.FACE;

  return (
    <SafeAreaWrapper
      statusBarColor={colors.background}
      style={{ backgroundColor: colors.background }}
    >
      <View style={styles.content}>
        <View
          accessible={false}
          style={[
            styles.icon,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {isFaceBiometry ? (
            <MaterialDesignIcons
              name="face-recognition"
              size={sizes.brandMark}
              color={colors.primary}
            />
          ) : (
            <Ionicons
              name={
                biometryType === BIOMETRY_TYPE.TOUCH_ID ||
                biometryType === BIOMETRY_TYPE.FINGERPRINT
                  ? 'finger-print'
                  : 'lock-closed'
              }
              size={sizes.brandMark}
              color={colors.primary}
            />
          )}
        </View>
        <Heading level={1} style={styles.title}>
          {t(
            mode === 'checking'
              ? 'appLock.checkingTitle'
              : biometryType === BIOMETRY_TYPE.FACE_ID
                ? 'appLock.faceIdTitle'
                : biometryType === BIOMETRY_TYPE.FACE
                  ? 'appLock.faceUnlockTitle'
                  : 'appLock.title',
          )}
        </Heading>
        <Text tone="secondary" style={styles.description}>
          {t(
            mode === 'checking'
              ? 'appLock.checking'
              : authenticating
                ? 'appLock.authenticating'
                : 'appLock.description',
          )}
        </Text>
        {error ? (
          <Alert tone="error" message={t(`appLock.errors.${error}`)} />
        ) : null}
        {mode === 'checking' ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <View style={styles.actions}>
            <Button
              title={t(
                authenticating ? 'appLock.authenticating' : 'appLock.retry',
              )}
              loading={authenticating}
              onPress={onRetry}
            />
            <Button
              title={t('appLock.loginFallback')}
              variant="outline"
              onPress={onLogin}
            />
          </View>
        )}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  icon: {
    width: sizes.successMark,
    height: sizes.successMark,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { textAlign: 'center' },
  description: { textAlign: 'center' },
  actions: { width: '100%', gap: spacing.md, marginTop: spacing.md },
});
