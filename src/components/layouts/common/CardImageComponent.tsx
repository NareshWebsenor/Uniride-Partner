import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { IMAGES } from '@/assets';
import { useThemeColor } from '@/hooks/useThemeColor';

interface CardImageComponentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  imageStyle?: ViewStyle;
  source?: ImageSourcePropType;
}

const CardImageComponent: React.FC<CardImageComponentProps> = ({
  children,
  style,
  imageStyle,
  source = IMAGES.cardBack,
}) => {
  const colors = useThemeColor();
  return (
    <ImageBackground
      source={source}
      style={[styles.container, { shadowColor: colors.shadow }, style]}
      imageStyle={[styles.image, imageStyle]}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  image: {
    borderRadius: 32,
  },
});

export default CardImageComponent;
