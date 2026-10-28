import React, { useState } from 'react';
import { TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@/utils/fontIcon.utils';
import { useThemeColor } from '@/hooks/useThemeColor';
import { sizes } from '@/theme/tokens';
import { IconButton } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';

type Props = TextInputProps & {
  name?: string;
  placeholder: string;
  errorMsg?: string;
  label?: string;
  iconName?: string;
  deafultValue?: string;
  mode?: string;
  InputStyle?: TextStyle;
  onChangeText: (value: string) => void;
  isEditable?: boolean;
  containerStyle?: ViewStyle;
  style?: ViewStyle;
  value: string;
  onClose?: () => void;
  isRequired?: boolean;
  labelStyle?: TextStyle;
  leftIconStyle?: TextStyle;
};

export default function CustomTextInput({
  name,
  errorMsg,
  label,
  iconName,
  deafultValue,
  mode: _mode,
  InputStyle,
  isEditable = true,
  containerStyle,
  style,
  onClose,
  isRequired,
  labelStyle,
  leftIconStyle,
  secureTextEntry,
  ...props
}: Props) {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const secure =
    secureTextEntry ?? name?.toLowerCase().includes('password') ?? false;
  const [visible, setVisible] = useState(false);
  return (
    <View style={style}>
      <TextInput
        {...props}
        label={label && isRequired ? t('ui.requiredLabel', { label }) : label}
        error={errorMsg}
        defaultValue={deafultValue}
        editable={isEditable}
        secureTextEntry={secure && !visible}
        style={InputStyle}
        fieldStyle={containerStyle}
        labelStyle={labelStyle}
        left={
          iconName ? (
            <Ionicons
              name={iconName as React.ComponentProps<typeof Ionicons>['name']}
              size={sizes.icon}
              color={colors.primary}
              style={leftIconStyle}
            />
          ) : null
        }
        right={
          secure ? (
            <IconButton
              accessibilityLabel={t(
                visible ? 'ui.hidePassword' : 'ui.showPassword',
              )}
              onPress={() => setVisible(!visible)}
              icon={
                <Ionicons
                  name={visible ? 'eye-off' : 'eye'}
                  size={sizes.icon}
                  color={colors.textSecondary}
                />
              }
            />
          ) : onClose && props.value?.trim() ? (
            <IconButton
              accessibilityLabel={t('ui.clear')}
              onPress={onClose}
              icon={
                <Ionicons
                  name="close-circle"
                  size={sizes.icon}
                  color={colors.textSecondary}
                />
              }
            />
          ) : null
        }
      />
    </View>
  );
}
