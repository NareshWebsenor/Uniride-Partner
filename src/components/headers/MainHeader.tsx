import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { themeType } from '@/interface/theme.type';
import { fontFamily, fontSize, Ionicons } from '@/utils/fontIcon.utils';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';
import { wp, hp } from '@/utils/responsive.utils';

import LinearGradient from 'react-native-linear-gradient';

import { useTranslation } from 'react-i18next';

interface MainHeaderProps {
  greeting?: string;
  name?: string;
  isKycVerified?: boolean;
  isBankLinked?: boolean;
  showUserIcon?: boolean;
  onNotificationPress?: () => void;
  onUserPress?: () => void;
}

const MainHeader: React.FC<MainHeaderProps> = ({
  greeting,
  name,
  isKycVerified = true,
  isBankLinked = true,
  showUserIcon = true,
  onNotificationPress,
  onUserPress,
}) => {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.leftSection}>
          <Text style={styles.greetingText}>{greeting ?? t('ui.goodMorning')}</Text>
          <Text style={styles.nameText}>{name ?? t('ui.guest')}</Text>
          
          <View style={styles.statusPill}>
            <View style={styles.statusItem}>
              <View style={[styles.dot, { backgroundColor: isKycVerified ? themeColor.green : themeColor.red }]} />
              <Text style={styles.statusText}>{t('wallet.kyc_verified')}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.statusItem}>
              <Text style={styles.statusText}>{t('wallet.bank_linked')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={themeColor.secondary} />
          </TouchableOpacity>
          
          {showUserIcon && (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={onUserPress}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={24} color={themeColor.secondary} />
            </TouchableOpacity>
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
};

const createStyle = (themeColor: themeType) =>
  StyleSheet.create({
    container: {
      backgroundColor: themeColor.transparent,
    },
    contentWrapper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: wp('5%'),
      paddingTop: hp('1.5%'),
      paddingBottom: hp('1%'),
    },
    leftSection: {
      flex: 1,
    },
    greetingText: {
      fontSize: fontSize.f14,
      fontFamily: fontFamily.medium,
      color: themeColor.secondaryS2,
    },
    nameText: {
      fontSize: fontSize.f24,
      fontFamily: fontFamily.bold,
      color: themeColor.secondary,
      marginTop: -2,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColor.surface,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginTop: 8,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: themeColor.primaryS1,
    },
    statusItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6,
    },
    statusText: {
      fontSize: fontSize.f11,
      fontFamily: fontFamily.medium,
      color: themeColor.secondary,
    },
    separator: {
      width: 1,
      height: 12,
      backgroundColor: themeColor.borderColor,
      marginHorizontal: 8,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: themeColor.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: themeColor.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    bottomLine: {
      height: 1.5,
      width: wp('100%'),
      position: 'absolute',
      bottom: 0,
      alignSelf: 'center',
    },
  });



export default MainHeader;

