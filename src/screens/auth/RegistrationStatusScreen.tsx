import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppBackground from '@/components/background/AppBackground';
import { Button, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { TRootStack } from '@/interface/navigation.type';
import { hp, wp } from '@/utils/responsive.utils';

export default function RegistrationStatusScreen({ route, navigation }: NativeStackScreenProps<TRootStack, 'RegistrationStatusScreen'>) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const approved = route.params.state === 'activation_pending';
  return (
    <AppBackground backgroundColor={colors.surface}>
      <ScrollView contentContainerStyle={styles.content} testID="registration-status">
        <Text accessibilityRole="header" variant="subtitle">{t(approved ? 'driverRegistration.approved' : 'driverRegistration.underReview')}</Text>
        <Text>{t(approved ? 'driverRegistration.activationDescription' : 'driverRegistration.reviewPending')}</Text>
        <Button title={t('driverRegistration.checkStatus')} onPress={() => navigation.replace('LoginScreen', { email: route.params.email, register: true })} />
        <Button title={t('ui.login')} variant="secondary" onPress={() => navigation.replace('LoginScreen', { email: route.params.email, register: false })} />
      </ScrollView>
    </AppBackground>
  );
}
const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: 'center', padding: wp('6%'), gap: hp('3%') } });
