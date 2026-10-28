import { InfoVariant } from '@/interface/general.type';
import {
  fontFamily,
  fontSize,
  Ionicons,
  MaterialIcons,
  MaterialDesignIcons,
  Feather,
  Entypo,
  AntDesign,
  Fontisto,
} from '@/utils/fontIcon.utils';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';
import * as types from '@/interface';

export interface InfoTag {
  icon: string;
  label: string;
  iconType?:
    | 'Ionicons'
    | 'MaterialIcons'
    | 'MaterialDesignIcons'
    | 'Feather'
    | 'Entypo'
    | 'AntDesign'
    | 'Fontisto';
}

interface InfoComponentProps {
  title?: string;
  description?: string;
  message?: string;
  variant?: InfoVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isDark?: boolean;
  isCard?: boolean;
  points?: string[];
  tags?: InfoTag[];
  customIcon?: string;
  iconType?:
    | 'Ionicons'
    | 'MaterialIcons'
    | 'MaterialDesignIcons'
    | 'Feather'
    | 'Entypo'
    | 'AntDesign'
    | 'Fontisto';
}

const InfoComponent: React.FC<InfoComponentProps> = ({
  title,
  description,
  message,
  variant = InfoVariant.INFO,
  style,
  textStyle,
  isDark = false,
  isCard = false,
  points,
  tags,
  customIcon,
  iconType = 'Ionicons',
}) => {
  const styles = useThemedStyles(createStyles);
  const themeColor = useThemeColor();

  const config = useMemo(() => {
    const variantConfig = {
      [InfoVariant.SUCCESS]: {
        icon: 'checkmark-circle-outline',
        color: themeColor.success,
        background: themeColor.surfaceRaised,
        iconBg: themeColor.surfaceRaised,
      },
      [InfoVariant.INFO]: {
        icon: 'information-circle-outline',
        color: themeColor.secondaryS2,
        background: themeColor.primaryS1,
        iconBg: themeColor.surfaceRaised,
      },
      [InfoVariant.WARNING]: {
        icon: 'warning-outline',
        color: themeColor.warning,
        background: themeColor.surfaceRaised,
        iconBg: themeColor.surfaceRaised,
      },
      [InfoVariant.ERROR]: {
        icon: 'alert-circle-outline',
        color: themeColor.red,
        background: themeColor.redS1,
        iconBg: themeColor.redS1,
      },
      [InfoVariant.PAYMENT]: {
        icon: 'checkmark-circle-outline',
        color: themeColor.secondary,
        background: themeColor.surface,
        iconBg: themeColor.grayS3,
      },
    };
    return variantConfig[variant];
  }, [variant, themeColor]);

  const backgroundColor = isDark 
    ? themeColor.secondary 
    : isCard 
      ? themeColor.surface
      : config.background;

  const textColor = isDark ? themeColor.onPrimary : themeColor.textPrimary;
  const descriptionColor = isDark ? themeColor.onPrimary : themeColor.textSecondary;
  const iconColor = isDark ? themeColor.onPrimary : config.color;
  const iconBg = isDark ? themeColor.transparent : config.iconBg;

  const renderIcon = (
    name: string,
    size: number,
    color: string,
    type: string,
  ) => {
    switch (type) {
      case 'MaterialIcons':
        return <MaterialIcons name={name as any} size={size} color={color} />;
      case 'MaterialDesignIcons':
        return (
          <MaterialDesignIcons name={name as any} size={size} color={color} />
        );
      case 'Feather':
        return <Feather name={name as any} size={size} color={color} />;
      case 'Entypo':
        return <Entypo name={name as any} size={size} color={color} />;
      case 'AntDesign':
        return <AntDesign name={name as any} size={size} color={color} />;
      case 'Fontisto':
        return <Fontisto name={name as any} size={size} color={color} />;
      default:
        return <Ionicons name={name as any} size={size} color={color} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }, isCard && styles.cardShadow, style]}>
      <View style={styles.contentRow}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }, isDark && styles.darkIconContainer]}>
          {renderIcon(customIcon || config.icon, 24, iconColor, iconType)}
        </View>
        <View style={styles.textContainer}>
          {title && (
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          )}
          {(description || message) && (
            <Text
              style={[
                styles.description,
                { color: descriptionColor },
                textStyle,
              ]}
            >
              {description || message}
            </Text>
          )}

          {points && points.length > 0 && (
            <View style={styles.pointsContainer}>
              {points.map((point, index) => (
                <View key={index} style={styles.pointRow}>
                  <Text style={[styles.bullet, { color: descriptionColor }]}>
                    •
                  </Text>
                  <Text
                    style={[styles.pointText, { color: descriptionColor }]}
                  >
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {tags && tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={[styles.tag, isDark && styles.darkTag]}>
                  {renderIcon(
                    tag.icon,
                    14,
                    iconColor,
                    tag.iconType || 'Ionicons',
                  )}
                  <Text style={[styles.tagText, { color: textColor }]}>
                    {tag.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const createStyles = (themeColor: types.themeType) =>
  StyleSheet.create({
    container: {
      padding: 16,
      borderRadius: 24,
      marginVertical: 8,
    },
    cardShadow: {
      shadowColor: themeColor.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    darkIconContainer: {
      backgroundColor: themeColor.border,
      borderRadius: 12,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontSize: fontSize.f16,
      fontFamily: fontFamily.bold,
      marginBottom: 2,
    },
    description: {
      fontSize: fontSize.f13,
      fontFamily: fontFamily.medium,
      lineHeight: 20,
    },
    pointsContainer: {
      marginTop: 8,
    },
    pointRow: {
      flexDirection: 'row',
      marginBottom: 4,
      alignItems: 'flex-start',
    },
    bullet: {
      fontSize: fontSize.f14,
      marginRight: 8,
    },
    pointText: {
      fontSize: fontSize.f14,
      fontFamily: fontFamily.medium,
      flex: 1,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      gap: 8,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: themeColor.borderColor,
    },
    darkTag: {
      backgroundColor: themeColor.border,
      borderColor: themeColor.transparent,
    },
    tagText: {
      fontSize: fontSize.f12,
      fontFamily: fontFamily.bold,
      marginLeft: 6,
    },
  });



export default InfoComponent;


