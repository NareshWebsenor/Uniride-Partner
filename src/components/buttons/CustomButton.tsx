import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Button, ButtonProps } from '@/components/ui/Button';
import { hp } from '@/utils/responsive.utils';

type Props = Omit<ButtonProps, 'icon' | 'onPress'> & {
  title: string;
  activeOpacity?: number;
  loading?: boolean;
  disable?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress: () => void;
  icon?: boolean;
  iconContent?: React.ReactNode;
  img?: ImageSourcePropType;
  isGradiantRequired?: boolean;
};

export default function CustomButton({
  title,
  loading,
  disable,
  style,
  textStyle,
  onPress,
  img,
  activeOpacity,
  isGradiantRequired = true,
  iconContent,
  disabled,
  ...props
}: Props) {
  return (
    <Button
      {...props}
      title={title}
      loading={loading}
      disabled={disable || disabled}
      style={[styles.button, style]}
      textStyle={textStyle}
      onPress={onPress}
      activeOpacity={activeOpacity}
      gradient={isGradiantRequired}
      icon={iconContent ?? (img ? <Image source={img} /> : undefined)}
    />
  );
}

const styles = StyleSheet.create({ button: { marginTop: hp('2%') } });
