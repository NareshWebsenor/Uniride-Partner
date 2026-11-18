import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@/utils/fontIcon.utils';
import type { themeType } from '@/interface/theme.type';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { fSize, hp, wp } from '@/utils/responsive.utils';
import { Text } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';

type Props = TextInputProps & {
  name?: string;
  placeholder?: string;
  errorMsg?: string;
  label?: string;
  iconName?: string;
  deafultValue?: string;
  mode?: string;
  InputStyle?: TextStyle;
  onChangeText: (value: string) => void;
  isEditable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  left?: React.ReactNode;
  otpLength?: number;
  value: string;
  onClose?: () => void;
  isRequired?: boolean;
  labelStyle?: TextStyle;
  leftIconStyle?: TextStyle;
};

export default function CustomTextInput({
  name,
  errorMsg,
  label,
  iconName,
  deafultValue,
  mode: _mode,
  InputStyle,
  isEditable = true,
  containerStyle,
  style,
  onClose,
  isRequired,
  labelStyle,
  leftIconStyle,
  secureTextEntry,
  left,
  otpLength,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const colors = useThemeColor();
  const styles = useThemedStyles(createStyle);
  const { t } = useTranslation();
  const secure =
    secureTextEntry ?? name?.toLowerCase().includes('password') ?? false;
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  if (otpLength) {
    return (
      <View style={[styles.row, style]}>
        {Array.from({ length: otpLength }, (_, index) => (
          <View
            key={index}
            accessible={false}
            style={[
              styles.cell,
              focused &&
                index === Math.min(props.value.length, otpLength - 1) &&
                styles.focusedCell,
            ]}
          >
            <Text importantForAccessibility="no" style={styles.digit}>
              {props.value[index] ?? ''}
            </Text>
          </View>
        ))}
        <TextInput
          {...props}
          editable={isEditable}
          maxLength={otpLength}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          caretHidden
          onChangeText={value =>
            props.onChangeText(value.replace(/\D/g, '').slice(0, otpLength))
          }
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          containerStyle={StyleSheet.absoluteFill}
          fieldStyle={styles.hiddenField}
          style={styles.hiddenInput}
          selectionColor={colors.transparent}
        />
      </View>
    );
  }
  return (
    <View style={style}>
      <TextInput
        {...props}
        label={label && isRequired ? t('ui.requiredLabel', { label }) : label}
        error={errorMsg}
        defaultValue={deafultValue}
        editable={isEditable}
        secureTextEntry={secure && !visible}
        style={InputStyle}
        fieldStyle={containerStyle}
        labelStyle={labelStyle}
        onFocus={onFocus}
        onBlur={onBlur}
        left={
          left ??
          (iconName ? (
            <Ionicons
              name={iconName as React.ComponentProps<typeof Ionicons>['name']}
              size={wp('6%')}
              color={colors.primary}
              style={leftIconStyle}
            />
          ) : null)
        }
        right={
          secure ? (
            <IconButton
              accessibilityLabel={t(
                visible ? 'ui.hidePassword' : 'ui.showPassword',
              )}
              onPress={() => setVisible(!visible)}
              icon={
                <Ionicons
                  name={visible ? 'eye-off' : 'eye'}
                  size={wp('6%')}
                  color={colors.textSecondary}
                />
              }
            />
          ) : onClose && props.value?.trim() ? (
            <IconButton
              accessibilityLabel={t('ui.clear')}
              onPress={onClose}
              icon={
                <Ionicons
                  name="close-circle"
                  size={wp('6%')}
                  color={colors.textSecondary}
                />
              }
            />
          ) : null
        }
      />
    </View>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: wp('4%'), alignSelf: 'flex-start' },
    cell: {
      borderColor: theme.border,
      width: wp('12%'),
      minHeight: Math.max(48, hp('7%')),
      borderWidth: 1,
      borderRadius: wp('5%'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    digit: { fontSize: fSize(3), fontWeight: '700' },
    focusedCell: { borderColor: theme.primary },
    hiddenInput: { color: theme.transparent, opacity: 0 },
    hiddenField: {
      borderWidth: 0,
      minHeight: Math.max(48, hp('7%')),
      backgroundColor: theme.transparent,
    },
  });
