import React, { type ComponentProps, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, Text } from "@/components/ui";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@/utils/fontIcon.utils";
import { fSize, hp, wp } from "@/utils/responsive.utils";

export type MenuIcon = ComponentProps<typeof Ionicons>["name"];

export function MenuSection({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <View style={styles.section}>
      {title && (
        <Text
          accessibilityRole="header"
          tone="secondary"
          style={styles.sectionTitle}
        >
          {title}
        </Text>
      )}
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

export function MenuRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  last = false,
  destructive = false,
}: {
  icon: MenuIcon;
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
  destructive?: boolean;
}) {
  const colors = useThemeColor();
  const color = destructive ? colors.error : colors.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} color={color} size={wp("5.2%")} />
      <View
        style={[
          styles.rowBody,
          {
            borderBottomColor: colors.surfaceRaised,
            borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.copy}>
          <Text style={[styles.label, { color }]}>{title}</Text>
          {subtitle && (
            <Text tone="secondary" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
        {value && (
          <Text tone="secondary" style={styles.value}>
            {value}
          </Text>
        )}
        <Ionicons
          name="chevron-forward"
          size={wp("4%")}
          color={colors.textSecondary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: hp("0.9%") },
  sectionTitle: { fontSize: fSize(1.6), fontWeight: "500" },
  card: {
    borderWidth: 0,
    padding: 0,
    gap: 0,
    borderRadius: wp("3.8%"),
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("3.4%"),
    paddingLeft: wp("4%"),
    paddingRight: wp("3.5%"),
    minHeight: Math.max(48, hp("5.7%")),
  },
  rowBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: wp("2%"),
    minHeight: Math.max(48, hp("5.7%")),
    paddingVertical: hp("1.2%"),
  },
  copy: { flex: 1, gap: hp("0.35%") },
  label: { fontSize: fSize(1.8), fontWeight: "500", flexShrink: 1 },
  subtitle: { fontSize: fSize(1.3) },
  value: { fontSize: fSize(1.6), maxWidth: "35%", flexShrink: 1 },
});
