import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { themeType } from '@/interface/theme.type';
import {
  DRIVER_API_URL,
  DRIVER_BASE_URL,
  DRIVER_WORKSPACE,
} from '@/service/config';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';

export type CatalogGridItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

type Props = {
  items: CatalogGridItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  fallbackIcon?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  testIDPrefix?: string;
};

export function resolveCatalogImageUrl(
  imageUrl?: string | null,
): string | undefined {
  const trimmed = imageUrl?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const baseUrl =
    (DRIVER_BASE_URL ?? '').trim().replace(/\/+$/, '') ||
    (DRIVER_API_URL ?? '').trim().replace(/\/v1\/?$/, '');
  if (!baseUrl) return undefined;
  return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export default function VehicleCatalogGrid({
  items,
  selectedId,
  onSelect,
  fallbackIcon = 'car-sport-outline',
  disabled = false,
  testIDPrefix = 'catalog-item',
}: Props) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const styles = useThemedStyles(createStyle);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (!items.length) {
    return (
      <Text tone="secondary" style={styles.empty}>
        {t('driverRegistration.vehicleCatalogEmpty')}
      </Text>
    );
  }

  return (
    <View style={styles.grid} testID={`${testIDPrefix}-grid`}>
      {items.map(item => {
        const selected = item.id === selectedId;
        const uri = !failedImages[item.id]
          ? resolveCatalogImageUrl(item.imageUrl)
          : undefined;
        return (
          <Pressable
            key={item.id}
            testID={`${testIDPrefix}-${item.id}`}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled }}
            accessibilityLabel={item.name}
            onPress={() => onSelect(item.id)}
            style={[styles.card, selected && styles.selectedCard]}
          >
            {selected ? (
              <Ionicons
                name="checkmark-circle"
                size={wp('5%')}
                color={colors.primary}
                style={styles.check}
              />
            ) : null}
            <View style={styles.mediaBox}>
              {uri ? (
                <Image
                  accessible={false}
                  source={{
                    uri,
                    ...(DRIVER_WORKSPACE
                      ? { headers: { 'X-Uniride-Workspace': DRIVER_WORKSPACE } }
                      : {}),
                  }}
                  style={styles.image}
                  resizeMode="contain"
                  onError={() =>
                    setFailedImages(prev => ({ ...prev, [item.id]: true }))
                  }
                />
              ) : (
                <View style={styles.iconFallback}>
                  <Ionicons
                    name={fallbackIcon}
                    size={wp('9%')}
                    color={selected ? colors.primary : colors.textSecondary}
                  />
                </View>
              )}
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    empty: { paddingVertical: hp('2%') },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: hp('1.6%'),
    },
    card: {
      width: '48%',
      minHeight: Math.max(48, hp('17%')),
      borderRadius: wp('4%'),
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.surfaceRaised,
      paddingHorizontal: wp('3%'),
      paddingVertical: hp('1.6%'),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: hp('1%'),
    },
    selectedCard: {
      borderWidth: 2,
      borderColor: theme.primary,
      backgroundColor: theme.tabActiveBackground,
    },
    check: {
      position: 'absolute',
      top: hp('0.9%'),
      right: wp('2.2%'),
      zIndex: 1,
    },
    mediaBox: {
      width: '100%',
      height: hp('8.5%'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: wp('2.5%'),
    },
    iconFallback: {
      width: wp('15%'),
      height: wp('15%'),
      borderRadius: 999,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: fSize(1.65),
      fontWeight: '600',
      textAlign: 'center',
    },
  });
