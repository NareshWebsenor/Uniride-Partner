import React, { useState } from "react";
import { Image, Linking, StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Button, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { LocalUpload } from "@/interface/driverOnboarding.type";
import type { TRootStack } from "@/interface/navigation.type";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";
import { documentEditRoutes } from "@/utils/menuDocuments";
import { Ionicons } from "@/utils/fontIcon.utils";
import { logger } from "@/utils/logger";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import MenuDetailLayout, { DetailCard } from "./MenuDetailLayout";

function FilePreview({ file, label }: { file: LocalUpload; label: string }) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState(false);
  const image = file.mime.startsWith("image/");
  const open = async () => {
    if (opening) return;
    setOpening(true);
    setFailed(false);
    try {
      // Only local picker results are opened. Never forward arbitrary URL schemes.
      if (!/^(file|content):\/\//.test(file.uri))
        throw new Error("unsupported-local-uri");
      await Linking.openURL(file.uri);
    } catch {
      setFailed(true);
      logger.warn("menu.document_open_failed", { scope: "local" });
    } finally {
      setOpening(false);
    }
  };
  return (
    <DetailCard>
      <Text style={styles.label}>{label}</Text>
      {image && !failed ? (
        <Image
          source={{ uri: file.uri }}
          resizeMode="contain"
          accessibilityLabel={label}
          style={[styles.image, { backgroundColor: colors.surfaceRaised }]}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.file}>
          <Ionicons
            name="document-text-outline"
            size={wp("10%")}
            color={colors.textSecondary}
          />
          <Text style={styles.filename}>{file.name}</Text>
        </View>
      )}
      {!image ? (
        <Button
          title={t("menuDocuments.openFile")}
          variant="outline"
          onPress={open}
          loading={opening}
        />
      ) : null}
      {failed ? (
        <Alert tone="error" message={t("menuDocuments.previewError")} />
      ) : null}
    </DetailCard>
  );
}

export default function DocumentViewerScreen({
  route,
  navigation,
}: NativeStackScreenProps<TRootStack, "DocumentViewerScreen">) {
  const { t } = useAppTranslation();
  const { kind } = route.params;
  const document = useDriverOnboardingStore((state) => state.documents[kind]);
  return (
    <MenuDetailLayout
      title={t(`menuDocuments.${kind}`)}
      testID="document-viewer-screen"
      footer={
        <Button
          title={t("menuDocuments.update")}
          onPress={() => navigation.navigate(documentEditRoutes[kind])}
        />
      }
    >
      {document.front || document.back ? (
        <>
          {document.front ? (
            <FilePreview
              key={`front-${document.front.uri}`}
              file={document.front}
              label={t("menuDocuments.front")}
            />
          ) : null}
          {document.back ? (
            <FilePreview
              key={`back-${document.back.uri}`}
              file={document.back}
              label={t("menuDocuments.back")}
            />
          ) : null}
          <Text tone="secondary" style={styles.note}>
            {t("menuDocuments.pendingVerification")}
          </Text>
        </>
      ) : (
        <Text>{t("menuDocuments.notUploaded")}</Text>
      )}
    </MenuDetailLayout>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fSize(1.7),
    fontWeight: "600",
    paddingVertical: hp("0.8%"),
  },
  image: {
    width: "100%",
    height: hp("31%"),
    borderRadius: wp("2%"),
    marginBottom: hp("1%"),
  },
  file: { alignItems: "center", paddingVertical: hp("3%"), gap: hp("1%") },
  filename: { fontSize: fSize(1.5), textAlign: "center" },
  note: { fontSize: fSize(1.4) },
});
