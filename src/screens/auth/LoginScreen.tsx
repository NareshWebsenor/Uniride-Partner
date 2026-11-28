import React, { useEffect } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppBackground from '@/components/background/AppBackground';
import { Button, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useDriverAuth } from '@/hooks/useDriverAuth';
import type { TRootStack } from '@/interface/navigation.type';
import { hp, wp } from '@/utils/responsive.utils';
import AuthEntry from './LoginRegisterScreen';
import {
  EmailStep,
  MobileStep,
  PasswordStep,
  PhoneOtpStep,
} from './OtpVerificationSteps';

export default function LoginScreen({
  route,
}: NativeStackScreenProps<TRootStack, 'LoginScreen'>) {
  const auth = useDriverAuth(route?.params);
  const colors = useThemeColor();
  const { t } = useAppTranslation();
  const unavailable = () =>
    Alert.alert(
      t('partnerAuth.unavailableTitle'),
      t('partnerAuth.unavailableMessage'),
    );
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      auth.back,
    );
    return () => subscription.remove();
  }, [auth.back]);

  const stepTestId =
    auth.step === 'code'
      ? 'auth-email'
      : auth.step === 'phoneCode'
        ? 'auth-phone-otp'
        : `auth-${auth.step}`;

  return (
    <AppBackground
      backgroundColor={colors.surface}
      extendUnderStatusBar={auth.step === 'entry'}
    >
      {auth.step === 'entry' ? (
        <AuthEntry
          draft={{ email: auth.email }}
          onChange={value => {
            auth.setEmail(value.email);
            auth.setCode('');
          }}
          register={auth.register}
          onModeChange={value => {
            auth.setRegister(value);
            auth.setError('');
          }}
          onRegister={auth.send}
          onLogin={auth.login}
          busy={auth.busy}
          cooldown={Math.max(auth.cooldown, auth.register ? auth.resend : 0)}
          error={auth.error}
          onUnavailable={unavailable}
        />
      ) : (
        <View style={styles.container}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior="padding"
            automaticOffset
          >
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              testID={stepTestId}
            >
              {auth.step === 'code' && (
                <EmailStep
                  email={auth.email}
                  code={auth.code}
                  onChange={auth.setCode}
                  onResend={auth.send}
                  remaining={Math.max(auth.resend, auth.cooldown)}
                  disabled={auth.busy}
                />
              )}
              {auth.step === 'mobile' && (
                <MobileStep
                  phone={auth.phone}
                  country={auth.country}
                  onPhone={auth.setPhone}
                  onCountry={auth.setCountry}
                  disabled={auth.busy}
                />
              )}
              {auth.step === 'phoneCode' && (
                <PhoneOtpStep
                  phone={auth.formattedPhone}
                  code={auth.phoneCode}
                  onChange={auth.setPhoneCode}
                  onResend={auth.sendPhoneOtp}
                  remaining={Math.max(auth.phoneResend, auth.cooldown)}
                  disabled={auth.busy}
                />
              )}
              {auth.step === 'password' && (
                <>
                  {auth.passwordSaved && (
                    <Text tone="success">
                      {t('driverRegistration.passwordSaved')}
                    </Text>
                  )}
                  <PasswordStep
                    password={auth.password}
                    confirm={auth.confirm}
                    onPassword={auth.setPassword}
                    onConfirm={auth.setConfirm}
                    disabled={auth.busy}
                  />
                </>
              )}
              {auth.error ? (
                <Text tone="error" accessibilityRole="alert">
                  {auth.error}
                </Text>
              ) : null}
              {auth.cooldown > 0 ? (
                <Text>
                  {t('partnerAuth.resendIn', { count: auth.cooldown })}
                </Text>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
          <View style={styles.footer}>
            <Button
              title={t('ui.back')}
              onPress={auth.back}
              variant="secondary"
              disabled={auth.busy}
              style={styles.flex}
            />
            <Button
              testID="step-continue"
              title={t('ride.auth.continue')}
              onPress={auth.next}
              loading={auth.busy}
              disabled={auth.busy || auth.cooldown > 0 || !auth.valid}
              style={styles.flex}
            />
          </View>
        </View>
      )}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  content: { padding: wp('6%'), gap: hp('2%') },
  footer: { flexDirection: 'row', gap: wp('4%'), padding: wp('6%') },
});
