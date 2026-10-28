import { useTranslation } from 'react-i18next';
import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { themeType } from '@/interface/theme.type';
import { fontSize, fontFamily, Ionicons } from '@/utils/fontIcon.utils';
import { ICountry } from '@/utils/countryData';
import CountryPickerSheet from '@/components/bottomSheets/CountryPickerSheet';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  selectedCountry: ICountry;
  onSelectCountry: (country: ICountry) => void;
  errorMsg?: string;
  placeholder?: string;
  containerStyle?: ViewStyle;
  editable?: boolean;
  label?: string;
  labelStyle?: TextStyle;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  selectedCountry,
  onSelectCountry,
  errorMsg,
  placeholder,
  containerStyle,
  editable = true,
  label,
  labelStyle,
}) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();
  const countrySheetRef = useRef<any>(null);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.countryBox}
          onPress={() => countrySheetRef.current?.open()}
          activeOpacity={0.7}
        >
          <Text style={styles.dialCode}>{selectedCountry?.dialCode}</Text>
          <Ionicons
            name="chevron-down"
            size={fontSize.f14}
            color={themeColor.secondary}
          />
        </TouchableOpacity>

        <View style={styles.phoneInputBox}>
          <TextInput
            style={styles.textInput}
            placeholder={placeholder ?? t('ui.phonePlaceholder')}
            placeholderTextColor={themeColor.textS2}
            value={value}
            onChangeText={onChangeText}
            keyboardType="phone-pad"
            maxLength={10}
            editable={editable}
          />
        </View>
      </View>
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <CountryPickerSheet
        sheetRef={countrySheetRef}
        onSelect={onSelectCountry}
        selectedCountry={selectedCountry}
      />
    </View>
  );
};

export default PhoneInput;

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    label: {
      color: theme.textS2,
      fontFamily: fontFamily.medium,
      fontSize: fontSize.f14,
      marginBottom: 12,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    countryBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primaryS3,
      height: 60,
      paddingHorizontal: 12,
      borderRadius: 15,
      marginRight: 12,
      overflow: 'hidden',
    },
    dialCode: {
      fontSize: fontSize.f14,
      fontFamily: fontFamily.medium,
      color: theme.secondary,
      marginRight: 4,
    },
    phoneInputBox: {
      flex: 1,
      height: 60,
      backgroundColor: theme.backgroundColorS1,
      borderWidth: 1,
      borderColor: theme.overlay,
      borderRadius: 15,
      paddingHorizontal: 15,
      justifyContent: 'center',
    },
    textInput: {
      fontSize: fontSize.f14,
      fontFamily: fontFamily.medium,
      color: theme.secondary,
      paddingVertical: 0,
      height: '100%',
    },
    errorText: {
      color: theme.red,
      fontSize: fontSize.f12,
      fontFamily: fontFamily.medium,
      marginTop: 4,
    },
  });
