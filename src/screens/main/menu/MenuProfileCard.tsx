import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@/utils/fontIcon.utils";
import { fSize, hp, wp } from "@/utils/responsive.utils";

export default function MenuProfileCard() {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const driverProfile = useAuthStore((state) => state.driverProfile);
  const driverUser = useAuthStore((state) => state.driverUser);
  const displayName =
    driverProfile?.name?.trim() || driverUser?.name?.trim() || t("menu.demoName");
  const displayEmail = driverProfile?.email || driverUser?.email;
  return (
    <Card style={[styles.card, { shadowColor: colors.shadow }]}>
      <View
        style={[styles.avatar, { backgroundColor: colors.tabActiveBackground }]}
      >
        <Ionicons name="person" size={wp("10%")} color={colors.primary} />
      </View>
      <View style={styles.details}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{displayName}</Text>
          <Ionicons
            name="checkmark-circle"
            size={wp("4%")}
            color={colors.primary}
            accessibilityLabel={t("profile.verified")}
          />
        </View>
        {displayEmail ? (
          <Text tone="secondary" style={styles.ratingText}>
            {displayEmail}
          </Text>
        ) : (
          <View
            style={styles.rating}
            accessibilityLabel={t("menu.rating", { rating: "4.92" })}
            accessible
          >
            <Ionicons name="star" size={wp("3.5%")} color={colors.warning} />
            <Text style={styles.ratingText}>{t("menu.demoRating")}</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("4%"),
    padding: wp("3%"),
    borderWidth: 0,
    borderRadius: wp("4%"),
    shadowOffset: { width: 0, height: hp("0.2%") },
    shadowOpacity: 0.08,
    shadowRadius: wp("1%"),
    elevation: 2,
  },
  avatar: {
    width: wp("16.5%"),
    height: wp("16.5%"),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  details: { flex: 1, gap: hp("0.7%") },
  nameRow: { flexDirection: "row", alignItems: "center", gap: wp("1.2%") },
  name: { fontSize: fSize(2.2), fontWeight: "600", flexShrink: 1 },
  rating: { flexDirection: "row", alignItems: "center", gap: wp("1%") },
  ratingText: { fontSize: fSize(1.8) },
});
