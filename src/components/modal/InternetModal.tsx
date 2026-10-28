import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { CustomModal } from '..';
import { fontFamily, fontSize, MaterialIcons } from '@/utils/fontIcon.utils';
import { themeType } from '@/interface/theme.type';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

type props = {
  visible: boolean;
  onClose: () => void;
};

export default function InternetModal({ visible, onClose }: props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  return (
    <CustomModal visibleModel={visible} closeModal={onClose}>
      <View style={{ alignItems: 'center', width: '100%' }}>
        <MaterialIcons name="network-check" color={themeColor.error} size={150} />
        <Text style={styles.title}>{t('ui.offlineTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('ui.offlineMessage')}
        </Text>
      </View>
    </CustomModal>
  );
}

const createStyle = (themeColor: themeType) =>
  StyleSheet.create({
    title: {
      fontFamily: fontFamily.bold,
      color: themeColor.gray,
      fontSize: fontSize.f28,
    },
    subtitle: {
      fontFamily: fontFamily.medium,
      color: themeColor.lightTextBlack,
      fontSize: fontSize.f16,
      textAlign: 'center',
    },
  });
