import React from 'react';
import { TextStyle, ViewStyle } from 'react-native';
import { Checkbox as SelectionCheckbox } from '@/components/ui/SelectionControls';

type Props = {
  label?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
  labelStyle?: TextStyle;
  containerStyle?: ViewStyle;
  checkboxStyle?: TextStyle;
};

export default function Checkbox({
  onChange,
  containerStyle,
  checkboxStyle,
  ...props
}: Props) {
  return (
    <SelectionCheckbox
      {...props}
      onValueChange={onChange}
      style={containerStyle}
      markStyle={checkboxStyle}
    />
  );
}
