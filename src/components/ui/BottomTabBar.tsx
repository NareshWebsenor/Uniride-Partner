import React from "react";
import { Pressable, StyleSheet, View } from 'react-native';
import { ScaledText as Text } from '@/components/ui/Typography';
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { ThemeColors } from "@/interface/theme.type";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import { logger } from "@/utils/logger";

export default function BottomTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const colors = useThemeColor();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, hp("1.5%")),
          paddingLeft: insets.left + wp("2%"),
          paddingRight: insets.right + wp("2%"),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? colors.primary : colors.tabInactive;
        const label = options.title ?? route.name;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            accessibilityState={{ selected: focused }}
            testID={options.tabBarButtonTestID}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                logger.debug("main_tab_selected", {
                  scope: "navigation",
                  code: route.name,
                });
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
          >
            <View
              collapsable={false}
              style={[styles.icon, focused && styles.activeIcon]}
            >
              {options.tabBarIcon?.({ focused, color, size: wp("6%") })}
            </View>
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderTopColor: colors.surfaceRaised,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: hp("1.5%"),
    },
    tab: {
      flex: 1,
      minWidth: 48,
      minHeight: Math.max(48, hp("7%")),
      alignItems: "center",
      paddingHorizontal: wp("0.5%"),
    },
    pressed: { opacity: 0.65 },
    icon: {
      width: wp("10.5%"),
      height: hp("3%"),
      minHeight: wp("7%"),
      borderRadius: 999,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.transparent,
    },
    activeIcon: { backgroundColor: colors.tabActiveBackground },
    label: {
      fontSize: fSize(1.65),
      fontWeight: "500",
      marginTop: hp("0.6%"),
      textAlign: "center",
      flexShrink: 1,
    },
  });
