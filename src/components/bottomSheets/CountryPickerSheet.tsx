import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheet } from '@/components';
import { countryData, ICountry } from '@/utils/countryData';
import { themeType } from '@/interface/theme.type';
import { fontSize, fontFamily, MaterialIcons } from '@/utils/fontIcon.utils';
import { height } from '@/utils/responsive.utils';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

interface CountryPickerSheetProps {
  sheetRef: any;
  onSelect: (country: ICountry) => void;
  selectedCountry: ICountry;
}

const CountryPickerSheet: React.FC<CountryPickerSheetProps> = ({
  sheetRef,
  onSelect,
  selectedCountry,
}) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery) return countryData;
    const lowerQuery = searchQuery.toLowerCase();
    return countryData.filter(
      item =>
        item?.name?.toLowerCase().includes(lowerQuery) ||
        item?.dialCode?.includes(lowerQuery) ||
        item?.code?.toLowerCase().includes(lowerQuery),
    );
  }, [searchQuery]);

  const renderItem = ({ item }: { item: ICountry }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        selectedCountry?.code === item?.code && styles.selectedItem,
      ]}
      onPress={() => {
        onSelect(item);
        sheetRef.current?.close();
      }}
    >
      <Text style={styles.flagText}>{item?.flag}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.countryName}>{item?.name}</Text>
        <Text style={styles.dialCode}>{item?.dialCode}</Text>
      </View>
      {selectedCountry?.code === item?.code && (
        <MaterialIcons name="check" size={20} color={themeColor.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <BottomSheet sheetRef={sheetRef} sheetHeight={height * 0.7}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('ui.selectCountry')}</Text>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={themeColor.textS2} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('ui.searchCountry')}
            placeholderTextColor={themeColor.textS2}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item?.code}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </BottomSheet>
  );
};

export default CountryPickerSheet;

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.surface,
    },
    title: {
      fontSize: fontSize.f18,
      fontFamily: fontFamily.bold,
      color: theme.text,
      marginBottom: 15,
      textAlign: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundColorS1, // Light background for search
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginBottom: 15,
    },
    searchInput: {
      flex: 1,
      fontSize: fontSize.f14,
      fontFamily: fontFamily.medium,
      color: theme.text,
      marginLeft: 10,
      padding: 0,
    },
    listContent: {
      paddingBottom: 20,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    selectedItem: {
      backgroundColor: theme.backgroundColorS1, // Highlight selected
    },
    flagText: {
      fontSize: 24,
      marginRight: 15,
      color: theme.text,
    },
    textContainer: {
      flex: 1,
    },
    countryName: {
      fontSize: fontSize.f16,
      fontFamily: fontFamily.medium,
      color: theme.text,
    },
    dialCode: {
      fontSize: fontSize.f14,
      fontFamily: fontFamily.regular,
      color: theme.textS2,
    },
  });
