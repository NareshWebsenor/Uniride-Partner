import React, { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Button, Modal, Text } from "@/components/ui";
import {
  useAppTranslation,
  type TranslationKey,
} from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@/utils/fontIcon.utils";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import { logger } from "@/utils/logger";
import MenuDetailLayout, { DetailCard } from "./MenuDetailLayout";
import { MenuRow, MenuSection } from "./MenuSection";

// Product-provided number; open the system dialer so the user confirms the call.
const CONTACT_NUMBER = "123";

export default function SafetyScreen() {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const [opening, setOpening] = useState(false);
  const [dialog, setDialog] = useState<{
    title: TranslationKey;
    message: TranslationKey;
  } | null>(null);
  const pending = (title: TranslationKey) =>
    setDialog({ title, message: "menu.comingSoon" });
  const call = async () => {
    if (opening) return;
    setOpening(true);
    try {
      await Linking.openURL(`tel:${CONTACT_NUMBER}`);
    } catch {
      logger.warn("menu.safety.dialer_unavailable", { scope: "safety" });
      setDialog({ title: "menu.safety", message: "menuSafety.callError" });
    } finally {
      setOpening(false);
    }
  };
  return (
    <>
      <MenuDetailLayout title={t("menu.safety")} testID="safety-screen">
        <DetailCard>
          <View style={styles.dangerTitle}>
            <Ionicons
              name="warning-outline"
              color={colors.error}
              size={wp("5%")}
            />
            <Text tone="error" style={styles.title}>
              {t("menuSafety.danger")}
            </Text>
          </View>
          <Text tone="secondary" variant="caption">
            {t("menuSafety.description")}
          </Text>
          <Button
            title={t("menuSafety.call", { number: CONTACT_NUMBER })}
            loading={opening}
            onPress={() => {
              void call();
            }}
            style={{ backgroundColor: colors.error }}
            icon={
              <Ionicons
                name="call-outline"
                color={colors.onPrimary}
                size={wp("5%")}
              />
            }
          />
        </DetailCard>
        <View style={styles.section}>
          <Text tone="secondary" variant="caption">
            {t("menuSafety.contacts")}
          </Text>
          <DetailCard>
            <Text style={styles.title}>{t("menuSafety.noContacts")}</Text>
            <Text tone="secondary" variant="caption">
              {t("menuSafety.contactsDescription")}
            </Text>
            <Button
              title={t("menuSafety.addContact")}
              variant="outline"
              onPress={() => pending("menuSafety.addContact")}
            />
          </DetailCard>
        </View>
        <MenuSection title={t("menuSafety.tools")}>
          <MenuRow
            icon="headset-outline"
            title={t("menuSafety.support")}
            subtitle={t("menuSafety.supportDescription")}
            onPress={() => pending("menuSafety.support")}
          />
          <MenuRow
            icon="share-social-outline"
            title={t("menuSafety.share")}
            subtitle={t("menuSafety.shareDescription")}
            onPress={() => pending("menuSafety.share")}
          />
          <MenuRow
            icon="shield-checkmark-outline"
            title={t("menuSafety.tips")}
            subtitle={t("menuSafety.tipsDescription")}
            onPress={() =>
              setDialog({
                title: "menuSafety.tips",
                message: "menuSafety.tipsBody",
              })
            }
            last
          />
        </MenuSection>
        <Text tone="secondary" variant="caption">
          {t("menuSafety.note")}
        </Text>
      </MenuDetailLayout>
      <Modal
        visible={dialog !== null}
        title={dialog ? t(dialog.title) : undefined}
        onClose={() => setDialog(null)}
      >
        <Text>{dialog ? t(dialog.message) : ""}</Text>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  dangerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("2%"),
    paddingTop: hp("0.8%"),
  },
  title: { fontSize: fSize(1.8), fontWeight: "500", flexShrink: 1 },
  section: { gap: hp("1%") },
});
