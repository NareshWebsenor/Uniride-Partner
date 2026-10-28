import React, { useEffect, useState } from 'react';
import { TextStyle, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@/components/ui/Dropdown';

type Item = string | Record<string, unknown>;
type Props = {
  data: string[] | object[];
  placeHolder: string;
  onSelect: (item: any) => void;
  error?: string;
  defaultValueIndex?: number;
  labelStyle?: TextStyle;
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
  containerStyle?: ViewStyle;
  label?: string;
  isRequired?: boolean;
  disabled?: boolean;
  defaultValue?: Item;
  isSearchable?: boolean;
};

function itemLabel(item: Item): string {
  if (typeof item === 'string') {
    return item;
  }
  return String(item.name ?? item.label ?? item.value ?? item.title ?? '');
}

export default function LegacyDropdown({
  data,
  placeHolder,
  onSelect,
  defaultValue,
  defaultValueIndex,
  containerStyle,
  label,
  isRequired,
  isSearchable = true,
  ...props
}: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(defaultValue);
  const [selectedIndex, setSelectedIndex] = useState(defaultValueIndex);
  useEffect(() => {
    setSelected(defaultValue);
  }, [defaultValue]);
  useEffect(() => {
    setSelectedIndex(defaultValueIndex);
  }, [defaultValueIndex]);
  const items = data as Item[];
  const valueIndex =
    selected === undefined
      ? selectedIndex
      : items.findIndex(item => itemLabel(item) === itemLabel(selected));
  const translatedLabel = (item: Item) => {
    const labelValue = itemLabel(item);
    const optionKey = `ui.optionLabels.${labelValue}`;
    return t(optionKey, { defaultValue: labelValue });
  };
  return (
    <Dropdown
      {...props}
      label={label && isRequired ? t('ui.requiredLabel', { label }) : label}
      placeholder={t(`ui.optionLabels.${placeHolder}`, {
        defaultValue: placeHolder,
      })}
      style={containerStyle}
      searchable={isSearchable}
      options={items.map((item, index) => ({
        label: translatedLabel(item),
        value: String(index),
      }))}
      value={
        valueIndex !== undefined && valueIndex >= 0
          ? String(valueIndex)
          : undefined
      }
      onValueChange={value => {
        const index = Number(value);
        setSelected(items[index]);
        setSelectedIndex(index);
        onSelect(items[index]);
      }}
    />
  );
}
