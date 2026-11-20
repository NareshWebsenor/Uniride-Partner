import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { Button, RadioButton, Text } from '@/components/ui';
import OnboardingLayout from '@/components/driverOnboarding/OnboardingLayout';
import RegistrationFields from '@/components/driverOnboarding/RegistrationFields';
import RegistrationVehicle from '@/components/driverOnboarding/RegistrationVehicle';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useRegistrationStore } from '@/store/registrationStore';
import { hp } from '@/utils/responsive.utils';
import type { Answer } from '@/interface/driverRegistration.type';

export default function DriverRegistrationScreen() {
  const flow = useDriverRegistration();
  const { t } = useAppTranslation();
  const setDriveMode = useRegistrationStore(state => state.setDriveMode);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', flow.back);
    return () => sub.remove();
  }, [flow.back]);
  const disabled = flow.busy || flow.uploading || flow.cooldown > 0;
  const title = flow.step === 'form' ? 'driverRegistration.formTitle' : flow.step === 'mode'
    ? 'driverRegistration.modeTitle' : flow.step === 'vehicle' ? 'driverRegistration.vehicleTitle' : 'driverRegistration.reviewTitle';
  const formatAnswer = (value: Answer | undefined) => {
    if (value === undefined || value === '') return t('driverRegistration.notProvided');
    if (typeof value === 'boolean') return t(value ? 'driverRegistration.yes' : 'driverRegistration.no');
    if (typeof value === 'string') return value;
    if ('name' in value) return value.expires_on
      ? t('driverRegistration.uploadedWithExpiry', { date: value.expires_on }) : t('driverRegistration.uploaded');
    return Object.values(value).filter(Boolean).join(', ');
  };
  return (
    <OnboardingLayout title={t(title)} testID="driver-registration-screen"
      onBack={flow.back} onContinue={flow.next}
      continueLabel={t(flow.step === 'review' ? 'driverRegistration.submit' : 'ride.auth.continue')}
      disabled={disabled || !flow.form || !flow.draft}>
      {flow.error ? <Text tone="error" accessibilityRole="alert">{flow.error}</Text> : null}
      {flow.storageError ? <Text tone="error">{t('driverRegistration.draftSaveFailed')}</Text> : null}
      {flow.cooldown > 0 ? <Text>{t('partnerAuth.resendIn', { count: flow.cooldown })}</Text> : null}
      {flow.busy ? <Text accessibilityLiveRegion="polite">{t('driverRegistration.loading')}</Text> : null}
      {!flow.form && !flow.busy && <Button title={t('ui.retry')} onPress={flow.load} disabled={flow.cooldown > 0} />}
      {flow.form && flow.draft && flow.credential ? (
        <View style={styles.content}>
          {flow.form.reason ? <View accessibilityRole="alert"><Text>{t('driverRegistration.corrections')}</Text><Text>{flow.form.reason}</Text></View> : null}
          {flow.step === 'form' && (
            <RegistrationFields fields={flow.form.fields} answers={flow.draft.answers} email={flow.form.email}
              token={flow.credential.token} onChange={flow.updateAnswer} errors={flow.fieldErrors}
              onApiError={flow.onApiError} onBusyChange={flow.onBusyChange} disabled={disabled} />
          )}
          {flow.step === 'mode' && (
            <>
              <RadioButton label={t('driverRegistration.fleet')} value={flow.draft.driveMode === 'fleet_partner'}
                onValueChange={() => setDriveMode('fleet_partner')} disabled={disabled} />
              <Text tone="secondary">{t('driverRegistration.fleetDescription')}</Text>
              <RadioButton label={t('driverRegistration.own')} value={flow.draft.driveMode === 'own_vehicle'}
                onValueChange={() => setDriveMode('own_vehicle')} disabled={disabled} />
              <Text tone="secondary">{t('driverRegistration.ownDescription')}</Text>
            </>
          )}
          {flow.step === 'vehicle' && flow.draft.vehicle && flow.options && (
            <RegistrationVehicle value={flow.draft.vehicle} onChange={flow.updateVehicle} options={flow.options}
              token={flow.credential.token} errors={flow.vehicleErrors} onApiError={flow.onApiError}
              onBusyChange={flow.onBusyChange} disabled={disabled} />
          )}
          {flow.step === 'review' && (
            <>
              <Text>{t('driverRegistration.reviewDescription')}</Text>
              <Text>{flow.form.email}</Text>
              {flow.form.fields.filter(field => field.enabled && field.key !== 'email').map(field => (
                <View key={field.key}><Text>{field.label}</Text><Text tone="secondary">{formatAnswer(flow.draft?.answers[field.key])}</Text></View>
              ))}
              <Text>{t(flow.draft.driveMode === 'fleet_partner' ? 'driverRegistration.fleet' : 'driverRegistration.own')}</Text>
              {flow.draft.driveMode === 'own_vehicle' && flow.draft.vehicle ? (
                <View>
                  <Text>{flow.options?.models.find(model => model.model_id === flow.draft?.vehicle?.model_id)?.name}</Text>
                  <Text>{flow.draft.vehicle.registration_number.toUpperCase()}</Text>
                  <Text>{flow.draft.vehicle.year}</Text><Text>{flow.draft.vehicle.colour}</Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </OnboardingLayout>
  );
}
const styles = StyleSheet.create({ content: { gap: hp('2%') } });
