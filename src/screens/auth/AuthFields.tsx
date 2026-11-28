import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Ionicons } from '@/utils/fontIcon.utils';
import { wp } from '@/utils/responsive.utils';
import { passwordRules } from '@/utils/authPreview';
import type { themeType } from '@/interface/theme.type';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export function PasswordChecklist({ value }: { value: string }) {
  const rules = passwordRules(value);
  const { t } = useAppTranslation();
  const styles = useThemedStyles(createStyle);
  const colors = useThemeColor();
  return (
    <View style={styles.fields}>
      {(['length', 'digit', 'nonDigit'] as const).map(rule => (
        <View key={rule} style={styles.row}>
          <Ionicons
            name={rules[rule] ? 'checkmark-circle' : 'ellipse-outline'}
            size={wp('6%')}
            color={rules[rule] ? colors.success : colors.textSecondary}
          />
          <Text
            tone="secondary"
            style={styles.flex}
            accessibilityLabel={t('partnerAuth.ruleStatus', {
              rule: t(`partnerAuth.rules.${rule}`),
              status: t(rules[rule] ? 'partnerAuth.met' : 'partnerAuth.unmet'),
            })}
          >
            {t(`partnerAuth.rules.${rule}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const createStyle = (_theme: themeType) =>
  StyleSheet.create({
    flex: { flex: 1 },
    row: { flexDirection: 'row', gap: wp('4%'), alignItems: 'center' },
    fields: { gap: wp('4%') },
  });
