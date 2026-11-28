import React, { useEffect } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { Button, Checkbox, Text, TextInput } from '@/components/ui';
import OnboardingChoiceCard from '@/components/driverOnboarding/OnboardingChoiceCard';
import OnboardingLayout from '@/components/driverOnboarding/OnboardingLayout';
import RegistrationFields from '@/components/driverOnboarding/RegistrationFields';
import RegistrationVehicle from '@/components/driverOnboarding/RegistrationVehicle';
import VehicleCatalogGrid from '@/components/driverOnboarding/VehicleCatalogGrid';
import { TermsStep } from '@/screens/auth/OtpVerificationSteps';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRegistrationStore } from '@/store/registrationStore';
import type { themeType } from '@/interface/theme.type';
import type { Answer } from '@/interface/driverRegistration.type';
import { isLocalOnlyPhoneField } from '@/utils/registrationContact';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';

export default function DriverRegistrationScreen() {
  const flow = useDriverRegistration();
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const styles = useThemedStyles(createStyle);
  const setDriveMode = useRegistrationStore(state => state.setDriveMode);
  const unavailable = () =>
    Alert.alert(
      t('partnerAuth.unavailableTitle'),
      t('partnerAuth.unavailableMessage'),
    );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', flow.back);
    return () => sub.remove();
  }, [flow.back]);

  const disabled = flow.busy || flow.uploading || flow.cooldown > 0;
  const titleKey =
    flow.step === 'mode'
      ? 'driverOnboarding.driveTitle'
      : flow.step === 'hub'
        ? 'driverRegistration.welcomePartner'
        : flow.step === 'invitation'
          ? 'driverRegistration.invitationTitle'
          : flow.step === 'vehicleType'
            ? 'driverRegistration.selectVehicleType'
            : flow.step === 'vehicleBrand'
              ? 'driverRegistration.selectVehicleBrand'
              : flow.step === 'vehicleModel'
                ? 'driverRegistration.selectVehicleModel'
                : flow.step === 'vehicleFuel'
                  ? 'driverRegistration.selectVehicleFuel'
                  : flow.step === 'vehicleCategory'
                    ? 'driverRegistration.selectVehicleCategory'
                    : flow.step === 'vehicleFields'
                      ? 'driverRegistration.vehicleDocumentsTitle'
                      : flow.step === 'form'
                        ? flow.draft?.driveMode === 'own_vehicle'
                          ? 'driverRegistration.userProfile'
                          : 'driverRegistration.formTitle'
                        : 'driverRegistration.reviewTitle';
  const description =
    flow.step === 'hub'
      ? t('driverRegistration.partnerStepsDescription')
      : undefined;

  const formatAnswer = (value: Answer | undefined) => {
    if (value === undefined || value === '') {
      return t('driverRegistration.notProvided');
    }
    if (typeof value === 'boolean') {
      return t(value ? 'driverRegistration.yes' : 'driverRegistration.no');
    }
    if (typeof value === 'string') return value;
    if ('name' in value) {
      return value.expires_on
        ? t('driverRegistration.uploadedWithExpiry', {
            date: value.expires_on,
          })
        : t('driverRegistration.uploaded');
    }
    return Object.values(value).filter(Boolean).join(', ');
  };

  const vehicle = flow.draft?.vehicle;
  const brands = (flow.options?.brands ?? []).filter(
    brand => brand.type_id === vehicle?.type_id,
  );
  const models = (flow.options?.models ?? []).filter(
    model =>
      model.type_id === vehicle?.type_id &&
      model.brand_id === vehicle?.brand_id,
  );
  const selectedModel = models.find(
    model => model.model_id === vehicle?.model_id,
  );
  const fuelTypes = selectedModel?.fuel_types ?? [];
  const categories = flow.options?.categories ?? [];

  const selectionInvalid =
    (flow.step === 'mode' && !flow.draft?.driveMode) ||
    (flow.step === 'hub' && !(flow.vehicleDone && flow.profileDone)) ||
    (flow.step === 'vehicleType' && !vehicle?.type_id) ||
    (flow.step === 'vehicleBrand' && !vehicle?.brand_id) ||
    (flow.step === 'vehicleModel' && !vehicle?.model_id) ||
    (flow.step === 'vehicleFuel' &&
      fuelTypes.length > 0 &&
      !vehicle?.fuel_type_id) ||
    (flow.step === 'vehicleCategory' &&
      categories.length > 0 &&
      !vehicle?.category_id) ||
    (flow.step === 'review' && !flow.agreed);

  const continueLabel =
    flow.step === 'hub'
      ? t('driverOnboarding.submitApplication')
      : flow.step === 'review'
        ? t('driverRegistration.submit')
        : t('driverOnboarding.continue');

  const checklistRows = [
    {
      key: 'vehicle',
      testID: 'open-vehicle-details',
      title: t('driverRegistration.vehicleDetails'),
      done: flow.vehicleDone,
      onPress: flow.openVehicleStep,
    },
    {
      key: 'profile',
      testID: 'open-user-profile',
      title: t('driverRegistration.userProfile'),
      done: flow.profileDone,
      onPress: flow.openProfileStep,
    },
  ];

  return (
    <OnboardingLayout
      title={t(titleKey)}
      description={description}
      testID="driver-registration-screen"
      onBack={flow.back}
      onContinue={flow.next}
      continueLabel={continueLabel}
      disabled={disabled || !flow.form || !flow.draft || selectionInvalid}
    >
      {flow.error ? (
        <Text tone="error" accessibilityRole="alert">
          {flow.error}
        </Text>
      ) : null}
      {flow.storageError ? (
        <Text tone="error">{t('driverRegistration.draftSaveFailed')}</Text>
      ) : null}
      {flow.cooldown > 0 ? (
        <Text>{t('partnerAuth.resendIn', { count: flow.cooldown })}</Text>
      ) : null}
      {flow.busy ? (
        <Text accessibilityLiveRegion="polite">
          {t('driverRegistration.loading')}
        </Text>
      ) : null}
      {!flow.form && !flow.busy && (
        <Button
          title={t('ui.retry')}
          onPress={flow.load}
          disabled={flow.cooldown > 0}
        />
      )}
      {flow.form && flow.draft && flow.credential ? (
        <View style={styles.content}>
          {flow.form.reason ? (
            <View accessibilityRole="alert">
              <Text>{t('driverRegistration.corrections')}</Text>
              <Text>{flow.form.reason}</Text>
            </View>
          ) : null}
          {flow.step === 'mode' && (
            <>
              <OnboardingChoiceCard
                testID="mode-fleet"
                title={t('driverOnboarding.fleetTitle')}
                description={t('driverOnboarding.fleetDescription')}
                badges={[t('driverOnboarding.fleetPartnerBadge')]}
                image={require('@/assets/images/onboarding/rider.png')}
                selected={flow.draft.driveMode === 'fleet_partner'}
                onPress={() => {
                  if (!disabled) setDriveMode('fleet_partner');
                }}
              />
              <OnboardingChoiceCard
                testID="mode-own"
                title={t('driverOnboarding.ownTitle')}
                description={t('driverOnboarding.ownDriveDescription')}
                badges={[t('driverOnboarding.ownBadge')]}
                image={require('@/assets/images/onboarding/driver.png')}
                selected={flow.draft.driveMode === 'own_vehicle'}
                onPress={() => {
                  if (!disabled) setDriveMode('own_vehicle');
                }}
              />
            </>
          )}
          {flow.step === 'hub' && (
            <View testID="own-vehicle-hub">
              {checklistRows.map(row => (
                <Pressable
                  key={row.key}
                  testID={row.testID}
                  accessibilityRole="button"
                  accessibilityLabel={
                    row.done
                      ? `${row.title}. ${t('driverOnboarding.completed')}`
                      : row.title
                  }
                  onPress={row.onPress}
                  style={styles.row}
                >
                  <View style={styles.copy}>
                    <Text style={styles.label}>{row.title}</Text>
                    {row.done ? (
                      <Text tone="success" style={styles.status}>
                        {t('driverOnboarding.completed')}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={wp('4%')}
                    color={colors.textSecondary}
                  />
                </Pressable>
              ))}
            </View>
          )}
          {flow.step === 'invitation' && (
            <>
              <Text tone="secondary">
                {t('driverRegistration.invitationDescription')}
              </Text>
              <TextInput
                testID="invitation-code"
                label={t('driverRegistration.invitationLabel')}
                value={flow.invitationCode}
                onChangeText={value =>
                  flow.setInvitationCode(value.replace(/\D/g, '').slice(0, 6))
                }
                keyboardType="number-pad"
                maxLength={6}
                editable={!disabled}
              />
            </>
          )}
          {flow.step === 'vehicleType' && vehicle && flow.options && (
            <VehicleCatalogGrid
              testIDPrefix="vehicle-type"
              items={flow.options.types.map(item => ({
                id: item.type_id,
                name: item.name,
                imageUrl: item.image_url,
              }))}
              selectedId={vehicle.type_id}
              disabled={disabled}
              fallbackIcon="car-sport-outline"
              onSelect={type_id => {
                if (type_id !== vehicle.type_id) {
                  flow.updateVehicle({
                    ...vehicle,
                    type_id,
                    brand_id: '',
                    model_id: '',
                    fuel_type_id: '',
                  });
                }
              }}
            />
          )}
          {flow.step === 'vehicleBrand' && vehicle && flow.options && (
            <VehicleCatalogGrid
              testIDPrefix="vehicle-brand"
              items={brands.map(item => ({
                id: item.brand_id,
                name: item.name,
                imageUrl: item.image_url,
              }))}
              selectedId={vehicle.brand_id}
              disabled={disabled}
              fallbackIcon="ribbon-outline"
              onSelect={brand_id => {
                if (brand_id !== vehicle.brand_id) {
                  flow.updateVehicle({
                    ...vehicle,
                    brand_id,
                    model_id: '',
                    fuel_type_id: '',
                  });
                }
              }}
            />
          )}
          {flow.step === 'vehicleModel' && vehicle && flow.options && (
            <VehicleCatalogGrid
              testIDPrefix="vehicle-model"
              items={models.map(item => ({
                id: item.model_id,
                name: item.name,
                imageUrl: item.image_url,
              }))}
              selectedId={vehicle.model_id}
              disabled={disabled}
              fallbackIcon="car-outline"
              onSelect={model_id => {
                if (model_id !== vehicle.model_id) {
                  flow.updateVehicle({
                    ...vehicle,
                    model_id,
                    fuel_type_id: '',
                  });
                }
              }}
            />
          )}
          {flow.step === 'vehicleFuel' && vehicle && flow.options && (
            <VehicleCatalogGrid
              testIDPrefix="vehicle-fuel"
              items={fuelTypes.map(item => ({
                id: item.fuel_type_id,
                name: item.name,
                imageUrl: item.image_url,
              }))}
              selectedId={vehicle.fuel_type_id}
              disabled={disabled}
              fallbackIcon="flash-outline"
              onSelect={fuel_type_id =>
                flow.updateVehicle({ ...vehicle, fuel_type_id })
              }
            />
          )}
          {flow.step === 'vehicleCategory' && vehicle && flow.options && (
            <VehicleCatalogGrid
              testIDPrefix="vehicle-category"
              items={categories.map(item => ({
                id: item.category_id,
                name: item.name,
                imageUrl: item.image_url,
              }))}
              selectedId={vehicle.category_id}
              disabled={disabled}
              fallbackIcon="apps-outline"
              onSelect={category_id =>
                flow.updateVehicle({ ...vehicle, category_id })
              }
            />
          )}
          {flow.step === 'vehicleFields' && vehicle && flow.options && (
            <RegistrationVehicle
              value={vehicle}
              onChange={flow.updateVehicle}
              options={flow.options}
              token={flow.credential.token}
              errors={flow.vehicleErrors}
              answers={flow.draft.answers}
              onAnswerChange={flow.updateAnswer}
              fieldErrors={flow.fieldErrors}
              showCatalogDropdowns={false}
              onApiError={flow.onApiError}
              onBusyChange={flow.onBusyChange}
              disabled={disabled}
            />
          )}
          {flow.step === 'form' && (
            <RegistrationFields
              fields={flow.form.fields}
              answers={flow.draft.answers}
              email={flow.form.email}
              token={flow.credential.token}
              onChange={flow.updateAnswer}
              errors={flow.fieldErrors}
              onApiError={flow.onApiError}
              onBusyChange={flow.onBusyChange}
              disabled={disabled}
            />
          )}
          {flow.step === 'review' && (
            <>
              <Text>{t('driverRegistration.reviewDescription')}</Text>
              <Text>{flow.form.email}</Text>
              {flow.form.fields
                .filter(
                  field =>
                    field.enabled &&
                    field.key !== 'email' &&
                    field.key !== 'accept_terms' &&
                    !isLocalOnlyPhoneField(field),
                )
                .map(field => (
                  <View key={field.key}>
                    <Text>{field.label}</Text>
                    <Text tone="secondary">
                      {formatAnswer(flow.draft?.answers[field.key])}
                    </Text>
                  </View>
                ))}
              <Text>
                {t(
                  flow.draft.driveMode === 'fleet_partner'
                    ? 'driverRegistration.fleet'
                    : 'driverRegistration.own',
                )}
              </Text>
              {flow.draft.driveMode === 'own_vehicle' && vehicle ? (
                <View>
                  <Text>
                    {
                      flow.options?.models.find(
                        model => model.model_id === vehicle.model_id,
                      )?.name
                    }
                  </Text>
                  <Text>{vehicle.registration_number.toUpperCase()}</Text>
                  <Text>{vehicle.year}</Text>
                  <Text>{vehicle.colour}</Text>
                </View>
              ) : null}
              <TermsStep onUnavailable={unavailable} />
              <Checkbox
                value={flow.agreed}
                onValueChange={flow.setAgreed}
                disabled={disabled}
                label={t('partnerAuth.agree')}
              />
            </>
          )}
        </View>
      ) : null}
    </OnboardingLayout>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    content: { gap: hp('2.4%') },
    row: {
      minHeight: Math.max(48, hp('8%')),
      paddingVertical: hp('2%'),
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      gap: wp('2%'),
    },
    copy: { flex: 1, gap: hp('0.5%') },
    label: { fontSize: fSize(1.8) },
    status: { fontSize: fSize(1.35) },
  });
