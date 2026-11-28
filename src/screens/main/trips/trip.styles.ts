import { StyleSheet } from "react-native";
import { fSize, hp, wp } from "@/utils/responsive.utils";

export const tripStyles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: wp("2%") },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: wp("3%"),
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: wp("6%"),
    padding: wp("4%"),
    gap: hp("1.8%"),
  },
  label: { fontSize: fSize(1.15), fontWeight: "500" },
  caption: { fontSize: fSize(1.25), lineHeight: fSize(1.8) },
  body: { fontSize: fSize(1.5), lineHeight: fSize(2.1) },
  strong: { fontWeight: "600" },
  title: { fontSize: fSize(1.8), fontWeight: "600" },
  amount: { fontSize: fSize(2.8), fontWeight: "700" },
  time: { fontSize: fSize(2.4), fontWeight: "700" },
  gap: { gap: hp("0.5%") },
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
  button: { minHeight: Math.max(48, hp("5%")), paddingHorizontal: wp("5%") },
  buttonText: { fontSize: fSize(1.45), fontWeight: "600" },
});
