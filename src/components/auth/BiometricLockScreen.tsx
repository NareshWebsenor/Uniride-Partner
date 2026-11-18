import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { BIOMETRY_TYPE } from 'react-native-keychain';
import { Alert, Button, Heading, Text } from '@/components/ui';
import AppBackground from '@/components/background/AppBackground';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { BiometricFailure } from '@/service/biometricAppLock';
import { getBiometricAppLockType } from '@/service/biometricAppLock';
import { hp, wp } from '@/utils/responsive.utils';
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
    <AppBackground backgroundColor={colors.background}>
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
              size={wp('13%')}
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
              size={wp('13%')}
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
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('6%'),
    gap: wp('6%'),
  },
  icon: {
    width: wp('26%'),
    height: wp('26%'),
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { textAlign: 'center' },
  description: { textAlign: 'center' },
  actions: { width: '100%', gap: wp('4%'), marginTop: hp('2%') },
});
