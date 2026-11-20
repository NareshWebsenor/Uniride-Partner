import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Text } from '@/components/ui/Text';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import type { OnboardingDateFieldProps } from '@/interface/driverOnboarding.type';
import type { themeType } from '@/interface/theme.type';
import { localDateString, parseLocalDate } from '@/utils/driverOnboarding';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';

export default function OnboardingDateField({
  label,
  value,
  onChange,
  testID,
  error,
  allowPast = false,
  disabled = false,
}: OnboardingDateFieldProps) {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useAppTranslation();
  const colors = useThemeColor();
  const { resolvedTheme } = useTheme();
  const styles = useThemedStyles(createStyle);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseLocalDate(value);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        accessibilityState={{ disabled }}
        accessibilityValue={{
          text: value || t('driverOnboarding.date.placeholder'),
        }}
        onPress={() => setOpen(true)}
        style={styles.field}
      >
        <Text
          style={[
            styles.value,
            { color: date ? colors.textPrimary : colors.placeHolderColor },
          ]}
        >
          {date
            ? date.toLocaleDateString(
                i18n.language === 'hi'
                  ? 'hi-IN'
                  : i18n.language === 'es'
                  ? 'es'
                  : 'en-BS',
              )
            : t('driverOnboarding.date.placeholder')}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={wp('5%')}
          color={colors.textSecondary}
        />
      </Pressable>
      {error ? (
        <Text tone="error" variant="caption" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <DateTimePickerModal
        isVisible={open}
        mode="date"
        isDarkModeEnabled={resolvedTheme === 'dark'}
        themeVariant={resolvedTheme}
        buttonTextColorIOS={colors.primary}
        date={date && (allowPast || date >= today) ? date : today}
        minimumDate={allowPast ? undefined : today}
        confirmTextIOS={t('driverOnboarding.date.confirm')}
        cancelTextIOS={t('driverOnboarding.date.cancel')}
        onCancel={() => setOpen(false)}
        onConfirm={selected => {
          setOpen(false);
          onChange(localDateString(selected));
        }}
      />
    </View>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    wrapper: { gap: hp('0.6%') },
    label: { fontSize: fSize(1.7), fontWeight: '600' },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: wp('3%'),
      minHeight: Math.max(48, hp('6%')),
      padding: wp('3%'),
      gap: wp('2%'),
    },
    value: { flex: 1, fontSize: fSize(1.8) },
  });
