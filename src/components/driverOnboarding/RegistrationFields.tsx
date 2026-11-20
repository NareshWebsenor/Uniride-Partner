import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Checkbox, Dropdown, Text, TextInput } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { AddressAnswer, Answer, Answers, RegistrationField } from '@/interface/driverRegistration.type';
import { isAddressAnswer, isFileAnswer } from '@/utils/registrationValidation';
import { hp } from '@/utils/responsive.utils';
import OnboardingDateField from './OnboardingDateField';
import RegistrationFileField from './RegistrationFileField';
import { isLocalOnlyPhoneField } from '@/utils/registrationContact';

export type RegistrationFieldsProps = {
  fields: RegistrationField[]; answers: Answers; email: string; token: string;
  onChange: (key: string, value: Answer | undefined) => void;
  errors: Record<string, string>; onApiError: (error: unknown) => void;
  onBusyChange?: (busy: boolean) => void; disabled?: boolean;
};

export default function RegistrationFields({ fields, answers, email, token, onChange, errors, onApiError, onBusyChange, disabled }: RegistrationFieldsProps) {
  const { t } = useAppTranslation();
  return <View style={styles.fields}>{fields.filter(field => field.enabled).map(field => {
    const label = isLocalOnlyPhoneField(field) ? t('driverRegistration.optionalField', { label: field.label })
      : field.required ? t('driverRegistration.fields.requiredLabel', { label: field.label }) : field.label;
    const value = field.key === 'email' ? email : answers[field.key];
    const stringValue = typeof value === 'string' ? value : '';
    const change = (answer: Answer | undefined) => onChange(field.key, answer);
    const error = errors[field.key];
    if (field.key === 'email') return <TextInput key={field.key} label={label} value={email}
      editable={false} error={error} hint={t('driverRegistration.fields.verifiedEmail')} />;
    switch (field.type) {
      case 'file': return <RegistrationFileField key={field.key} label={field.label} value={isFileAnswer(value) ? value : undefined}
        token={token} onChange={change} expiry={field.expiry} required={field.required} error={error}
        onApiError={onApiError} onBusyChange={onBusyChange} disabled={disabled} />;
      case 'checkbox': return <View key={field.key}>
        <Checkbox label={label} value={value === true} onValueChange={change} disabled={disabled} />
        {error && <Text tone="error" variant="caption">{error}</Text>}
      </View>;
      case 'select': return <Dropdown key={field.key} label={label} value={stringValue} error={error}
        options={field.options.map(option => ({ label: option, value: option }))} onValueChange={change} disabled={disabled} />;
      case 'date': return <OnboardingDateField key={field.key} label={label} value={stringValue} onChange={change}
        allowPast={!/expiry|expires_on/i.test(field.key)} testID={`registration-${field.key}`} error={error} disabled={disabled} />;
      case 'address': {
        const address: AddressAnswer = isAddressAnswer(value) ? value : { line1: '', city: '', country: '' };
        return <View key={field.key} style={styles.address}>
          <Text accessibilityRole="header">{label}</Text>
          {(['line1', 'line2', 'city', 'region', 'postcode', 'country'] as const).map(key => <TextInput key={key}
            label={t(`driverRegistration.fields.${key}`)} value={address[key] ?? ''} editable={!disabled}
            autoCapitalize={key === 'country' ? 'characters' : 'words'} maxLength={key === 'country' ? 2 : undefined}
            onChangeText={text => {
              const next = { ...address, [key]: key === 'country' ? text.toUpperCase().replace(/[^A-Z]/g, '') : text };
              change(Object.values(next).some(part => part.trim()) ? next : undefined);
            }} />)}
          {error && <Text tone="error" variant="caption">{error}</Text>}
        </View>;
      }
      case 'text': case 'email': case 'tel': case 'number': return <TextInput key={field.key}
        testID={`registration-${field.key}`} label={label} value={stringValue} onChangeText={change} error={error}
        editable={!disabled} autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
        autoCorrect={field.type === 'text'} keyboardType={field.type === 'email' ? 'email-address' : field.type === 'tel' ? 'phone-pad' : field.type === 'number' ? 'numbers-and-punctuation' : 'default'}
        hint={isLocalOnlyPhoneField(field) ? t('driverRegistration.mobileOptional') : undefined} />;
      default: return <Text key={field.key} tone="error">{t('driverRegistration.fields.unsupported')}</Text>;
    }
  })}</View>;
}
const styles = StyleSheet.create({ fields: { gap: hp('2%') }, address: { gap: hp('1%') } });
