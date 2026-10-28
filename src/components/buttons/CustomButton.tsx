import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/theme/tokens';

type Props = {
  title: string;
  activeOpacity?: number;
  loading?: boolean;
  disable?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress: () => void;
  icon?: boolean;
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
}: Props) {
  return (
    <Button
      title={title}
      loading={loading}
      disabled={disable}
      style={[styles.button, style]}
      textStyle={textStyle}
      onPress={onPress}
      activeOpacity={activeOpacity}
      gradient={isGradiantRequired}
      icon={img ? <Image source={img} /> : undefined}
    />
  );
}

const styles = StyleSheet.create({ button: { marginTop: spacing.md } });
