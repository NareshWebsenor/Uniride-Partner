import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { themeType } from '@/interface/theme.type';
import { fontFamily, fontSize } from '@/utils/fontIcon.utils';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

type props = {
  tabData: Array<{ label: string; value: string }>;
  onTabChange: (value: string) => void;
  currentTab: string;
};

export default function BottomTab({
  tabData = [],
  onTabChange,
  currentTab,
}: props) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();

  return (
    <View style={styles.bottomTab}>
      {tabData?.map((item: any, index: number) => {
        const Icon = item?.icon;
        const isSelected = item.value === currentTab;
        return (
          <Pressable
            style={styles.tabItem}
            key={index}
            onPress={() => onTabChange(item)}
          >
            <Icon
              width={30}
              height={30}
              fill={isSelected ? themeColor.primary : themeColor.grayS1}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isSelected ? themeColor.primary : themeColor.grayS1,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyle = (themeColor: themeType) =>
  StyleSheet.create({
    bottomTab: {
      height: 100,
      backgroundColor: themeColor.surface,
      marginBottom: -30,
      flexDirection: 'row',
      paddingHorizontal: 16,
      justifyContent: 'space-evenly',
      borderTopWidth: 1,
      borderColor: themeColor.grayS2,
      paddingTop: 7,
    },
    tabItem: {
      alignSelf: 'flex-start',
      alignItems: 'center',
      width: '32%',
    },
    tabLabel: {
      fontSize: fontSize.f16,
      fontFamily: fontFamily.medium,
    },
  });
