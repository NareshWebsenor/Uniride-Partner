import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { themeType } from '@/interface/theme.type';
import { MaterialIcons, fontSize } from '@/utils/fontIcon.utils';
import { wp } from '@/utils/responsive.utils';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

type FabIconProps = {
  onPress: () => void;
};

export default function FabIcon({ onPress }: FabIconProps) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name="add" size={fontSize.f30} color={themeColor.onPrimary} />
    </TouchableOpacity>
  );
}

const createStyle = (themeColor: themeType) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: wp('5%'),
      right: wp('5%'),
      width: wp('14%'),
      height: wp('14%'),
      borderRadius: wp('7%'),
      backgroundColor: themeColor.primary, // Blue color from image
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: themeColor.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: 999,
    },
  });
