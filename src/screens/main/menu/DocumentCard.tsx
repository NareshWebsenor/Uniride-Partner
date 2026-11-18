import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { Button, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type {
  DocumentDraft,
  DocumentKind,
} from "@/interface/driverOnboarding.type";
import type { TRootStack } from "@/interface/navigation.type";
import { documentEditRoutes, documentStatus } from "@/utils/menuDocuments";
import { Ionicons } from "@/utils/fontIcon.utils";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import { DetailCard } from "./MenuDetailLayout";

export default function DocumentCard({
  kind,
  document,
}: {
  kind: DocumentKind;
  document: DocumentDraft;
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const navigation = useNavigation<NavigationProp<TRootStack>>();
  const status = documentStatus(kind, document);
  const hasFile = Boolean(document.front || document.back);
  const needsUpdate = status === "expired" || status === "expiring";
  const statusColor =
    status === "uploaded"
      ? colors.success
      : status === "expiring"
      ? colors.warning
      : colors.error;
  return (
    <DetailCard>
      <View style={styles.row}>
        <Ionicons
          name="document-text-outline"
          size={wp("5.4%")}
          color={colors.textPrimary}
        />
        <View style={styles.copy}>
          <Text style={styles.title}>{t(`menuDocuments.${kind}`)}</Text>
          {document.validUntil ? (
            <Text style={styles.caption} tone="secondary">
              {t("menuDocuments.validUntil", { date: document.validUntil })}
            </Text>
          ) : null}
          <View
            style={[styles.badge, { backgroundColor: colors.surfaceRaised }]}
          >
            <Text style={[styles.status, { color: statusColor }]}>
              {t(`menuDocuments.${status}`)}
            </Text>
          </View>
          {status === "uploaded" ? (
            <Text style={styles.caption} tone="secondary">
              {t("menuDocuments.pendingVerification")}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          {hasFile ? (
            <Button
              title={t("menuDocuments.view")}
              variant="outline"
              testID={`view-${kind}`}
              style={styles.button}
              textStyle={styles.buttonText}
              onPress={() =>
                navigation.navigate("DocumentViewerScreen", { kind })
              }
            />
          ) : null}
          {!hasFile || needsUpdate ? (
            <Button
              title={t(
                hasFile ? "menuDocuments.update" : "menuDocuments.upload"
              )}
              testID={`upload-${kind}`}
              style={styles.button}
              textStyle={styles.buttonText}
              onPress={() => navigation.navigate(documentEditRoutes[kind])}
            />
          ) : null}
        </View>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: wp("3%"),
    paddingVertical: hp("1%"),
  },
  copy: { flex: 1, gap: hp("0.6%") },
  title: { fontSize: fSize(1.7), fontWeight: "500" },
  caption: { fontSize: fSize(1.3) },
  badge: {
    alignSelf: "flex-start",
    borderRadius: wp("1%"),
    paddingHorizontal: wp("2%"),
    paddingVertical: hp("0.35%"),
  },
  status: { fontSize: fSize(1.25) },
  actions: { gap: hp("0.5%"), maxWidth: "32%" },
  button: {
    minHeight: 48,
    paddingHorizontal: wp("3%"),
    borderRadius: wp("1.8%"),
  },
  buttonText: { fontSize: fSize(1.4), fontWeight: "500" },
});
