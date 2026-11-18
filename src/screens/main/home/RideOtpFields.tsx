import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { ScaledTextInput } from '@/components/ui/Typography';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { fSize, hp, wp } from '@/utils/responsive.utils';

/** One native input preserves typing/paste order while four cells show the code. */
export default function RideOtpFields({ onChange }: { onChange: (otp: string) => void }) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.content}>
      <Text style={styles.label}>{t('homeRide.otpLabel')}</Text>
      <View>
        <ScaledTextInput testID="ride-otp-input" accessibilityLabel={t('homeRide.otpLabel')}
          value={code} onChangeText={text => {
            const next = text.replace(/\D/g, '').slice(0, 4);
            setCode(next); onChange(next);
          }}
          maxLength={4} keyboardType="number-pad" autoComplete="sms-otp" textContentType="oneTimeCode"
          caretHidden onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          selectionColor={colors.transparent}
          style={[styles.input, { color: colors.transparent, backgroundColor: colors.transparent }]} />
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={[styles.row, { backgroundColor: colors.surface }]}>
          {[0, 1, 2, 3].map(index => (
            <View key={index} style={[styles.cell, {
              backgroundColor: colors.surface,
              borderColor: focused && index === Math.min(code.length, 3) ? colors.primary : colors.border,
            }]}>
              <Text style={styles.digit}>{code[index] ?? ''}</Text>
            </View>
          ))}
        </View>

      </View>
      <Text variant="caption" tone="secondary">{t('homeRide.otpHint')}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: hp('0.7%') },
  label: { fontSize: fSize(1.7) },
  row: { flexDirection: 'row', gap: wp('2.5%') },
  cell: { flex: 1, minHeight: Math.max(48, hp('6%')), borderWidth: 1,
    borderRadius: wp('2%'), alignItems: 'center', justifyContent: 'center', paddingVertical: hp('0.7%') },
  digit: { textAlign: 'center', fontSize: fSize(2.3) },
  input: { ...StyleSheet.absoluteFillObject, fontSize: fSize(2.3), padding: 0 },
});
