import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet, Text } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { themeType } from '@/interface/theme.type';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';

type UploadSourceSheetProps = {
  visible: boolean;
  hasFile: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onDelete: () => void;
};

export default function UploadSourceSheet({
  visible,
  hasFile,
  onClose,
  onCamera,
  onGallery,
  onDelete,
}: UploadSourceSheetProps) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const styles = useThemedStyles(createStyle);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      showCloseButton={false}
      edgeToEdge
    >
      <View style={styles.sheetBody} testID="upload-source-sheet">
        <View style={styles.handle} />
        <Pressable
          testID="upload-option-camera"
          accessibilityRole="button"
          accessibilityLabel={t('driverRegistration.uploads.cameraOption')}
          onPress={onCamera}
          style={styles.optionCard}
        >
          <View style={[styles.iconCircle, styles.primaryCircle]}>
            <Ionicons
              name="camera-outline"
              size={wp('5.5%')}
              color={colors.descriptionText}
            />
          </View>
          <Text style={styles.optionLabel}>
            {t('driverRegistration.uploads.cameraOption')}
          </Text>
        </Pressable>

        <Pressable
          testID="upload-option-gallery"
          accessibilityRole="button"
          accessibilityLabel={t('driverRegistration.uploads.galleryOption')}
          onPress={onGallery}
          style={styles.optionCard}
        >
          <View style={[styles.iconCircle, styles.primaryCircle]}>
            <Ionicons
              name="image-outline"
              size={wp('5.5%')}
              color={colors.descriptionText}
            />
          </View>
          <Text style={styles.optionLabel}>
            {t('driverRegistration.uploads.galleryOption')}
          </Text>
        </Pressable>

        {hasFile ? (
          <Pressable
            testID="upload-option-delete"
            accessibilityRole="button"
            accessibilityLabel={t('driverRegistration.uploads.deletePhoto')}
            onPress={onDelete}
            style={[styles.optionCard, styles.deleteCard]}
          >
            <View style={[styles.iconCircle, styles.deleteCircle]}>
              <Ionicons
                name="trash-outline"
                size={wp('5.5%')}
                color={colors.error}
              />
            </View>
            <Text style={[styles.optionLabel, styles.deleteLabel]}>
              {t('driverRegistration.uploads.deletePhoto')}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.divider} />

        <Pressable
          testID="upload-option-cancel"
          accessibilityRole="button"
          accessibilityLabel={t('ui.cancel')}
          onPress={onClose}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelLabel}>{t('ui.cancel')}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    sheetBody: {
      gap: hp('1.5%'),
      paddingHorizontal: wp('1%'),
    },
    handle: {
      width: wp('11%'),
      height: hp('0.5%'),
      borderRadius: 999,
      backgroundColor: theme.border,
      alignSelf: 'center',
      marginBottom: hp('0.6%'),
    },
    optionCard: {
      minHeight: Math.max(48, hp('7.4%')),
      borderRadius: wp('3.5%'),
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: wp('3.5%'),
      paddingVertical: hp('1.1%'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp('4%'),
    },
    iconCircle: {
      width: Math.max(40, wp('10.5%')),
      height: Math.max(40, wp('10.5%')),
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryCircle: {
      backgroundColor: theme.tabActiveBackground,
    },
    optionLabel: {
      fontSize: fSize(1.85),
      fontWeight: '500',
    },
    deleteCard: {
      backgroundColor: theme.errorSurface,
      borderColor: theme.errorSurface,
    },
    deleteCircle: {
      backgroundColor: theme.redS1,
    },
    deleteLabel: {
      color: theme.error,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginTop: hp('0.5%'),
    },
    cancelButton: {
      minHeight: Math.max(48, hp('5.5%')),
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelLabel: {
      fontSize: fSize(1.85),
      fontWeight: '500',
      color: theme.error,
    },
  });
