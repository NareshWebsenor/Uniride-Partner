import React, { useState } from 'react';
import OnboardingLayout from '@/components/driverOnboarding/OnboardingLayout';
import OnboardingProgress from '@/components/driverOnboarding/OnboardingProgress';
import { TextInput } from '@/components/ui/TextInput';
import { Heading } from '@/components/ui/Text';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useOnboardingCompletion } from '@/hooks/useOnboardingCompletion';
import type { OnboardingScreenProps } from '@/interface/driverOnboarding.type';
import { useDriverOnboardingStore } from '@/store/driverOnboardingStore';
import { bankValid } from '@/utils/driverOnboarding';

export default function BankDetailsScreen({
  navigation,
}: OnboardingScreenProps<'BankDetailsScreen'>) {
  const { t } = useAppTranslation();
  const bank = useDriverOnboardingStore(state => state.bank);
  const firstName = useDriverOnboardingStore(state => state.firstName);
  const update = useDriverOnboardingStore(state => state.updateBank);
  const [attempted, setAttempted] = useState(false);
  const finish = useOnboardingCompletion(() =>
    navigation.reset({ index: 0, routes: [{ name: 'MainStack' }] }),
  );
  return (
    <OnboardingLayout
      testID="bank-details-screen"
      title={
        firstName
          ? t('driverOnboarding.welcome', { name: firstName })
          : t('driverOnboarding.welcomeFallback')
      }
      description={t('driverOnboarding.ownDescription')}
      onBack={navigation.goBack}
      onContinue={() => {
        setAttempted(true);
        if (bankValid(bank)) finish();
      }}
    >
      <OnboardingProgress stage={3} />
      <Heading level={3}>{t('driverOnboarding.bank.title')}</Heading>
      {(
        [
          'bankName',
          'holderName',
          'accountNumber',
          'confirmAccountNumber',
          'iban',
        ] as const
      ).map(field => (
        <TextInput
          key={field}
          testID={`bank-${field}`}
          label={t(`driverOnboarding.bank.${field}`)}
          placeholder={t(`driverOnboarding.bank.${field}Placeholder`)}
          value={bank[field]}
          onChangeText={value => update({ [field]: value })}
          autoCapitalize={
            field === 'bankName' || field === 'holderName'
              ? 'words'
              : 'characters'
          }
          autoCorrect={false}
          maxLength={field === 'bankName' || field === 'holderName' ? 100 : 50}
          error={
            attempted && !bank[field].trim()
              ? t('driverOnboarding.errors.required')
              : attempted &&
                field === 'confirmAccountNumber' &&
                bank.confirmAccountNumber.trim() !== bank.accountNumber.trim()
              ? t('driverOnboarding.errors.accountMismatch')
              : undefined
          }
        />
      ))}
    </OnboardingLayout>
  );
}
