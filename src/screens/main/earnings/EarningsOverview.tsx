import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SVG } from "@/assets";
import { Card, IconButton, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { EarningsPeriod, EarningsRange } from "@/interface/earnings.type";
import { hp, wp, fSize } from "@/utils/responsive.utils";
import EarningsChart from "./EarningsChart";
import { earningsStyles as s } from "./earnings.styles";
import { useEarningsLabels } from "./useEarningsLabels";

interface Props {
  range: EarningsRange;
  period: EarningsPeriod;
  onRange: (range: EarningsRange) => void;
  onChoosePeriod: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  onRateCard: () => void;
}

export default function EarningsOverview({
  range,
  period,
  onRange,
  onChoosePeriod,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onRateCard,
}: Props) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const { label, money } = useEarningsLabels();
  const dates = label(period, range);
  return (
    <View style={styles.content} testID="earnings-overview">
      <View style={styles.filters} accessibilityRole="tablist">
        {(["day", "week", "month"] as const).map((item) => (
          <Pressable
            key={item}
            testID={`earnings-range-${item}`}
            accessibilityRole="tab"
            accessibilityLabel={t(`earnings.${item}`)}
            accessibilityState={{ selected: range === item }}
            onPress={() => onRange(item)}
            style={[
              styles.filter,
              {
                backgroundColor:
                  range === item ? colors.primary : colors.transparent,
                borderColor: range === item ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                s.body,
                {
                  color: range === item ? colors.onPrimary : colors.textPrimary,
                },
              ]}
            >
              {t(`earnings.${item}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Card style={[s.card, styles.summary]}>
        <Pressable
          testID="earnings-choose-period"
          accessibilityRole="button"
          accessibilityLabel={t("earnings.choosePeriod")}
          accessibilityValue={{ text: dates.full }}
          onPress={onChoosePeriod}
          style={styles.periodTouch}
        >
          <View
            style={[
              styles.periodPill,
              { backgroundColor: colors.tabActiveBackground },
            ]}
          >
            <Text style={s.body}>{dates.short}</Text>
            <SVG.EarningsIcon
              name="chevronDown"
              width={wp("3.5%")}
              height={wp("3.5%")}
            />
          </View>
        </Pressable>
        <View style={styles.totalRow}>
          <IconButton
            testID="earnings-previous"
            accessibilityLabel={t("earnings.previousPeriod")}
            onPress={onPrevious}
            disabled={!hasPrevious}
            style={{ backgroundColor: colors.transparent }}
            icon={
              <SVG.EarningsIcon
                name="chevronLeft"
                color={hasPrevious ? colors.textPrimary : colors.textSecondary}
              />
            }
          />
          <Text testID="earnings-total" style={styles.total}>
            {money(period.total)}
          </Text>
          <IconButton
            testID="earnings-next"
            accessibilityLabel={t("earnings.nextPeriod")}
            onPress={onNext}
            disabled={!hasNext}
            style={{ backgroundColor: colors.transparent }}
            icon={
              <SVG.EarningsIcon
                name="chevronRight"
                color={hasNext ? colors.textPrimary : colors.textSecondary}
              />
            }
          />
        </View>
      </Card>
      <EarningsChart period={period} title={dates.full} />
      <Pressable
        testID="earnings-rate-card"
        onPress={onRateCard}
        accessibilityRole="button"
      >
        <Card style={[s.card, styles.rateCard]}>
          <SVG.EarningsIcon
            name="rateCard"
            color={colors.primary}
            width={wp("6%")}
            height={wp("6%")}
          />
          <View style={[s.flex, styles.rateCopy]}>
            <Text style={[s.body, s.bold]}>{t("earnings.viewRateCard")}</Text>
            <Text tone="secondary" style={s.caption}>
              {t("earnings.rateCardHint")}
            </Text>
          </View>
          <SVG.EarningsIcon name="chevronRight" color={colors.textSecondary} />
        </Card>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: hp("1.8%") },
  filters: { flexDirection: "row", gap: wp("2.5%") },
  filter: {
    flex: 1,
    minHeight: Math.max(48, hp("4.5%")),
    borderWidth: 1,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp("2%"),
    paddingVertical: hp("0.5%"),
  },
  summary: { alignItems: "center", gap: hp("0.3%"), paddingVertical: hp("1%") },
  periodTouch: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  periodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("2%"),
    borderRadius: 999,
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("0.7%"),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: wp("2%"),
    paddingBottom: hp("0.7%"),
  },
  total: {
    fontSize: fSize(3.5),
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  rateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("3%"),
    borderRadius: wp("3%"),
    minHeight: Math.max(48, hp("7%")),
    paddingVertical: hp("1.4%"),
    paddingHorizontal: wp("3%"),
  },
  rateCopy: { gap: hp("0.5%") },
});
