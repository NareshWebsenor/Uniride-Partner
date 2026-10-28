import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import React from 'react';
import ErrorText from '@/components/layouts/error/ErrorText';
import { themeType } from '@/interface/theme.type';
import { fontFamily, fontSize } from '@/utils/fontIcon.utils';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

type props = TextInputProps & {
  placeHolder?: string;
  onChangeText: (e: string) => void;
  numberOfLines?: number;
  defaultValue?: string;
  value: string;
  errorMsg: string;
  style?: ViewStyle;
  label?: string;
  labelStyle?: TextStyle;
  isRequired?: boolean;
  containerStyle?: ViewStyle;
};

const TextArea = ({
  onChangeText,
  numberOfLines,
  placeHolder,
  defaultValue,
  value,
  errorMsg,
  style,
  label,
  labelStyle,
  isRequired = false,
  containerStyle,
}: props) => {
  const themeColor = useThemeColor();
  const styles = useThemedStyles(createStyle);
  return (
    <View style={[style]}>
      {label !== '' ? (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {isRequired && <Text style={{ color: themeColor.red }}>*</Text>}
        </Text>
      ) : null}
      <View style={[styles.container, containerStyle]}>
        <TextInput
          value={value}
          onChangeText={e => {
            // setText(e);
            onChangeText(e);
          }}
          style={styles.inputStyle}
          // numberOfLines={5}
          scrollEnabled
          multiline
          numberOfLines={Platform.OS === 'ios' ? null : 5}
          minHeight={Platform.OS === 'ios' ? 20 * 5 : null}
          placeholder={placeHolder}
          defaultValue={defaultValue ?? ''}
          placeholderTextColor={themeColor.gray}
        />
      </View>
      {errorMsg != '' && <ErrorText errorMsg={errorMsg} />}
    </View>
  );
};

export default TextArea;

const createStyle = (Colors: themeType) =>
  StyleSheet.create({
    container: {
      borderRadius: 8,
      borderColor: Colors.borderColor,
      borderWidth: 1,
      shadowColor: Colors.shadow,
      backgroundColor: Colors.backgroundColor,
      alignItems: 'flex-start',
    },
    inputStyle: {
      borderColor: Colors.error,
      padding: 10,
      borderRadius: 7,
      textAlignVertical: 'top',
      fontFamily: fontFamily.regular,
      fontSize: fontSize.f14,
      color: Colors.text,
      height: 130,
      width: '100%',
    },
    label: {
      color: Colors.text,
      fontFamily: fontFamily.semiBold,
      fontSize: fontSize.f16,
      alignSelf: 'flex-start',
      marginLeft: 4,
    },
  });
