import React from 'react';
import { Switch } from '@/components/ui/SelectionControls';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  width?: number;
  height?: number;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
};

export default function CustomToggle({
  onChange,
  width,
  height,
  ...props
}: Props) {
  return (
    <Switch
      {...props}
      onValueChange={onChange}
      controlStyle={{
        transform: [
          { scaleX: width ? width / 50 : 1 },
          { scaleY: height ? height / 30 : 1 },
        ],
      }}
    />
  );
}
