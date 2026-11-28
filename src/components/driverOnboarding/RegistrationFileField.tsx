import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useRegistrationUpload } from '@/hooks/useRegistrationUpload';
import type { FileAnswer } from '@/interface/driverRegistration.type';
import { hp } from '@/utils/responsive.utils';
import OnboardingDateField from './OnboardingDateField';
import UploadSourceSheet from './UploadSourceSheet';

export type RegistrationFileFieldProps = {
  label: string;
  value?: FileAnswer;
  token: string;
  onChange: (value: FileAnswer | undefined) => void;
  expiry?: boolean;
  required?: boolean;
  error?: string;
  onApiError: (error: unknown) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
};

export default function RegistrationFileField({
  label,
  value,
  token,
  onChange,
  expiry,
  required,
  error,
  onApiError,
  onBusyChange,
  disabled,
}: RegistrationFileFieldProps) {
  const { t } = useAppTranslation();
  const [open, setOpen] = useState(false);
  const upload = useRegistrationUpload({
    token,
    onApiError,
    onBusyChange,
    onUploaded: name =>
      onChange({
        name,
        ...(value?.expires_on ? { expires_on: value.expires_on } : {}),
      }),
  });
  const choose = (source: 'camera' | 'gallery') => {
    setOpen(false);
    void upload.choose(source);
  };
  const remove = () => {
    setOpen(false);
    onChange(undefined);
  };
  return (
    <View style={styles.field}>
      <Text>
        {required
          ? t('driverRegistration.fields.requiredLabel', { label })
          : label}
      </Text>
      {value && (
        <Text variant="caption">
          {t('driverRegistration.uploads.uploaded', { name: value.name })}
        </Text>
      )}
      <Button
        title={t(
          upload.busy
            ? 'driverRegistration.uploads.uploading'
            : value
              ? 'driverRegistration.uploads.replace'
              : 'driverRegistration.uploads.choose',
        )}
        variant="outline"
        disabled={disabled || upload.busy}
        loading={upload.busy}
        onPress={() => setOpen(true)}
      />
      <Text variant="caption" tone="secondary">
        {t('driverRegistration.uploads.limit')}
      </Text>
      {value && (
        <Text variant="caption" tone="secondary">
          {t('driverRegistration.uploads.replaceHint')}
        </Text>
      )}
      {(expiry || value?.expires_on) && value && (
        <OnboardingDateField
          label={t('driverRegistration.uploads.expiry')}
          value={value.expires_on ?? ''}
          testID="registration-file-expiry"
          disabled={disabled || upload.busy}
          onChange={expires_on => onChange({ ...value, expires_on })}
        />
      )}
      {(upload.error || error) && (
        <Text variant="caption" tone="error" accessibilityLiveRegion="polite">
          {upload.error || error}
        </Text>
      )}
      <UploadSourceSheet
        visible={open}
        hasFile={Boolean(value)}
        onClose={() => setOpen(false)}
        onCamera={() => choose('camera')}
        onGallery={() => choose('gallery')}
        onDelete={remove}
      />
    </View>
  );
}

const styles = StyleSheet.create({ field: { gap: hp('1%') } });
