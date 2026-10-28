import React, { forwardRef, useState } from 'react';
import {
  TextInput as NativeTextInput,
  TextInputProps as NativeTextInputProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { radii, sizes, spacing, typography } from '@/theme/tokens';
import { Ionicons } from '@/utils/fontIcon.utils';
import { IconButton } from './Button';
import { Text } from './Text';

export type TextInputProps = NativeTextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  left?: React.ReactNode;
  right?: React.ReactNode;
  labelStyle?: StyleProp<import('react-native').TextStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
};

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(
  function TextInput(
    {
      label,
      error,
      hint,
      containerStyle,
      style,
      left,
      right,
      labelStyle,
      fieldStyle,
      onFocus,
      onBlur,
      editable = true,
      ...props
    },
    ref,
  ) {
    const colors = useThemeColor();
    const [focused, setFocused] = useState(false);
    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
        <View
          style={[
            styles.field,
            {
              backgroundColor: editable ? colors.surface : colors.disabled,
              borderColor: error
                ? colors.error
                : focused
                ? colors.primary
                : colors.border,
            },
            fieldStyle,
          ]}
        >
          {left}
          <NativeTextInput
            {...props}
            ref={ref}
            accessibilityLabel={props.accessibilityLabel ?? label}
            editable={editable}
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            onFocus={event => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={event => {
              setFocused(false);
              onBlur?.(event);
            }}
            style={[styles.input, { color: colors.textPrimary }, style]}
          />
          {right}
        </View>
        {error ? (
          <Text variant="caption" tone="error" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : hint ? (
          <Text variant="caption" tone="secondary">
            {hint}
          </Text>
        ) : null}
      </View>
    );
  },
);

export function SearchInput(props: TextInputProps) {
  const { t } = useTranslation();
  const colors = useThemeColor();
  return (
    <TextInput
      placeholder={t('ui.search')}
      returnKeyType="search"
      {...props}
      left={
        <Ionicons
          name="search"
          size={sizes.icon}
          color={colors.textSecondary}
        />
      }
      right={
        props.value && props.editable !== false ? (
          <IconButton
            accessibilityLabel={t('ui.clear')}
            onPress={() => props.onChangeText?.('')}
            icon={
              <Ionicons
                name="close"
                size={sizes.icon}
                color={colors.textSecondary}
              />
            }
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: sizes.input,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
  },
});
