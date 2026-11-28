import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import AppBackground from "@/components/background/AppBackground";
import { EmptyState, Text } from "@/components/ui";
import { tripsForTab } from "@/constants/trips";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { TRootStack } from "@/interface/navigation.type";
import type { TripTab } from "@/interface/trip.type";
import TripCard from "../trips/TripCard";
import { tripStyles as s } from "../trips/trip.styles";
import { logger } from "@/utils/logger";
import { fSize, hp, wp } from "@/utils/responsive.utils";

const TABS: readonly TripTab[] = ["completed", "upcoming", "incomplete"];

export default function TripsScreen() {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const navigation = useNavigation<NavigationProp<TRootStack>>();
  const [tab, setTab] = useState<TripTab>("completed");
  const trips = tripsForTab(tab);
  return (
    <AppBackground backgroundColor={colors.surface}>
      <View
        style={styles.tabs}
        accessibilityRole="tablist"
        testID="trips-screen"
      >
        {TABS.map((item) => (
          <Pressable
            key={item}
            testID={`trips-tab-${item}`}
            accessibilityRole="tab"
            accessibilityLabel={t(`trips.${item}`)}
            accessibilityState={{ selected: tab === item }}
            onPress={() => {
              setTab(item);
              logger.debug("trips.tab_selected", {
                scope: "trips",
                code: item,
              });
            }}
            style={styles.tab}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: tab === item ? colors.primary : colors.textPrimary },
              ]}
            >
              {t(`trips.${item}`)}
            </Text>
            {tab === item && (
              <View
                style={[styles.indicator, { backgroundColor: colors.primary }]}
              />
            )}
          </Pressable>
        ))}
      </View>
      <FlatList
        key={tab}
        data={trips}
        keyExtractor={(trip) => trip.id}
        style={{ backgroundColor: colors.surfaceRaised }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          tab !== "completed" ? (
            <View style={styles.section}>
              <Text style={[s.body, s.strong, s.flex]}>
                {t("trips.today", { date: t("trips.demoDate") })}
              </Text>
              <Text tone="secondary" style={s.caption}>
                {t(
                  tab === "upcoming"
                    ? "trips.scheduledCount"
                    : "trips.incompleteCount",
                  { count: trips.length }
                )}
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={TripSeparator}
        ListEmptyComponent={
          <EmptyState
            title={t("trips.emptyTitle")}
            message={t("trips.emptyBody")}
          />
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onView={() => {
              logger.debug("trips.details_opened", {
                scope: "trips",
                code: item.status,
              });
              navigation.navigate("TripDetailsScreen", { tripId: item.id });
            }}
          />
        )}
      />
    </AppBackground>
  );
}

function TripSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    paddingTop: hp("2%"),
    paddingHorizontal: wp("4%"),
  },
  tab: {
    flex: 1,
    minHeight: Math.max(48, hp("6%")),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp("1%"),
    paddingVertical: hp("1.5%"),
  },
  tabLabel: { fontSize: fSize(1.75), fontWeight: "500", textAlign: "center" },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: wp("4%"),
    right: wp("4%"),
    height: hp("0.45%"),
    borderTopLeftRadius: wp("1%"),
    borderTopRightRadius: wp("1%"),
  },
  list: {
    padding: wp("4.5%"),
    paddingTop: hp("2.5%"),
    paddingBottom: hp("3%"),
    flexGrow: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("2%"),
    paddingBottom: hp("1.8%"),
  },
  separator: { height: hp("1.8%") },
});
