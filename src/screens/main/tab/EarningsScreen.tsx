import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppBackground from "@/components/background/AppBackground";
import {
  BottomSheet,
  EmptyState,
  Modal,
  RadioButton,
  Text,
} from "@/components/ui";
import { EARNINGS_PERIODS } from "@/constants/earnings";
import {
  useAppTranslation,
  type TranslationKey,
} from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { EarningsRange, EarningsTab } from "@/interface/earnings.type";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import { logger } from "@/utils/logger";
import EarningsOverview from "../earnings/EarningsOverview";
import WalletPanel, { type WalletAction } from "../earnings/WalletPanel";
import { useEarningsLabels } from "../earnings/useEarningsLabels";

export default function EarningsScreen() {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const { label } = useEarningsLabels();
  const [tab, setTab] = useState<EarningsTab>("all");
  const [range, setRange] = useState<EarningsRange>("week");
  const [index, setIndex] = useState(0);
  const [choosing, setChoosing] = useState(false);
  const [preview, setPreview] = useState<TranslationKey | null>(null);
  const periods = EARNINGS_PERIODS[range];
  const period = periods[index];
  const selectPeriod = (next: number) => {
    if (next < 0 || next >= periods.length) return;
    setIndex(next);
    setChoosing(false);
    logger.debug("earnings.period_selected", {
      scope: "earnings",
      code: range,
    });
  };
  const showPreview = (action: WalletAction | "viewRateCard") => {
    setPreview(`earnings.${action}`);
    logger.debug("earnings.preview_action", {
      scope: "earnings",
      code: action,
    });
  };
  return (
    <AppBackground backgroundColor={colors.surface}>
      <View
        style={styles.tabs}
        accessibilityRole="tablist"
        testID="earnings-screen"
      >
        {(["all", "wallet"] as const).map((item) => (
          <Pressable
            key={item}
            testID={`earnings-tab-${item}`}
            accessibilityRole="tab"
            accessibilityLabel={t(`earnings.${item}`)}
            accessibilityState={{ selected: tab === item }}
            onPress={() => {
              setTab(item);
              logger.debug("earnings.tab_selected", {
                scope: "earnings",
                code: item,
              });
            }}
            style={styles.tab}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === item ? colors.primary : colors.textPrimary },
              ]}
            >
              {t(`earnings.${item}`)}
            </Text>
            {tab === item && (
              <View
                style={[styles.indicator, { backgroundColor: colors.primary }]}
              />
            )}
          </Pressable>
        ))}
      </View>
      <ScrollView
        style={{ backgroundColor: colors.surfaceRaised }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {tab === "wallet" ? (
          <WalletPanel onAction={showPreview} />
        ) : period ? (
          <EarningsOverview
            range={range}
            period={period}
            onRange={(value) => {
              setRange(value);
              setIndex(0);
            }}
            onChoosePeriod={() => setChoosing(true)}
            onPrevious={() => selectPeriod(index + 1)}
            onNext={() => selectPeriod(index - 1)}
            hasPrevious={index < periods.length - 1}
            hasNext={index > 0}
            onRateCard={() => showPreview("viewRateCard")}
          />
        ) : (
          <EmptyState
            title={t("earnings.emptyTitle")}
            message={t("earnings.emptyMessage")}
          />
        )}
      </ScrollView>
      <BottomSheet
        visible={choosing}
        onClose={() => setChoosing(false)}
        title={t("earnings.choosePeriod")}
      >
        {periods.map((item, position) => (
          <RadioButton
            key={item.id}
            value={index === position}
            label={label(item, range).full}
            onValueChange={() => selectPeriod(position)}
          />
        ))}
      </BottomSheet>
      <Modal
        visible={preview !== null}
        onClose={() => setPreview(null)}
        title={preview ? t(preview) : t("earnings.previewTitle")}
      >
        <Text>{t("earnings.previewBody")}</Text>
      </Modal>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    paddingHorizontal: wp("4%"),
    paddingTop: hp("2%"),
  },
  tab: {
    flex: 1,
    minHeight: Math.max(48, hp("6%")),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("2%"),
  },
  tabText: { fontSize: fSize(1.75), fontWeight: "500", textAlign: "center" },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: wp("1%"),
    right: wp("1%"),
    height: hp("0.45%"),
    borderTopLeftRadius: wp("1%"),
    borderTopRightRadius: wp("1%"),
  },
  content: {
    padding: wp("4.5%"),
    paddingTop: hp("2.8%"),
    paddingBottom: hp("3%"),
    flexGrow: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
});
