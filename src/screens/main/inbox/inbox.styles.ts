import { StyleSheet } from "react-native";
import { fSize, hp, wp } from "@/utils/responsive.utils";

export const inboxStyles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: wp("2%") },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: wp("2%"),
  },
  gap: { gap: hp("0.7%") },
  card: {
    borderWidth: 0,
    borderRadius: wp("4.5%"),
    padding: wp("3.7%"),
    gap: hp("1.5%"),
  },
  body: { fontSize: fSize(1.6), lineHeight: fSize(2.3) },
  caption: { fontSize: fSize(1.35), lineHeight: fSize(1.9) },
  small: { fontSize: fSize(1.15), lineHeight: fSize(1.6) },
  name: { fontSize: fSize(1.9), fontWeight: "600" },
  bold: { fontWeight: "600" },
  badge: {
    borderRadius: 999,
    paddingHorizontal: wp("2.5%"),
    paddingVertical: hp("0.35%"),
    flexShrink: 1,
  },
});
