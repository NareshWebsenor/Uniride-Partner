import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SearchInput } from '@/components/ui/TextInput';
import { IconButton } from '@/components/ui/Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@/utils/fontIcon.utils';
import { sizes, spacing } from '@/theme/tokens';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  isFilterRequired?: boolean;
  onFilterPress?: () => void;
  style?: ViewStyle;
  placeHolder?: string;
  disabled?: boolean;
  onPress?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export default function SearchBox({
  isFilterRequired,
  onFilterPress,
  style,
  placeHolder,
  disabled,
  onPress,
  ...props
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColor();
  return (
    <Pressable onPress={onPress} style={[styles.row, style]}>
      <SearchInput
        {...props}
        editable={!disabled}
        placeholder={placeHolder ?? t('ui.search')}
        containerStyle={styles.input}
      />
      {isFilterRequired ? (
        <IconButton
          accessibilityLabel={t('ui.filter')}
          onPress={onFilterPress}
          icon={
            <Ionicons name="options" size={sizes.icon} color={colors.primary} />
          }
        />
      ) : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { flex: 1 },
});
