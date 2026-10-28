import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import React from 'react';
import { navigateBack } from '@/utils/navigation.utils';
import { Ionicons, fontFamily, fontSize } from '@/utils/fontIcon.utils';
import { themeType } from '@/interface/theme.type';
import { hp, wp } from '@/utils/responsive.utils';
import LinearGradient from 'react-native-linear-gradient';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface StackHeaderProps {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: TextStyle;
  showBackIcon?: boolean;
}

export default function StackHeader({
  title = '',
  subtitle = '',
  onBackPress,
  style,
  titleStyle,
  showBackIcon = true,
}: StackHeaderProps) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();

  return (
    <View style={[styles.headerContainer, style]}>
      <View style={styles.contentRow}>
        {showBackIcon && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress ? onBackPress : () => navigateBack()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={fontSize.f20}
              color={themeColor.secondary}
            />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          {subtitle !== '' && (
            <Text style={[styles.subtitle, { color: themeColor.textS2 }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={[
          themeColor.transparent,
          themeColor.border,
          themeColor.transparent,
        ]}
        style={styles.bottomLine}
      />
    </View>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    headerContainer: {
      paddingHorizontal: wp('5%'),
      paddingVertical: hp('2%'),
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: theme.backgroundColorS1,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
    },
    titleContainer: {
      marginLeft: 15,
      justifyContent: 'center',
    },
    title: {
      fontSize: fontSize.f18,
      fontFamily: fontFamily.bold,
      color: theme.secondary,
    },
    subtitle: {
      fontSize: fontSize.f12,
      fontFamily: fontFamily.medium,
      marginTop: -2,
    },
    bottomLine: {
      height: 1.5,
      width: wp('100%'),
      position: 'absolute',
      bottom: 0,
      alignSelf: 'center',
    },
  });
