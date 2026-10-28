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
  variant?: 'underline' | 'pill';
};

export default function TabHeader({
  tabData,
  onTabChange,
  currentTab,
  variant = 'underline',
}: props) {
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();

  // Pill Container Style
  const containerStyle =
    variant === 'pill'
      ? styles.pillContainer
      : { flexDirection: 'row' as 'row' };

  return (
    <View style={containerStyle}>
      {tabData.map((item, index) => {
        const isSelected = currentTab === item.value;

        if (variant === 'pill') {
          return (
            <Pressable
              key={index}
              onPress={() => onTabChange(item.value)}
              style={[
                styles.pillTab,
                {
                  backgroundColor: isSelected ? themeColor.primary : themeColor.transparent, // Match design blue
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: isSelected ? themeColor.onPrimary : themeColor.primary },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }

        // Default Underline Style
        return (
          <Pressable
            key={index}
            onPress={() => onTabChange(item.value)}
            style={[
              styles.tab,
              {
                borderColor: isSelected
                  ? themeColor.primary
                  : themeColor.grayS2,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: isSelected ? themeColor.primary : themeColor.textPrimary },
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
    tab: {
      width: '33.33%',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 3,
    },
    tabText: {
      fontSize: fontSize.f14,
      fontFamily: fontFamily.bold,
    },
    // Pill Styles
    pillContainer: {
      flexDirection: 'row',
      backgroundColor: themeColor.surfaceRaised, // Light blue/gray bg from image
      borderRadius: 25,
      padding: 5,
      justifyContent: 'space-between',
      marginHorizontal: 10,
      marginVertical: 10,
    },
    pillTab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 20,
    },
    pillText: {
      fontSize: fontSize.f14,
      fontFamily: fontFamily.semiBold,
    },
  });
