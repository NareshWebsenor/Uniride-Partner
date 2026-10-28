import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing } from '@/theme/tokens';
import { Button } from './Button';
import { BottomSheet } from './Modal';
import { RadioButton } from './SelectionControls';
import { Text } from './Text';
import { SearchInput } from './TextInput';

export type DropdownOption = { label: string; value: string };
export type DropdownProps = {
  label?: string;
  value?: string;
  options: readonly DropdownOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  searchable?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonTextStyle?: StyleProp<TextStyle>;
  trailingIcon?: React.ReactNode;
};

export function Dropdown({
  label,
  value,
  options,
  onValueChange,
  placeholder,
  disabled,
  error,
  searchable,
  style,
  labelStyle,
  buttonStyle,
  buttonTextStyle,
  trailingIcon,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { t } = useTranslation();
  const selected = options.find(option => option.value === value);
  const close = () => {
    setOpen(false);
    setQuery('');
  };
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={labelStyle}>{label}</Text> : null}
      <Button
        title={selected?.label ?? placeholder ?? t('ui.selectOption')}
        accessibilityLabel={label}
        accessibilityValue={{
          text: selected?.label ?? placeholder ?? t('ui.selectOption'),
        }}
        accessibilityState={{ expanded: open, disabled }}
        variant="outline"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          trailingIcon ? styles.withTrailingIcon : undefined,
          buttonStyle,
        ]}
        textStyle={buttonTextStyle}
        icon={trailingIcon}
      />
      {error ? (
        <Text tone="error" variant="caption">
          {error}
        </Text>
      ) : null}
      <BottomSheet visible={open} onClose={close} title={label}>
        {searchable ? (
          <SearchInput value={query} onChangeText={setQuery} />
        ) : null}
        {options
          .filter(
            option =>
              !searchable ||
              option.label
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase()),
          )
          .map(option => (
            <RadioButton
              key={option.value}
              label={option.label}
              value={option.value === value}
              onValueChange={() => {
                onValueChange(option.value);
                close();
              }}
            />
          ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  withTrailingIcon: { flexDirection: 'row-reverse' },
});
