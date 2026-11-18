import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import UploadField from './UploadField';
import OnboardingDateField from './OnboardingDateField';
import { TextInput } from '@/components/ui/TextInput';
import { Text } from '@/components/ui/Text';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { OnboardingDocumentFormProps } from '@/interface/driverOnboarding.type';
import { useDriverOnboardingStore } from '@/store/driverOnboardingStore';
import { isCurrentDate, uploadValid } from '@/utils/driverOnboarding';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';

export default function OnboardingDocumentForm({
  kind,
  onBack,
  onSaved,
}: OnboardingDocumentFormProps) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const draft = useDriverOnboardingStore(state => state.documents[kind]);
  const update = useDriverOnboardingStore(state => state.updateDocument);
  const commit = useDriverOnboardingStore(state => state.commitDocument);
  const [attempted, setAttempted] = useState(false);
  const required = t('driverOnboarding.errors.required');
  const instructions =
    kind === 'photo'
      ? [
          t('driverOnboarding.documents.photo.faceInstruction'),
          t('driverOnboarding.documents.photo.lightingInstruction'),
          t('driverOnboarding.documents.photo.accessoriesInstruction'),
        ]
      : [
          t('driverOnboarding.cornersInstruction'),
          t(
            kind === 'insurance'
              ? 'driverOnboarding.documents.insurance.validityInstruction'
              : 'driverOnboarding.originalInstruction',
          ),
        ];
  return (
    <OnboardingLayout
      testID={`document-${kind}-screen`}
      title={t(`driverOnboarding.documents.${kind}.title`)}
      description={t(`driverOnboarding.documents.${kind}.description`)}
      onBack={onBack}
      continueLabel={t('driverOnboarding.submit')}
      onContinue={() => {
        setAttempted(true);
        if (commit(kind)) onSaved();
      }}
    >
      <UploadField
        testID={`${kind}-front`}
        label={t(`driverOnboarding.documents.${kind}.front`)}
        actionLabel={t(
          kind === 'photo'
            ? 'driverOnboarding.photoAction'
            : kind === 'pollution'
            ? 'driverOnboarding.pollutionAction'
            : kind === 'insurance'
            ? 'driverOnboarding.insuranceAction'
            : 'driverOnboarding.frontAction',
        )}
        value={draft.front}
        onChange={front => update(kind, { front })}
        imagesOnly={kind === 'photo'}
        large={kind === 'photo'}
        error={
          attempted && !uploadValid(draft.front, kind === 'photo')
            ? required
            : undefined
        }
      />
      {kind === 'license' || kind === 'government' || kind === 'rc' ? (
        <UploadField
          testID={`${kind}-back`}
          label={t(`driverOnboarding.documents.${kind}.back`)}
          actionLabel={t('driverOnboarding.backAction')}
          value={draft.back}
          onChange={back => update(kind, { back })}
          error={attempted && !uploadValid(draft.back) ? required : undefined}
        />
      ) : null}
      {kind !== 'photo' ? (
        <TextInput
          testID={`${kind}-number`}
          label={t(`driverOnboarding.documents.${kind}.number`)}
          value={draft.number}
          onChangeText={number => update(kind, { number })}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={80}
          error={attempted && !draft.number.trim() ? required : undefined}
          right={
            <Ionicons
              name="information-circle-outline"
              size={wp('4%')}
              color={colors.textSecondary}
            />
          }
        />
      ) : null}
      {kind === 'insurance' ? (
        <TextInput
          testID="insurance-provider"
          label={t('driverOnboarding.documents.insurance.provider')}
          placeholder={t(
            'driverOnboarding.documents.insurance.providerPlaceholder',
          )}
          value={draft.provider}
          onChangeText={provider => update(kind, { provider })}
          autoCapitalize="words"
          maxLength={100}
          error={attempted && !draft.provider.trim() ? required : undefined}
        />
      ) : null}
      {kind === 'pollution' || kind === 'insurance' ? (
        <OnboardingDateField
          testID={`${kind}-valid-until`}
          label={t('driverOnboarding.validUntil')}
          value={draft.validUntil}
          onChange={validUntil => update(kind, { validUntil })}
          error={
            attempted && !isCurrentDate(draft.validUntil)
              ? t(
                  draft.validUntil
                    ? 'driverOnboarding.errors.expired'
                    : 'driverOnboarding.errors.required',
                )
              : undefined
          }
        />
      ) : null}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>
          {t('driverOnboarding.beforeUpload')}
        </Text>
        {instructions.map(instruction => (
          <View key={instruction} style={styles.instructionRow}>
            <Ionicons
              name="checkmark-outline"
              size={wp('4%')}
              color={colors.textSecondary}
            />
            <Text tone="secondary" style={styles.instruction}>
              {instruction}
            </Text>
          </View>
        ))}
      </View>
    </OnboardingLayout>
  );
}
const styles = StyleSheet.create({
  instructions: { gap: hp('1%') },
  instructionTitle: { fontSize: fSize(1.5), fontWeight: '600' },
  instructionRow: { flexDirection: 'row', gap: wp('2%') },
  instruction: { flex: 1, fontSize: fSize(1.4), lineHeight: fSize(2.1) },
});
