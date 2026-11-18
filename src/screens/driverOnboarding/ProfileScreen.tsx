import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import OnboardingLayout from '@/components/driverOnboarding/OnboardingLayout';
import OnboardingProgress from '@/components/driverOnboarding/OnboardingProgress';
import { Text } from '@/components/ui/Text';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useOnboardingCompletion } from '@/hooks/useOnboardingCompletion';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { OnboardingScreenProps } from '@/interface/driverOnboarding.type';
import type { themeType } from '@/interface/theme.type';
import { useDriverOnboardingStore } from '@/store/driverOnboardingStore';
import {
  documentValid,
  driverComplete,
  vehicleComplete,
  vehicleValid,
} from '@/utils/driverOnboarding';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';

export default function ProfileScreen({
  navigation,
  route,
}: OnboardingScreenProps<'ProfileScreen'>) {
  const { t } = useAppTranslation();
  const styles = useThemedStyles(createStyle);
  const colors = useThemeColor();
  const state = useDriverOnboardingStore();
  const own = state.preference === 'own';
  const stage = route.params.stage;
  const finish = useOnboardingCompletion(() =>
    navigation.reset({ index: 0, routes: [{ name: 'MainStack' }] }),
  );
  const documentDone = (
    kind: 'license' | 'photo' | 'government' | 'rc' | 'pollution' | 'insurance',
  ) =>
    state.documents[kind].submitted &&
    documentValid(kind, state.documents[kind]);
  const rows =
    stage === 'driver'
      ? [
          {
            title: t('driverOnboarding.documents.license.title'),
            done: documentDone('license'),
            route: 'DrivingLicenseScreen' as const,
          },
          {
            title: t('driverOnboarding.documents.photo.title'),
            done: documentDone('photo'),
            route: 'ProfilePictureScreen' as const,
          },
          {
            title: t('driverOnboarding.documents.government.title'),
            done: documentDone('government'),
            route: 'GovernmentIdScreen' as const,
          },
        ]
      : [
          {
            title: t('driverOnboarding.vehicleModel.title'),
            done: state.vehicle.submitted && vehicleValid(state.vehicle),
            route: 'VehicleModelScreen' as const,
          },
          {
            title: t('driverOnboarding.documents.rc.title'),
            done: documentDone('rc'),
            route: 'VehicleRcScreen' as const,
          },
          {
            title: t('driverOnboarding.documents.pollution.title'),
            done: documentDone('pollution'),
            route: 'PollutionCertificateScreen' as const,
          },
          {
            title: t('driverOnboarding.documents.insurance.title'),
            done: documentDone('insurance'),
            route: 'VehicleInsuranceScreen' as const,
          },
        ];
  const ready =
    driverComplete(state.documents) &&
    (stage === 'driver' ||
      (own && vehicleComplete(state.documents, state.vehicle)));
  return (
    <OnboardingLayout
      testID={`profile-${stage}-screen`}
      title={
        state.firstName
          ? t('driverOnboarding.welcome', { name: state.firstName })
          : t('driverOnboarding.welcomeFallback')
      }
      description={t(
        own
          ? 'driverOnboarding.ownDescription'
          : 'driverOnboarding.driverDescription',
      )}
      onBack={navigation.goBack}
      disabled={!ready}
      continueLabel={t(
        own
          ? 'driverOnboarding.continue'
          : 'driverOnboarding.submitApplication',
      )}
      onContinue={() => {
        if (!ready) return;
        if (!own) finish();
        else if (stage === 'driver')
          navigation.push('ProfileScreen', { stage: 'vehicle' });
        else navigation.navigate('BankDetailsScreen');
      }}
    >
      {own ? <OnboardingProgress stage={stage === 'driver' ? 1 : 2} /> : null}
      <View>
        {rows.map(row => (
          <Pressable
            key={row.route}
            testID={`open-${row.route}`}
            accessibilityRole="button"
            accessibilityLabel={
              row.done
                ? `${row.title}. ${t('driverOnboarding.completed')}`
                : row.title
            }
            onPress={() => navigation.navigate(row.route)}
            style={styles.row}
          >
            <View style={styles.copy}>
              <Text style={styles.label}>{row.title}</Text>
              {row.done ? (
                <Text tone="success" style={styles.status}>
                  {t('driverOnboarding.completed')}
                </Text>
              ) : null}
            </View>
            <Ionicons
              name="chevron-forward"
              size={wp('4%')}
              color={colors.textSecondary}
            />
          </Pressable>
        ))}
      </View>
    </OnboardingLayout>
  );
}
const createStyle = (theme: themeType) =>
  StyleSheet.create({
    row: {
      minHeight: Math.max(48, hp('8%')),
      paddingVertical: hp('2%'),
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      gap: wp('2%'),
    },
    copy: { flex: 1, gap: hp('0.5%') },
    label: { fontSize: fSize(1.8) },
    status: { fontSize: fSize(1.35) },
  });
