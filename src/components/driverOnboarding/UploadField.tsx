import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import { IconButton } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import {
  useAppTranslation,
  type TranslationKey,
} from '@/hooks/useAppTranslation';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { UploadFieldProps } from '@/interface/driverOnboarding.type';
import type { themeType } from '@/interface/theme.type';
import { MAX_ONBOARDING_FILE_BYTES } from '@/utils/driverOnboarding';
import { Ionicons } from '@/utils/fontIcon.utils';
import { logger } from '@/utils/logger';
import { fSize, hp, wp } from '@/utils/responsive.utils';

export default function UploadField({
  label,
  actionLabel,
  value,
  onChange,
  imagesOnly,
  large,
  testID,
  error,
}: UploadFieldProps) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const styles = useThemedStyles(createStyle);
  const [failure, setFailure] = useState<TranslationKey>();
  const [busy, setBusy] = useState(false);
  const picking = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const choose = async () => {
    if (picking.current) return;
    picking.current = true;
    setBusy(true);
    setFailure(undefined);
    try {
      const [file] = await pick({
        mode: 'open',
        requestLongTermAccess: false,
        type: imagesOnly ? [types.images] : [types.images, types.pdf],
        allowMultiSelection: false,
      });
      if (!mounted.current) return;
      if (!file.uri || !file.size || file.size < 0 || file.error) {
        setFailure('driverOnboarding.upload.unreadable');
      } else if (file.size > MAX_ONBOARDING_FILE_BYTES) {
        setFailure('driverOnboarding.upload.tooLarge');
      } else if (
        !file.type?.startsWith('image/') &&
        (imagesOnly || file.type !== 'application/pdf')
      ) {
        setFailure(
          imagesOnly
            ? 'driverOnboarding.upload.invalidImage'
            : 'driverOnboarding.upload.invalidType',
        );
      } else {
        onChange({
          uri: file.uri,
          name: file.name ?? label,
          mime: file.type ?? '',
          size: file.size,
        });
        logger.debug('driver_onboarding.file_selected', { scope: 'local' });
      }
    } catch (caught: unknown) {
      if (
        mounted.current &&
        !(
          isErrorWithCode(caught) &&
          caught.code === errorCodes.OPERATION_CANCELED
        )
      ) {
        setFailure('driverOnboarding.upload.failed');
        logger.warn('driver_onboarding.file_selection_failed', {
          scope: 'local',
        });
      }
    } finally {
      picking.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text tone="secondary" style={styles.required}>
          {t('driverOnboarding.required')}
        </Text>
      </View>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={
          value
            ? t('driverOnboarding.upload.replace', { label })
            : `${label}. ${actionLabel}`
        }
        accessibilityHint={t(
          imagesOnly
            ? 'driverOnboarding.upload.imagesHint'
            : 'driverOnboarding.upload.chooseHint',
        )}
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={choose}
        style={[styles.box, large && styles.large]}
      >
        {value?.mime.startsWith('image/') ? (
          <Image
            source={{ uri: value.uri }}
            style={styles.preview}
            resizeMode="contain"
            accessibilityLabel={t('driverOnboarding.upload.preview', { label })}
          />
        ) : (
          <Ionicons
            name={value ? 'document-text-outline' : 'camera-outline'}
            size={wp('6%')}
            color={colors.textPrimary}
          />
        )}
        <Text style={styles.action}>
          {busy
            ? t('driverOnboarding.upload.selecting')
            : value?.name ?? actionLabel}
        </Text>
        <Text tone="secondary" style={styles.hint}>
          {t(
            value
              ? 'driverOnboarding.upload.replace'
              : imagesOnly
              ? 'driverOnboarding.upload.imagesHint'
              : 'driverOnboarding.upload.chooseHint',
            { label },
          )}
        </Text>
      </Pressable>
      <View style={styles.labelRow}>
        <Text tone="secondary" style={styles.hint}>
          {t(
            imagesOnly
              ? 'driverOnboarding.upload.imageLimit'
              : 'driverOnboarding.upload.limit',
          )}
        </Text>
        {value ? (
          <IconButton
            testID={`${testID}-remove`}
            accessibilityLabel={t('driverOnboarding.upload.remove', { label })}
            disabled={busy}
            onPress={() => {
              setFailure(undefined);
              onChange(undefined);
            }}
            icon={
              <Ionicons
                name="trash-outline"
                size={wp('5%')}
                color={colors.error}
              />
            }
          />
        ) : null}
      </View>
      {failure || error ? (
        <Text tone="error" variant="caption" accessibilityLiveRegion="polite">
          {failure ? t(failure) : error}
        </Text>
      ) : null}
    </View>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    wrapper: { gap: hp('0.8%') },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: wp('2%'),
    },
    label: { flex: 1, fontSize: fSize(1.7), fontWeight: '500' },
    required: { fontSize: fSize(1.3) },
    box: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.border,
      borderRadius: wp('3%'),
      minHeight: hp('14%'),
      padding: wp('3%'),
      alignItems: 'center',
      justifyContent: 'center',
      gap: hp('0.8%'),
    },
    large: { minHeight: hp('23%') },
    preview: { width: '100%', height: hp('12%') },
    action: { fontSize: fSize(1.55), textAlign: 'center', flexShrink: 1 },
    hint: { fontSize: fSize(1.3), flexShrink: 1, textAlign: 'center' },
  });
