import React from 'react';
import OnboardingDocumentForm from '@/components/driverOnboarding/OnboardingDocumentForm';
import type { OnboardingScreenProps } from '@/interface/driverOnboarding.type';

export default function VehicleInsuranceScreen({
  navigation,
}: OnboardingScreenProps<'VehicleInsuranceScreen'>) {
  return (
    <OnboardingDocumentForm
      kind="insurance"
      onBack={navigation.goBack}
      onSaved={navigation.goBack}
    />
  );
}
