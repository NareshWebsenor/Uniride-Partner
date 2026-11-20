import React, { useState } from 'react';
import { StyleSheet, ImageBackground, Pressable, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui';
import Button from '@/components/buttons/CustomButton';
import CustomTextInput from '@/components/inputs/TextInput/CustomTextInput';
import StackHeader from '@/components/headers/StackHeader';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { isValidEmail } from '@/utils/authPreview';
import type { themeType } from '@/interface/theme.type';
import { fSize, hp, wp } from '@/utils/responsive.utils';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export type RegistrationDraft = {
  firstName: string;
  lastName: string;
  email: string;
};

export default function AuthEntry({
  draft,
  onChange,
  onRegister,
  onLogin,
  onUnavailable,
  register,
  onModeChange,
  busy = false,
  error,
  cooldown = 0,
}: {
  draft: RegistrationDraft;
  onChange: (value: RegistrationDraft) => void;
  onRegister: () => void;
  onLogin: (password: string) => void;
  onUnavailable: () => void;
  register: boolean;
  onModeChange: (value: boolean) => void;
  busy?: boolean;
  error?: string;
  cooldown?: number;
}) {
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { t } = useAppTranslation();
  const styles = useThemedStyles(createStyle);
  const colors = useThemeColor();
  const emailError = submitted && !isValidEmail(draft.email);
  const continueFlow = () => {
    if (busy || cooldown > 0) return;
    setSubmitted(true);
    if (
      !isValidEmail(draft.email) ||
      (register ? !draft.firstName.trim() : !password)
    )
      return;
    if (register) onRegister();
    else onLogin(password);
  };
  return (
    <>
      <ImageBackground
        source={require('@/assets/images/auth-coast.png')}
        style={styles.hero}
        resizeMode="cover"
      >
        <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
          <LinearGradient
            colors={[colors.transparent, colors.overlay]}
            style={styles.heroCopy}
          >
            <StackHeader
              showBackIcon={false}
              showDivider={false}
              style={styles.plainHeader}
              title={t('partnerAuth.heroTitle')}
              subtitle={t('partnerAuth.heroSubtitle')}
              titleStyle={styles.heroTitle}
              subtitleStyle={styles.heroSubtitle}
            />
          </LinearGradient>
        </SafeAreaView>
      </ImageBackground>
      <KeyboardAwareScrollView
        testID="auth-entry"
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={hp('2%')}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheet}>
          <View style={styles.tabs} accessibilityRole="tablist">
            {([false, true] as const).map(value => (
              <Pressable
                key={String(value)}
                testID={value ? 'register-tab' : 'login-tab'}
                disabled={busy}
                accessibilityRole="tab"
                accessibilityState={{ selected: register === value }}
                style={register === value ? styles.activeTab : styles.tab}
                onPress={() => {
                  onModeChange(value);
                  setSubmitted(false);
                  setPassword('');
                }}
              >
                <Text
                  style={
                    register === value ? styles.activeTabLabel : styles.tabLabel
                  }
                >
                  {t(value ? 'partnerAuth.register' : 'ui.login')}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.fields}>
            {register && (
              <View style={styles.row}>
                <CustomTextInput testID="first-name" style={styles.flex} isEditable={!busy}
                  label={t('ride.auth.firstName')} placeholder={t('ride.auth.firstNamePlaceholder')}
                  value={draft.firstName} maxLength={60} autoComplete="given-name"
                  onChangeText={firstName => onChange({ ...draft, firstName })}
                  errorMsg={submitted && !draft.firstName.trim() ? t('ride.validation.firstName') : undefined} />
                <CustomTextInput testID="last-name" style={styles.flex} isEditable={!busy}
                  label={t('partnerAuth.lastName')} placeholder={t('ride.auth.lastNamePlaceholder')}
                  value={draft.lastName} maxLength={60} autoComplete="family-name"
                  onChangeText={lastName => onChange({ ...draft, lastName })} />
              </View>
            )}
            <CustomTextInput
              isEditable={!busy}
              testID="email"
              label={t('partnerAuth.email')}
              placeholder={t('partnerAuth.emailPlaceholder')}
              value={draft.email}
              onChangeText={email => onChange({ ...draft, email })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              maxLength={254}
              errorMsg={emailError ? t('ride.validation.email') : undefined}
            />
            {!register && (
              <CustomTextInput
                isEditable={!busy}
                secureTextEntry
                placeholder={t('partnerAuth.passwordPlaceholder')}
                containerStyle={styles.input}
                testID="login-password"
                label={t('partnerAuth.password')}
                value={password}
                onChangeText={setPassword}
                errorMsg={
                  submitted && !password
                    ? t('partnerAuth.passwordRequired')
                    : undefined
                }
              />
            )}
          </View>
          {error ? <Text tone="error" accessibilityRole="alert">{error}</Text> : null}
          {cooldown > 0 ? <Text tone="secondary">{t('partnerAuth.resendIn', { count: cooldown })}</Text> : null}
          <Button
            isGradiantRequired={false}
            testID="entry-continue"
            loading={busy}
            disabled={busy || cooldown > 0}
            title={t('ride.auth.continue')}
            onPress={continueFlow}
            style={register ? styles.registerAction : styles.loginAction}
          />
          <View style={styles.customerSpace} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('partnerAuth.bookRide')}
            onPress={onUnavailable}
            style={styles.customer}
          >
            <Text>{t('partnerAuth.customer')}</Text>
            <Text style={styles.bookRideLink}>{t('partnerAuth.bookRide')}</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    flex: { flex: 1 },
    noMargin: { marginTop: 0 },
    row: { flexDirection: 'row', gap: wp('4%'), alignItems: 'center' },
    fields: { gap: wp('4%') },
    plainHeader: { paddingHorizontal: 0, paddingVertical: 0 },
    heroSubtitle: {
      fontSize: fSize(1.75),
      marginTop: hp('0.5%'),
      color: theme.onImage,
    },
    hero: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      minHeight: hp('30%'),
      justifyContent: 'flex-end',
    },
    heroSafeArea: { minHeight: hp('30%'), justifyContent: 'flex-end' },
    heroCopy: { padding: wp('6%'), paddingBottom: hp('6%') },
    heroTitle: {
      fontSize: fSize(3),
      fontWeight: '700',
      color: theme.onImage,
    },
    sheet: {
      backgroundColor: theme.surface,
      padding: wp('6%'),
      borderTopLeftRadius: wp('8%'),
      borderTopRightRadius: wp('8%'),
      overflow: 'hidden',
    },
    scrollContent: { paddingTop: hp('27%') },
    tabs: {
      backgroundColor: theme.surfaceRaised,
      flexDirection: 'row',
      borderRadius: wp('3%'),
      padding: 2,
      marginBottom: hp('2%'),
    },
    tab: {
      backgroundColor: theme.transparent,
      flex: 1,
      minHeight: Math.max(48, hp('6%')),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: wp('3%'),
    },
    tabLabel: {
      fontWeight: '600',
      fontSize: fSize(2.25),
      color: theme.textPrimary,
    },
    loginAction: {
      minHeight: Math.max(48, hp('7%')),
      borderRadius: wp('5%'),
      marginTop: hp('3%'),
    },
    registerAction: {
      minHeight: Math.max(48, hp('7%')),
      borderRadius: wp('5%'),
      marginTop: hp('7%'),
    },
    activeTab: {
      flex: 1,
      minHeight: Math.max(48, hp('6%')),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: wp('3%'),
      backgroundColor: theme.primary,
    },
    activeTabLabel: {
      fontWeight: '600',
      fontSize: fSize(2.25),
      color: theme.onPrimary,
    },
    forgotLink: { fontSize: fSize(1.5), color: theme.brandLink },
    bookRideLink: { color: theme.brandLink },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp('4%'),
      marginVertical: hp('3%'),
    },
    line: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
    },
    customer: {
      borderColor: theme.border,
      minHeight: Math.max(48, hp('7%')),
      borderWidth: 1,
      borderRadius: wp('3%'),
      padding: wp('2%'),
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp('1%'),
    },
    customerSpace: { height: hp('3%') },
    linkButton: { minHeight: Math.max(48, hp('6%')), justifyContent: 'center' },
    small: { fontSize: fSize(1.5) },
    input: { minHeight: Math.max(48, hp('7%')) },
  });
