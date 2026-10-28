import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { sizes, spacing, typography } from '@/theme/tokens';

export default function BrandLogo() {
  const colors = useThemeColor();
  const { t } = useAppTranslation();
  return (
    <View accessible accessibilityLabel={t('ride.brand')} style={styles.row}>
      <Svg width={sizes.brandMark} height={sizes.brandMark} viewBox="0 0 64 64">
        <Circle cx="32" cy="32" r="30" fill={colors.brandAccent} />
        <Circle cx="32" cy="32" r="26" fill={colors.brandMark} />
        <Path
          d="M18 16v25c0 14 25 14 25 0V16h-7v25c0 6-11 6-11 0V16z"
          fill={colors.onBrandMark}
        />
        <Path
          d="M45 16v32M48 19v26"
          stroke={colors.brandAccent}
          strokeWidth="1.5"
        />
      </Svg>
      <Text style={styles.name}>{t('ride.brand')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  name: { fontSize: typography.brand, fontWeight: '600', flexShrink: 1 },
});
