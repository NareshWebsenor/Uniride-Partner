import React, { useState } from 'react';
import OnboardingLayout from '@/components/driverOnboarding/OnboardingLayout';
import { TextInput } from '@/components/ui/TextInput';
import { Text } from '@/components/ui/Text';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { OnboardingScreenProps } from '@/interface/driverOnboarding.type';
import { useDriverOnboardingStore } from '@/store/driverOnboardingStore';
import { manufactureYearValid } from '@/utils/driverOnboarding';

export default function VehicleModelScreen({
  navigation,
}: OnboardingScreenProps<'VehicleModelScreen'>) {
  const { t } = useAppTranslation();
  const vehicle = useDriverOnboardingStore(state => state.vehicle);
  const update = useDriverOnboardingStore(state => state.updateVehicle);
  const commit = useDriverOnboardingStore(state => state.commitVehicle);
  const [attempted, setAttempted] = useState(false);
  return (
    <OnboardingLayout
      testID="vehicle-model-screen"
      title={t('driverOnboarding.vehicleModel.title')}
      description={t('driverOnboarding.vehicleModel.description')}
      onBack={navigation.goBack}
      continueLabel={t('driverOnboarding.submit')}
      onContinue={() => {
        setAttempted(true);
        if (commit()) navigation.goBack();
      }}
    >
      {(['make', 'model', 'variant', 'year'] as const).map(field => (
        <TextInput
          key={field}
          testID={`vehicle-${field}`}
          label={t(`driverOnboarding.vehicleModel.${field}`)}
          placeholder={t(`driverOnboarding.vehicleModel.${field}Placeholder`)}
          value={vehicle[field]}
          onChangeText={value => update({ [field]: value })}
          maxLength={field === 'year' ? 4 : 80}
          keyboardType={field === 'year' ? 'number-pad' : 'default'}
          error={
            attempted && !vehicle[field].trim()
              ? t('driverOnboarding.errors.required')
              : attempted &&
                field === 'year' &&
                !manufactureYearValid(vehicle.year)
              ? t('driverOnboarding.errors.invalidYear')
              : undefined
          }
        />
      ))}
      <Text tone="secondary" variant="caption">
        {t('driverOnboarding.vehicleModel.note')}
      </Text>
    </OnboardingLayout>
  );
}
