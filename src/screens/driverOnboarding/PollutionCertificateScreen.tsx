import React from 'react';
import OnboardingDocumentForm from '@/components/driverOnboarding/OnboardingDocumentForm';
import type { OnboardingScreenProps } from '@/interface/driverOnboarding.type';

export default function PollutionCertificateScreen({
  navigation,
}: OnboardingScreenProps<'PollutionCertificateScreen'>) {
  return (
    <OnboardingDocumentForm
      kind="pollution"
      onBack={navigation.goBack}
      onSaved={navigation.goBack}
    />
  );
}
