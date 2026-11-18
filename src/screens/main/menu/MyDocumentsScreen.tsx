import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { TRootStack } from "@/interface/navigation.type";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";
import { documentUploaded } from "@/utils/menuDocuments";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import MenuDetailLayout, { DetailCard } from "./MenuDetailLayout";
import DocumentCard from "./DocumentCard";

const kinds = ["license", "government"] as const;

export default function MyDocumentsScreen() {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const navigation = useNavigation<NavigationProp<TRootStack>>();
  const documents = useDriverOnboardingStore((state) => state.documents);
  const count = kinds.filter((kind) =>
    documentUploaded(kind, documents[kind])
  ).length;
  return (
    <MenuDetailLayout
      title={t("menu.documents")}
      testID="my-documents-screen"
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("HelpSupportScreen")}
          style={styles.support}
        >
          <Text style={styles.caption}>{t("menuDocuments.needHelp")}</Text>
          <Text style={[styles.caption, { color: colors.primary }]}>
            {t("menuDocuments.contactSupport")}
          </Text>
        </Pressable>
      }
    >
      <Text tone="secondary" style={styles.caption}>
        {t("menuDocuments.description")}
      </Text>
      <DetailCard>
        <Text style={styles.progressLabel}>
          {t("menuDocuments.progress", { count, total: kinds.length })}
        </Text>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: kinds.length, now: count }}
          accessibilityLabel={t("menuDocuments.progress", {
            count,
            total: kinds.length,
          })}
          style={[styles.track, { backgroundColor: colors.surfaceRaised }]}
        >
          <View
            style={[
              styles.fill,
              {
                width: `${(count / kinds.length) * 100}%`,
                backgroundColor: colors.success,
              },
            ]}
          />
        </View>
      </DetailCard>
      <View style={styles.documents}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t("menuDocuments.yourDocuments")}
        </Text>
        {kinds.map((kind) => (
          <DocumentCard key={kind} kind={kind} document={documents[kind]} />
        ))}
      </View>
    </MenuDetailLayout>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: fSize(1.5) },
  progressLabel: {
    fontSize: fSize(1.7),
    fontWeight: "500",
    paddingVertical: hp("0.7%"),
  },
  track: {
    height: hp("0.7%"),
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: hp("1%"),
  },
  fill: { height: "100%", borderRadius: 999 },
  documents: { gap: hp("1.2%") },
  sectionTitle: {
    fontSize: fSize(1.7),
    fontWeight: "600",
    marginBottom: hp("0.3%"),
  },
  support: {
    minHeight: 48,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: wp("1%"),
  },
});
