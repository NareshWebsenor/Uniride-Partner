import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { OnboardingProgressProps } from '@/interface/driverOnboarding.type';
import type { themeType } from '@/interface/theme.type';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { hp, wp } from '@/utils/responsive.utils';

export default function OnboardingProgress({ stage }: OnboardingProgressProps) {
  const { t } = useAppTranslation();
  const styles = useThemedStyles(createStyle);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t('driverOnboarding.progress', { stage, total: 3 })}
      accessibilityValue={{ min: 1, max: 3, now: stage }}
      style={styles.row}
    >
      {[1, 2, 3].map(value => (
        <View
          key={value}
          style={[styles.segment, value <= stage && styles.active]}
        />
      ))}
    </View>
  );
}
const createStyle = (theme: themeType) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: wp('1%') },
    segment: {
      flex: 1,
      height: Math.max(3, hp('0.4%')),
      backgroundColor: theme.border,
    },
    active: { backgroundColor: theme.success },
  });
