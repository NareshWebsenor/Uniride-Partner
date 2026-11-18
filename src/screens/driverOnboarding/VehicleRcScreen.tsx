import React from 'react';
import OnboardingDocumentForm from '@/components/driverOnboarding/OnboardingDocumentForm';
import type { OnboardingScreenProps } from '@/interface/driverOnboarding.type';

export default function VehicleRcScreen({
  navigation,
}: OnboardingScreenProps<'VehicleRcScreen'>) {
  return (
    <OnboardingDocumentForm
      kind="rc"
      onBack={navigation.goBack}
      onSaved={navigation.goBack}
    />
  );
}
