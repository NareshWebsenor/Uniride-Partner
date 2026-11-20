import React, { useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Trans } from 'react-i18next';
import { BottomSheet, RadioButton, Text } from '@/components/ui';
import Button from '@/components/buttons/CustomButton';
import CustomTextInput from '@/components/inputs/TextInput/CustomTextInput';
import StackHeader from '@/components/headers/StackHeader';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@/utils/fontIcon.utils';
import { maskEmail } from '@/utils/authPreview';
import { fSize, hp, wp } from '@/utils/responsive.utils';
import { PasswordChecklist } from './AuthFields';
import type { themeType } from '@/interface/theme.type';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export function EmailStep({
  email,
  code,
  onChange,
  onResend,
  remaining,
  disabled = false,
}: {
  email: string;
  code: string;
  onChange: (value: string) => void;
  onResend: () => void;
  remaining: number;
  disabled?: boolean;
}) {
  const { t } = useAppTranslation();
  const styles = useThemedStyles(createStyle);
  return (
    <View style={styles.fields}>
      <StackHeader
        showBackIcon={false}
        showDivider={false}
        style={styles.plainHeader}
        titleStyle={styles.title}
        title={t('partnerAuth.otpTitle', { email: maskEmail(email.trim()) })}
      />
      <CustomTextInput
        testID="email-otp"
        value={code}
        onChangeText={onChange}
        otpLength={6}
        isEditable={!disabled}
        accessibilityLabel={t('partnerAuth.otpLabel')}
      />
      <Text tone="secondary" variant="caption">
        {t('partnerAuth.inbox')}
      </Text>
      <Button
        isGradiantRequired={false}
        testID="resend"
        title={
          remaining
            ? t('partnerAuth.resendIn', { count: remaining })
            : t('partnerAuth.resend')
        }
        onPress={onResend}
        disabled={remaining > 0 || disabled}
        variant="secondary"
        style={styles.resend}
      />
    </View>
  );
}

export const countries = [
  { code: 'IN', dial: '+91', flag: '🇮🇳', key: 'india' },
  { code: 'BS', dial: '+1', flag: '🇧🇸', key: 'bahamas' },
  { code: 'US', dial: '+1', flag: '🇺🇸', key: 'usa' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', key: 'uk' },
] as const;
export type Country = (typeof countries)[number];

export function MobileStep({
  phone,
  country,
  onPhone,
  onCountry,
  disabled = false,
}: {
  phone: string;
  country: Country;
  onPhone: (value: string) => void;
  onCountry: (value: Country) => void;
  disabled?: boolean;
}) {
  const { t } = useAppTranslation();
  const styles = useThemedStyles(createStyle);
  const colors = useThemeColor();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fields}>
      <StackHeader
        showBackIcon={false}
        showDivider={false}
        style={styles.plainHeader}
        titleStyle={styles.title}
        title={t('ride.auth.phoneInputLabel')}
      />
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          accessibilityState={{ disabled }}
          accessibilityLabel={t('ui.selectCountry')}
          accessibilityValue={{
            text: t(`partnerAuth.countries.${country.key}`),
          }}
          onPress={() => setOpen(true)}
          style={styles.countryButton}
        >
          <Text>{country.flag}</Text>
          <Ionicons
            name="chevron-down"
            size={wp('6%') / 2}
            color={colors.textPrimary}
          />
        </Pressable>
        <CustomTextInput
          testID="mobile-number"
          isEditable={!disabled}
          style={styles.flex}
          containerStyle={styles.input}
          accessibilityLabel={t('ride.auth.phoneInputLabel')}
          placeholder={t('auth.mobile_number')}
          keyboardType="phone-pad"
          autoComplete="tel-national"
          value={phone}
          maxLength={25}
          onChangeText={value => onPhone(value.replace(/\D/g, ''))}
          left={<Text>{country.dial}</Text>}
        />
      </View>
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={t('ui.selectCountry')}
      >
        {countries.map(item => (
          <RadioButton
            key={item.code}
            value={item.code === country.code}
            label={t('partnerAuth.countryOption', {
              flag: item.flag,
              country: t(`partnerAuth.countries.${item.key}`),
              dial: item.dial,
            })}
            onValueChange={() => {
              onCountry(item);
              setOpen(false);
            }}
          />
        ))}
      </BottomSheet>
    </View>
  );
}

export function PasswordStep({
  password,
  confirm,
  onPassword,
  onConfirm,
  disabled = false,
}: {
  password: string;
  confirm: string;
  onPassword: (value: string) => void;
  onConfirm: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useAppTranslation();
  const styles = useThemedStyles(createStyle);
  return (
    <View style={styles.fields}>
      <StackHeader
        showBackIcon={false}
        showDivider={false}
        style={styles.plainHeader}
        titleStyle={styles.title}
        title={t('partnerAuth.passwordTitle')}
      />
      <Text style={styles.body}>{t('partnerAuth.passwordDescription')}</Text>
      <CustomTextInput
        isEditable={!disabled}
        secureTextEntry
        placeholder={t('partnerAuth.passwordPlaceholder')}
        containerStyle={styles.input}
        testID="create-password"
        label={t('partnerAuth.password')}
        value={password}
        onChangeText={onPassword}
      />
      <CustomTextInput
        isEditable={!disabled}
        secureTextEntry
        placeholder={t('partnerAuth.passwordPlaceholder')}
        containerStyle={styles.input}
        testID="confirm-password"
        label={t('partnerAuth.confirmPassword')}
        value={confirm}
        onChangeText={onConfirm}
        errorMsg={
          confirm && password !== confirm
            ? t('partnerAuth.passwordMismatch')
            : undefined
        }
      />
      {!disabled && <PasswordChecklist value={password} />}
    </View>
  );
}

export function TermsStep({ onUnavailable }: { onUnavailable: () => void }) {
  const { t } = useAppTranslation();
  const styles = useThemedStyles(createStyle);
  return (
    <View style={styles.fields}>
      <StackHeader
        showBackIcon={false}
        showDivider={false}
        style={styles.plainHeader}
        titleStyle={styles.title}
        title={t('partnerAuth.termsTitle')}
      />
      <Text style={styles.body}>
        <Trans
          i18nKey="partnerAuth.termsDescription"
          components={{
            terms: (
              <Text
                accessibilityRole="link"
                onPress={onUnavailable}
                style={styles.link}
              />
            ),
            privacy: (
              <Text
                accessibilityRole="link"
                onPress={onUnavailable}
                style={styles.link}
              />
            ),
          }}
        />
      </Text>
    </View>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    flex: { flex: 1 },
    row: { flexDirection: 'row', gap: wp('4%'), alignItems: 'center' },
    fields: { gap: wp('4%') },
    plainHeader: { paddingHorizontal: 0, paddingVertical: 0 },
    title: { fontSize: fSize(3), fontWeight: '700' },
    body: { lineHeight: fSize(2) * 1.5 },
    link: { textDecorationLine: 'underline', color: theme.brandLink },
    input: { minHeight: Math.max(48, hp('7%')) },
    resend: { alignSelf: 'flex-start', borderRadius: 999 },
    countryButton: {
      borderColor: theme.border,
      flexDirection: 'row',
      gap: wp('2%'),
      alignItems: 'center',
      minHeight: Math.max(48, hp('7%')),
      paddingHorizontal: wp('4%'),
      borderWidth: 1,
      borderRadius: wp('3%'),
    },
  });
