import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { EarningsPeriod } from "@/interface/earnings.type";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import { earningsStyles as s } from "./earnings.styles";
import { useEarningsLabels } from "./useEarningsLabels";

export default function EarningsChart({
  period,
  title,
}: {
  period: EarningsPeriod;
  title: string;
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const { money } = useEarningsLabels();
  return (
    <Card style={[s.card, styles.card]} testID="earnings-chart">
      <Text accessibilityRole="header" style={[s.body, s.bold, styles.title]}>
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.plot}
        accessibilityLabel={t("earnings.chartLabel", { period: title })}
      >
        {period.points.map((point) => (
          <View
            key={point.label}
            style={styles.point}
            accessible
            accessibilityLabel={t("earnings.chartPoint", {
              label: point.label,
              amount: money(point.amount),
            })}
          >
            <View style={[styles.amountCell, { borderColor: colors.border }]}>
              <Text tone="secondary" style={styles.amount}>
                {money(point.amount)}
              </Text>
            </View>
            <Text style={styles.date}>{point.label}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.stats, { borderColor: colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.value, s.bold]}>{period.trips}</Text>
          <Text tone="secondary" style={s.caption}>
            {t("earnings.trips")}
          </Text>
        </View>
        <View
          style={[
            styles.stat,
            styles.statBorder,
            { borderColor: colors.border },
          ]}
        >
          <Text style={[styles.value, s.bold]}>
            {t("earnings.onlineHours", {
              hours: String(Math.floor(period.onlineMinutes / 60)).padStart(
                2,
                "0"
              ),
              minutes: String(period.onlineMinutes % 60).padStart(2, "0"),
            })}
          </Text>
          <Text tone="secondary" style={s.caption}>
            {t("earnings.timeOnline")}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 0, paddingBottom: hp("1.5%"), gap: hp("1.2%") },
  title: { paddingHorizontal: wp("5%") },
  plot: { flexGrow: 1, paddingHorizontal: wp("2%"), paddingTop: hp("1.5%") },
  point: { flex: 1, minWidth: wp("11.2%"), alignItems: "stretch" },
  amountCell: {
    minHeight: hp("5.5%"),
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderStyle: "dashed",
    paddingBottom: hp("1%"),
  },
  amount: { fontSize: fSize(1.15), transform: [{ rotate: "-45deg" }] },
  date: {
    fontSize: fSize(1.4),
    paddingVertical: hp("1%"),
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: hp("1.5%"),
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: hp("0.5%"),
    paddingHorizontal: wp("2%"),
  },
  statBorder: { borderLeftWidth: StyleSheet.hairlineWidth },
  value: { fontSize: fSize(2) },
});
