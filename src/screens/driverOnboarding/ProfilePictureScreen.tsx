import React from 'react';
import OnboardingDocumentForm from '@/components/driverOnboarding/OnboardingDocumentForm';
import type { OnboardingScreenProps } from '@/interface/driverOnboarding.type';

export default function ProfilePictureScreen({
  navigation,
}: OnboardingScreenProps<'ProfilePictureScreen'>) {
  return (
    <OnboardingDocumentForm
      kind="photo"
      onBack={navigation.goBack}
      onSaved={navigation.goBack}
    />
  );
}
