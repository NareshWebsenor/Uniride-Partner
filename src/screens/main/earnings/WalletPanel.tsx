import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SVG } from "@/assets";
import { Button, Card, Text } from "@/components/ui";
import { DEMO_WALLET } from "@/constants/earnings";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { hp, wp } from "@/utils/responsive.utils";
import { earningsStyles as s } from "./earnings.styles";
import { useEarningsLabels } from "./useEarningsLabels";

export type WalletAction = "walletBalance" | "cashLimit" | "deposit";

export default function WalletPanel({
  onAction,
}: {
  onAction: (action: WalletAction) => void;
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const { money } = useEarningsLabels();
  return (
    <Card style={[s.card, styles.card]} testID="earnings-wallet">
      {(
        [
          { action: "walletBalance", amount: DEMO_WALLET.balance },
          { action: "cashLimit", amount: DEMO_WALLET.cashLimit },
        ] as const
      ).map((item, index) => (
        <View key={item.action}>
          {index > 0 && (
            <View style={[styles.divider, { borderColor: colors.border }]} />
          )}
          <Pressable
            testID={`earnings-${item.action}`}
            accessibilityRole="button"
            onPress={() => onAction(item.action)}
            style={styles.row}
          >
            <Text style={[s.body, s.flex]}>{t(`earnings.${item.action}`)}</Text>
            <Text style={s.body}>{money(item.amount)}</Text>
            <SVG.EarningsIcon
              name="chevronRight"
              width={wp("3.5%")}
              height={wp("3.5%")}
            />
          </Pressable>
        </View>
      ))}
      <Button
        testID="earnings-deposit"
        title={t("earnings.deposit")}
        onPress={() => onAction("deposit")}
        textStyle={s.body}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: hp("0.7%"), borderRadius: wp("4%") },
  row: {
    minHeight: Math.max(48, hp("6%")),
    flexDirection: "row",
    alignItems: "center",
    gap: wp("1%"),
    paddingVertical: hp("0.5%"),
  },
  divider: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    marginBottom: hp("0.7%"),
  },
});
