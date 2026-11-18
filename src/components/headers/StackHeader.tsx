import { StyleProp, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ScaledText as Text } from '@/components/ui/Typography';
import React from 'react';
import { navigateBack } from '@/utils/navigation.utils';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';
import { themeType } from '@/interface/theme.type';
import LinearGradient from 'react-native-linear-gradient';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface StackHeaderProps {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  showBackIcon?: boolean;
  showDivider?: boolean;
}

export default function StackHeader({
  title = '',
  subtitle = '',
  onBackPress,
  style,
  titleStyle,
  subtitleStyle,
  showBackIcon = true,
  showDivider = true,
}: StackHeaderProps) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  const { t } = useAppTranslation();

  return (
    <View style={[styles.headerContainer, style]}>
      <View style={styles.contentRow}>
        {showBackIcon && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('ui.back')}
            style={styles.backButton}
            onPress={onBackPress ? onBackPress : () => navigateBack()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={wp('6%')}
              color={themeColor.textPrimary}
            />
          </TouchableOpacity>
        )}
        <View
          style={[styles.titleContainer, !showBackIcon && styles.withoutBack]}
        >
          <Text accessibilityRole="header" style={[styles.title, titleStyle]}>
            {title}
          </Text>
          {subtitle !== '' && (
            <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showDivider && (
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
      )}
    </View>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    headerContainer: {
      paddingHorizontal: wp('6%'),
      paddingVertical: hp('2%'),
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: Math.max(48, wp('12%')),
      height: Math.max(48, wp('12%')),
      borderRadius: wp('3%'),
      backgroundColor: theme.surface,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
    },
    titleContainer: {
      flex: 1,
      marginLeft: wp('4%'),
      justifyContent: 'center',
    },
    withoutBack: { marginLeft: 0 },
    title: {
      fontSize: fSize(2.25),
      fontWeight: '700',
      color: theme.textPrimary,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: fSize(1.5),
      fontWeight: '500',
      marginTop: hp('0.5%'),
    },
    bottomLine: {
      height: 1.5,
      width: '100%',
      position: 'absolute',
      bottom: 0,
      alignSelf: 'center',
    },
  });
