import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { OnboardingChoiceCardProps } from "@/interface/driverOnboarding.type";
import type { themeType } from "@/interface/theme.type";
import { Ionicons } from "@/utils/fontIcon.utils";
import { fSize, hp, wp } from "@/utils/responsive.utils";

export default function OnboardingChoiceCard({
  title,
  description,
  badges,
  variant = "driver",
  selected,
  onPress,
  image,
  icon,
  testID,
}: OnboardingChoiceCardProps) {
  const styles = useThemedStyles(createStyle);
  const colors = useThemeColor();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${badges.join(", ")}. ${title}. ${description}`}
      onPress={onPress}
      style={[
        styles.card,
        variant !== "driver" && styles.vehicleCard,
        selected && styles.selected,
      ]}
    >
      <View style={styles.copy}>
        <View
          style={[styles.badges, variant !== "driver" && styles.vehicleBadges]}
        >
          {badges.map((badge, index) => (
            <View
              key={badge}
              style={[
                styles.badge,
                variant !== "driver" && styles.vehicleBadge,
                variant !== "driver" && index > 0 && styles.secondaryBadge,
              ]}
            >
              {variant !== "driver" ? (
                <Ionicons
                  name={index === 0 ? "person" : "car-sport"}
                  size={fSize(1.45)}
                  color={index === 0 ? colors.onPrimary : colors.textSecondary}
                />
              ) : (
                <View style={styles.badgeDot} />
              )}
              <Text
                style={[
                  styles.badgeText,
                  variant !== "driver" && styles.vehicleBadgeText,
                  variant !== "driver" &&
                    index > 0 &&
                    styles.secondaryBadgeText,
                ]}
              >
                {badge}
              </Text>
            </View>
          ))}
        </View>
        <Text
          style={[styles.title, variant !== "driver" && styles.vehicleTitle]}
        >
          {title}
        </Text>
        <Text
          tone="secondary"
          style={[
            styles.description,
            variant !== "driver" && styles.vehicleDescription,
            variant === "bike" && styles.bikeDescription,
          ]}
        >
          {description}
        </Text>
      </View>
      {image ? (
        <Image
          accessible={false}
          source={image}
          style={[
            styles.image,
            variant !== "driver" && styles.vehicleImage,
            variant === "bike" && styles.bikeImage,
          ]}
          resizeMode="contain"
        />
      ) : null}
      {icon ? (
        <Ionicons name={icon} size={wp("16%")} color={colors.textSecondary} />
      ) : null}
      {selected && variant === "driver" ? (
        <Ionicons
          name="checkmark-circle"
          size={wp("5%")}
          color={colors.textPrimary}
          style={styles.check}
        />
      ) : null}
    </Pressable>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp("2%"),
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: wp("4%"),
      padding: wp("4%"),
      backgroundColor: theme.surfaceRaised,
      minHeight: hp("15%"),
    },
    selected: { borderColor: theme.textPrimary },
    copy: { flex: 1, gap: hp("0.6%") },
    badges: { flexDirection: "row", flexWrap: "wrap", gap: wp("1%") },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp("1.3%"),
      backgroundColor: theme.primary,
      borderRadius: wp("4%"),
      paddingHorizontal: wp("2%"),
      paddingVertical: hp("0.3%"),
    },
    badgeText: {
      color: theme.onPrimary,
      fontSize: fSize(1.2),
    },
    badgeDot: {
      width: wp("1.4%"),
      height: wp("1.4%"),
      borderRadius: 999,
      backgroundColor: theme.onPrimary,
    },
    vehicleCard: {
      backgroundColor: theme.surface,
      borderRadius: wp("4.5%"),
      borderWidth: 2,
      padding: wp("4.5%"),
      minHeight: wp("34%"),
    },
    vehicleBadge: {
      paddingHorizontal: wp("2.5%"),
      paddingVertical: hp("0.4%"),
    },
    vehicleBadges: { width: "72%" },
    vehicleBadgeText: { fontSize: fSize(1.45), fontWeight: "500" },
    secondaryBadge: { backgroundColor: theme.surfaceRaised },
    secondaryBadgeText: { color: theme.textSecondary },
    vehicleTitle: {
      fontSize: fSize(2.35),
      fontWeight: "600",
      marginTop: hp("1%"),
      width: "74%",
    },
    vehicleDescription: { fontSize: fSize(1.7), lineHeight: fSize(2.5) },
    bikeDescription: { width: "74%" },
    vehicleImage: {
      position: "absolute",
      right: wp("4%"),
      top: wp("4.5%"),
      width: wp("22%"),
      height: wp("12%"),
    },
    bikeImage: { width: wp("19%"), height: wp("23%") },
    title: { fontSize: fSize(1.9), fontWeight: "600" },
    description: { fontSize: fSize(1.45), lineHeight: fSize(2.1) },
    image: { width: wp("22%"), height: hp("12%") },
    check: { position: "absolute", right: wp("2%"), top: hp("0.8%") },
  });
