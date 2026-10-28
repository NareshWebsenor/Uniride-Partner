import { logger } from '@/utils/logger';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import React, { useRef } from 'react';
import BottomSheet from '@/components/bottomSheets/BottomSheet';
import {
  Entypo,
  Feather,
  fontFamily,
  fontSize,
  Ionicons,
} from '@/utils/fontIcon.utils';
import { themeType } from '@/interface/theme.type';
import { height, width } from '@/utils/responsive.utils';
import ImagePicker from 'react-native-image-crop-picker';
import { CheckMediaPermissions } from '@/utils/permission.utils';
import { useTranslation } from 'react-i18next';
import FastImage from 'react-native-fast-image';
import ErrorText from '@/components/layouts/error/ErrorText';
import { IMAGE_MAX_SIZE } from '@/utils/validations.utils';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

type dataType = { uri: string | undefined; mime: string; size: number };

type props = {
  type: 'PROFILE' | 'DOCUMENT' | 'EDIT' | 'CUSTOM';
  style?: ViewStyle;
  multiple?: boolean;
  minFile?: number;
  maxFile?: number;
  onSelectImage: (data: any) => void;
  mediaType?: 'photo' | 'video' | 'any';
  title?: string;
  value?: string;
  onDelete?: () => void;
  errorMsg?: string;
  children?: React.ReactNode;
};

export default function CustomImagePicker({
  type,
  style,
  maxFile,
  minFile,
  multiple,
  onSelectImage,
  mediaType = 'photo',
  title,
  value,
  onDelete,
  errorMsg,
  children,
}: props) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  const bottomSheetRef = useRef<any>(null);
  const { t } = useTranslation();

  const renderContent = () => {
    switch (type) {
      case 'CUSTOM':
        return (
          <Pressable
            style={style}
            onPress={() => bottomSheetRef.current?.open()}
          >
            {children}
          </Pressable>
        );
      case 'PROFILE':
        return (
          <Pressable
            style={[styles.cameraProfile, style]}
            onPress={() => bottomSheetRef.current?.open()}
          >
            <Ionicons
              name="camera-outline"
              size={25}
              color={themeColor.onPrimary}
            />
          </Pressable>
        );
      case 'EDIT':
        return (
          <Pressable
            style={[styles.cameraProfile, style]}
            onPress={() => {
              if (value) {
                onDelete?.();
                return;
              }
              bottomSheetRef.current?.open();
            }}
          >
            {value ? (
              <Feather name="trash-2" size={20} color={themeColor.onPrimary} />
            ) : (
              <Feather name="camera" size={20} color={themeColor.onPrimary} />
            )}
          </Pressable>
        );
      case 'DOCUMENT':
        return (
          <>
            <View style={[styles.documentContainer, style]}>
              <View style={styles.documentInnerContainer}>
                {value ? (
                  <View style={styles.previewContainer}>
                    <FastImage
                      source={{ uri: value }}
                      style={styles.documentImage}
                      resizeMode="cover"
                    />
                    <Pressable style={styles.removeButton} onPress={onDelete}>
                      <Entypo
                        name="circle-with-cross"
                        size={24}
                        color={themeColor.red}
                      />
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={50}
                      color={themeColor.secondary}
                    />
                    <Text style={styles.documentText}>
                      {t('ui.selectFiles')}
                    </Text>

                    <Pressable
                      style={styles.selectFileBtn}
                      onPress={() => {
                        logger.debug('image_picker.opened', { scope: 'ui' });
                        bottomSheetRef.current?.open();
                      }}
                    >
                      <Text style={styles.selectFileBtnText}>{t('ui.selectFile')}</Text>
                    </Pressable>
                    <Text
                      style={styles.maxSizeText}
                    >{t('ui.maxFileSize', { size: IMAGE_MAX_SIZE })}</Text>
                  </>
                )}
              </View>
            </View>
            {errorMsg && <ErrorText errorMsg={errorMsg} />}
          </>
        );

      default:
        return null;
    }
  };
  const onSelect = async (type: 'CAMERA' | 'GALLARY') => {
    const value = await CheckMediaPermissions();
    const { status } = value || {};
    if (status) {
      if (type == 'CAMERA') {
        onClose();
        setTimeout(() => {
          cammeraImage();
        }, 500);
      } else if (type == 'GALLARY') {
        onClose();
        setTimeout(() => {
          galleryImage();
        }, 500);
      } else {
        onClose();
      }
    }
  };

  const galleryImage = () => {
    ImagePicker.openPicker({
      multiple: multiple,
      cropping: mediaType === 'photo' ? true : false,
      compressImageQuality: 1,
      freeStyleCropEnabled: mediaType === 'photo' ? true : false,
      minFiles: minFile,
      maxFiles: maxFile,
      immersiveMode: false,
      mediaType: mediaType,
    })
      .then((image: any | []) => {
        if (!multiple) {
          let Obj: dataType = {
            uri: Platform.OS == 'android' ? image?.path : image?.sourceURL,
            mime: image.mime,
            size: image.size / (1024 * 1024),
          };
          onSelectImage(Obj);
        } else {
          const result = image?.map((ele: any, ind: any) => {
            return {
              uri: Platform.OS == 'android' ? ele.path : ele.sourceURL,
              mime: ele.mime,
              size: ele.size / (1024 * 1024),
            };
          });
          onSelectImage(result);
        }
      })
      .catch(() => {
        logger.warn('image_picker.gallery_failed', { scope: 'ui' });
      });
  };

  const cammeraImage = () => {
    ImagePicker.openCamera({
      cropping: true,
      freeStyleCropEnabled: true,
      compressImageQuality: 1,
      mediaType: mediaType,
    })
      .then((image: any) => {
        if (!multiple) {
          let Obj = {
            uri: Platform.OS == 'android' ? image.path : image.sourceURL,
            mime: image.mime,
            size: image.size / (1024 * 1024),
          };
          onSelectImage(Obj);
        } else {
          const result = image?.map((ele: any, ind: any) => {
            return {
              uri: Platform.OS == 'android' ? ele.path : ele.sourceURL,
              mime: ele.mime,
              size: image.size / (1024 * 1024),
            };
          });
          onSelectImage(result);
        }
      })
      .catch(() => {
        logger.warn('image_picker.camera_failed', { scope: 'ui' });
      });
  };
  const onClose = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      <BottomSheet sheetRef={bottomSheetRef} sheetHeight={height / 4}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.sheetTitle}>{t('common.chooseOption')}</Text>
          <Text
            style={[styles.sheetOptions, { color: themeColor.primary, marginTop: 20 }]}
            onPress={() => onSelect('GALLARY')}
          >
            {t('common.gallary')}
          </Text>
          <Text
            style={[styles.sheetOptions, { color: themeColor.primary }]}
            onPress={() => onSelect('CAMERA')}
          >
            {t('common.camera')}
          </Text>
          <Text
            style={[styles.sheetOptions, { color: themeColor.red }]}
            onPress={onClose}
          >
            {t('buttons.cancel')}
          </Text>
        </View>
      </BottomSheet>
    </View>
  );
}

const createStyle = (themeColor: themeType) =>
  StyleSheet.create({
    container: {
      // borderWidth: 1,
    },
    cameraProfile: {
      width: 45,
      height: 45,
      borderRadius: 45,
      borderWidth: 2,
      borderColor: themeColor.surface,
      backgroundColor: themeColor.brown,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetTitle: {
      fontFamily: fontFamily.bold,
      color: themeColor.text,
      fontSize: fontSize.f18,
    },
    sheetOptions: {
      fontFamily: fontFamily.bold,
      color: themeColor.text,
      fontSize: fontSize.f16,
      marginTop: 10,
      width: '30%',
      textAlign: 'center',
    },
    contactContainer: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      minHeight: 200,
    },
    contactSubContainer: { paddingVertical: 20, alignItems: 'center' },
    text: {
      fontFamily: fontFamily.semiBold,
      color: themeColor.gray,
      fontSize: fontSize.f16,
      marginTop: 10,
    },
    editIcon: {
      backgroundColor: themeColor.textPrimary,
      width: 50,
    },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      width: '60%',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: themeColor.primary,
      paddingVertical: 7,
      borderRadius: 50,
      marginTop: 20,
      paddingHorizontal: 30,
    },
    btnText: {
      fontSize: fontSize.f18,
      color: themeColor.primary,
      fontFamily: fontFamily.regular,
    },
    title: {
      fontSize: fontSize.f16,
      color: themeColor.gray,
      fontFamily: fontFamily.regular,
      textAlign: 'center',
    },
    image: {
      width: width / 1.5,
      height: width / 3,
      marginVertical: 20,
      borderRadius: 10,
    },
    documentContainer: {
      width: '100%',
      aspectRatio: 1.2, // Make it roughly rectangular/square as per image
      borderWidth: 1.5,
      borderColor: themeColor.secondary, // dashed border color
      borderStyle: 'dashed',
      borderRadius: 20,
      backgroundColor: themeColor.backgroundColor, // faint gray background
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    documentInnerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: 20,
    },
    documentText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.f16,
      color: themeColor.text,
      textAlign: 'center',
      marginTop: 20,
      lineHeight: 24,
    },
    selectFileBtn: {
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 40,
      borderWidth: 1,
      borderColor: themeColor.secondary,
      borderRadius: 12,
      backgroundColor: themeColor.transparent,
      minWidth: 200,
      alignItems: 'center',
    },
    selectFileBtnText: {
      color: themeColor.secondary,
      fontFamily: fontFamily.medium,
      fontSize: fontSize.f16,
    },
    maxSizeText: {
      marginTop: 15,
      color: themeColor.textSecondary,
      fontSize: fontSize.f14,
      fontFamily: fontFamily.regular,
      textAlign: 'center',
    },
    documentImage: {
      width: '100%',
      height: '100%',
      borderRadius: 10,
    },
    previewContainer: {
      width: '90%',
      height: '90%',
      position: 'relative',
    },
    removeButton: {
      position: 'absolute',
      top: -10,
      right: -10,
      backgroundColor: themeColor.surface,
      borderRadius: 15,
    },
  });
