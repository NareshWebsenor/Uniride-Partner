import React from 'react';
import OnboardingDocumentForm from '@/components/driverOnboarding/OnboardingDocumentForm';
import type { OnboardingScreenProps } from '@/interface/driverOnboarding.type';

export default function GovernmentIdScreen({
  navigation,
}: OnboardingScreenProps<'GovernmentIdScreen'>) {
  return (
    <OnboardingDocumentForm
      kind="government"
      onBack={navigation.goBack}
      onSaved={navigation.goBack}
    />
  );
}
