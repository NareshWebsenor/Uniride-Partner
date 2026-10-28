import React from 'react';
import { SvgProps } from 'react-native-svg';
import { useThemeColor } from '@/hooks/useThemeColor';
import Magic from './Magic.svg';

export default function MagicIcon(props: SvgProps) {
  const colors = useThemeColor();
  return <Magic color={colors.success} {...props} />;
}
