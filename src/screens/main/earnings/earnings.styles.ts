import { StyleSheet } from "react-native";
import { fSize, hp, wp } from "@/utils/responsive.utils";

export const earningsStyles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: wp("2%") },
  card: {
    borderWidth: 0,
    borderRadius: wp("5.5%"),
    padding: wp("4%"),
    gap: hp("2%"),
  },
  body: { fontSize: fSize(1.7) },
  caption: { fontSize: fSize(1.4) },
  bold: { fontWeight: "600" },
});
