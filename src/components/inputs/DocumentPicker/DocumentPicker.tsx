import { logger } from '@/utils/logger';
import { StyleSheet, Text, View, Pressable, ViewStyle } from 'react-native';
import React from 'react';
import { themeType } from '@/interface/theme.type';
import { fontFamily, fontSize, Ionicons, Entypo } from '@/utils/fontIcon.utils';
import { pick, types } from '@react-native-documents/picker';
import ErrorText from '@/components/layouts/error/ErrorText';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

type Props = {
  type?: 'DOCUMENT';
  title?: string;
  value?: any;
  onSelect: (file: any) => void;
  error?: string;
  allowedTypes?: string[];
  style?: ViewStyle;
};

export default function DocumentPicker({
  type = 'DOCUMENT',
  title,
  value,
  onSelect,
  error,
  allowedTypes = [types.pdf, types.images, types.doc, types.docx],
  style,
}: Props) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  const { t } = useTranslation();

  const handleDocumentSelect = async () => {
    try {
      const res = await pick({
        type: allowedTypes,
      });
      logger.debug('document.selected', { scope: 'ui' });
      onSelect(res[0]);
    } catch {
      logger.warn('document.selection_failed', { scope: 'ui' });
    }
  };

  const handleDelete = () => {
    onSelect(null);
  };

  const renderContent = () => {
    switch (type) {
      case 'DOCUMENT':
        return (
          <View style={[styles.documentContainer, style]}>
            <View style={styles.documentInnerContainer}>
              {value ? (
                <View style={styles.previewContainer}>
                  <View style={styles.fileInfo}>
                    <Ionicons
                      name="document-text-outline"
                      size={40}
                      color={themeColor.primary}
                    />
                    <Text style={styles.fileName} numberOfLines={1}>
                      {value.name}
                    </Text>
                  </View>
                  <Pressable style={styles.removeButton} onPress={handleDelete}>
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
                    color={themeColor.primary}
                  />
                  <Text style={styles.documentText}>
                    {t('common.selectFilesDragDrop')}
                  </Text>

                  <Pressable
                    style={styles.selectFileBtn}
                    onPress={handleDocumentSelect}
                  >
                    <Text style={styles.selectFileBtnText}>
                      {t('common.selectFile')}
                    </Text>
                  </Pressable>
                  <Text style={styles.maxSizeText}>{t('common.max50MB')}</Text>
                </>
              )}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View>
      {title && <Text style={styles.label}>{title}</Text>}
      {renderContent()}
      {error && <ErrorText errorMsg={error} />}
    </View>
  );
}

const createStyle = (themeColor: themeType) =>
  StyleSheet.create({
    label: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.f14,
      color: themeColor.textPrimary,
      marginBottom: 10,
    },
    documentContainer: {
      width: '100%',
      //   aspectRatio: 1.5,
      borderWidth: 1.5,
      borderColor: themeColor.textSecondary, // dashed border color
      borderStyle: 'dashed',
      borderRadius: 20,
      backgroundColor: themeColor.backgroundColor, // faint gray background
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 30,
      //   marginTop: 10,
    },
    documentInnerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingHorizontal: 20,
    },
    documentText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.f16,
      color: themeColor.primary,
      textAlign: 'center',
      marginTop: 20,
      lineHeight: 24,
    },
    selectFileBtn: {
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 40,
      borderWidth: 1,
      borderColor: themeColor.primary,
      borderRadius: 12,
      backgroundColor: themeColor.transparent,
      minWidth: 200,
      alignItems: 'center',
    },
    selectFileBtnText: {
      color: themeColor.primary,
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
    previewContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    fileInfo: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    fileName: {
      marginTop: 10,
      fontFamily: fontFamily.medium,
      fontSize: fontSize.f14,
      color: themeColor.text,
      maxWidth: 200,
    },
    removeButton: {
      position: 'absolute',
      top: -20,
      right: 0,
      backgroundColor: themeColor.surface,
      borderRadius: 15,
    },
  });
