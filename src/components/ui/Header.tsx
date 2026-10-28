import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { sizes, spacing } from '@/theme/tokens';
import { Ionicons } from '@/utils/fontIcon.utils';
import { IconButton } from './Button';
import { Heading } from './Text';

export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const colors = useThemeColor();
  const { t } = useTranslation();
  return (
    <View style={[styles.header, { borderColor: colors.border }]}>
      {onBack ? (
        <IconButton
          accessibilityLabel={t('ui.back')}
          onPress={onBack}
          icon={
            <Ionicons
              name="arrow-back"
              size={sizes.icon}
              color={colors.textPrimary}
            />
          }
        />
      ) : null}
      <Heading style={styles.title}>{title}</Heading>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1 },
});
