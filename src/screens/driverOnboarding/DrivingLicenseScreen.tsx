import React from 'react';
import OnboardingDocumentForm from '@/components/driverOnboarding/OnboardingDocumentForm';
import type { OnboardingScreenProps } from '@/interface/driverOnboarding.type';

export default function DrivingLicenseScreen({
  navigation,
}: OnboardingScreenProps<'DrivingLicenseScreen'>) {
  return (
    <OnboardingDocumentForm
      kind="license"
      onBack={navigation.goBack}
      onSaved={navigation.goBack}
    />
  );
}
