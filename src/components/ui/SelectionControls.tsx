import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Switch as NativeSwitch,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { hp, wp } from '@/utils/responsive.utils';
import { Ionicons } from '@/utils/fontIcon.utils';
import { Text } from './Text';

export type SelectionProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  activeColor?: string;
  inactiveColor?: string;
  markStyle?: StyleProp<ViewStyle>;
};

function Selection({
  value,
  onValueChange,
  label,
  accessibilityLabel,
  disabled,
  style,
  labelStyle,
  activeColor,
  inactiveColor,
  markStyle,
  radio = false,
}: SelectionProps & { radio?: boolean }) {
  const colors = useThemeColor();
  return (
    <Pressable
      accessibilityRole={radio ? 'radio' : 'checkbox'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: value, disabled }}
      onPress={() => onValueChange(radio || !value)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <View
        style={[
          styles.mark,
          {
            borderRadius: radio ? 999 : wp('1%'),
            borderColor: value
              ? activeColor ?? colors.primary
              : inactiveColor ?? colors.border,
            backgroundColor: value
              ? activeColor ?? colors.primary
              : colors.transparent,
          },
          markStyle,
        ]}
      >
        {value ? (
          <Ionicons
            name={radio ? 'ellipse' : 'checkmark'}
            size={radio ? wp('2%') : wp('4%')}
            color={colors.onPrimary}
          />
        ) : null}
      </View>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
    </Pressable>
  );
}

export function Checkbox(props: SelectionProps) {
  return <Selection {...props} />;
}

export function RadioButton(props: SelectionProps) {
  return <Selection {...props} radio />;
}

export function Switch({
  value,
  onValueChange,
  label,
  accessibilityLabel,
  disabled,
  style,
  labelStyle,
  activeColor,
  inactiveColor,
  thumbColor,
  controlStyle,
}: SelectionProps & {
  thumbColor?: string;
  controlStyle?: StyleProp<ViewStyle>;
}) {
  const colors = useThemeColor();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      <View pointerEvents="none">
        <NativeSwitch
          value={value}
          disabled={disabled}
          accessible={false}
          importantForAccessibility="no"
          trackColor={{
            false: inactiveColor ?? colors.disabled,
            true: activeColor ?? colors.primary,
          }}
          thumbColor={thumbColor ?? colors.onPrimary}
          ios_backgroundColor={inactiveColor ?? colors.disabled}
          style={controlStyle}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: Math.max(48, hp('6%')),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  label: { flex: 1, flexShrink: 1 },
  mark: {
    width: wp('6%'),
    height: wp('6%'),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
