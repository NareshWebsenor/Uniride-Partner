import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BottomSheet, Button, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useRegistrationUpload } from '@/hooks/useRegistrationUpload';
import type { FileAnswer } from '@/interface/driverRegistration.type';
import { hp } from '@/utils/responsive.utils';
import OnboardingDateField from './OnboardingDateField';

export type RegistrationFileFieldProps = {
  label: string; value?: FileAnswer; token: string;
  onChange: (value: FileAnswer | undefined) => void;
  expiry?: boolean; required?: boolean; error?: string;
  onApiError: (error: unknown) => void;
  onBusyChange?: (busy: boolean) => void; disabled?: boolean;
};

export default function RegistrationFileField({ label, value, token, onChange, expiry, required, error, onApiError, onBusyChange, disabled }: RegistrationFileFieldProps) {
  const { t } = useAppTranslation();
  const [open, setOpen] = useState(false);
  const upload = useRegistrationUpload({ token, onApiError, onBusyChange,
    onUploaded: name => onChange({ name, ...(value?.expires_on ? { expires_on: value.expires_on } : {}) }),
  });
  const choose = (source: 'camera' | 'gallery' | 'document') => {
    setOpen(false);
    void upload.choose(source);
  };
  return (
    <View style={styles.field}>
      <Text>{required ? t('driverRegistration.fields.requiredLabel', { label }) : label}</Text>
      {value && <Text variant="caption">{t('driverRegistration.uploads.uploaded', { name: value.name })}</Text>}
      <Button title={t(upload.busy ? 'driverRegistration.uploads.uploading' : value ? 'driverRegistration.uploads.replace' : 'driverRegistration.uploads.choose')}
        variant="outline" disabled={disabled || upload.busy} loading={upload.busy}
        onPress={() => Platform.OS === 'android' ? setOpen(true) : void upload.choose('document')} />
      <Text variant="caption" tone="secondary">{t('driverRegistration.uploads.limit')}</Text>
      {value && <>
        <Text variant="caption" tone="secondary">{t('driverRegistration.uploads.replaceHint')}</Text>
        <Button title={t('driverRegistration.uploads.remove')} variant="secondary" disabled={disabled || upload.busy} onPress={() => onChange(undefined)} />
      </>}
      {(expiry || value?.expires_on) && value && <OnboardingDateField label={t('driverRegistration.uploads.expiry')}
        value={value.expires_on ?? ''} testID="registration-file-expiry" disabled={disabled || upload.busy}
        onChange={expires_on => onChange({ ...value, expires_on })} />}
      {(upload.error || error) && <Text variant="caption" tone="error" accessibilityLiveRegion="polite">{upload.error || error}</Text>}
      {upload.canRetry && <Button title={t('driverRegistration.uploads.retry')} disabled={disabled || upload.busy} onPress={() => void upload.retry()} />}
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={t('driverRegistration.uploads.title')}>
        {Platform.OS === 'android' && <>
          <Button title={t('driverRegistration.uploads.camera')} onPress={() => choose('camera')} />
          <Button title={t('driverRegistration.uploads.gallery')} onPress={() => choose('gallery')} />
        </>}
        <Button title={t('driverRegistration.uploads.document')} onPress={() => choose('document')} />
      </BottomSheet>
    </View>
  );
}
const styles = StyleSheet.create({ field: { gap: hp('1%') } });
