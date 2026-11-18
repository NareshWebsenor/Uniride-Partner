import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppBackground from "@/components/background/AppBackground";
import { Modal, Text } from "@/components/ui";
import {
  useAppTranslation,
  type TranslationKey,
} from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import { logger } from "@/utils/logger";
import MenuProfileCard from "../menu/MenuProfileCard";
import MenuPreferences from "../menu/MenuPreferences";
import { MenuRow, MenuSection } from "../menu/MenuSection";

export default function MenuScreen() {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const [pending, setPending] = useState<TranslationKey | null>(null);
  const showPending = (key: TranslationKey) => {
    logger.debug("menu.preview_action", { scope: "menu", code: key });
    setPending(key);
  };
  return (
    <AppBackground backgroundColor={colors.surfaceRaised}>
      <ScrollView
        testID="menu-screen"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MenuProfileCard />
        <MenuSection title={t("menu.account")}>
          <MenuRow
            icon="document-text-outline"
            title={t("menu.documents")}
            subtitle={t("menu.documentsDescription")}
            onPress={() => showPending("menu.documents")}
          />
          <MenuRow
            icon="car-outline"
            title={t("menu.vehicle")}
            subtitle={t("menu.demoVehicle")}
            onPress={() => showPending("menu.vehicle")}
            last
          />
        </MenuSection>
        <MenuPreferences onPending={showPending} />
        <MenuSection title={t("menu.helpSafety")}>
          <MenuRow
            icon="headset-outline"
            title={t("menu.help")}
            onPress={() => showPending("menu.help")}
          />
          <MenuRow
            icon="shield-checkmark-outline"
            title={t("menu.safety")}
            onPress={() => showPending("menu.safety")}
            last
          />
        </MenuSection>
        <View style={styles.logout}>
          <MenuSection>
            <MenuRow
              icon="log-out-outline"
              title={t("profile.log_out")}
              onPress={() => showPending("profile.log_out")}
              destructive
              last
            />
          </MenuSection>
        </View>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => showPending("menu.terms")}
            style={styles.footerLink}
          >
            <Text tone="secondary" style={styles.footerText}>
              {t("menu.terms")}
            </Text>
          </Pressable>
          <View
            style={[styles.dot, { backgroundColor: colors.textSecondary }]}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => showPending("menu.privacy")}
            style={styles.footerLink}
          >
            <Text tone="secondary" style={styles.footerText}>
              {t("menu.privacy")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <Modal
        visible={pending !== null}
        onClose={() => setPending(null)}
        title={pending ? t(pending) : undefined}
      >
        <Text>{t("menu.comingSoon")}</Text>
      </Modal>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: wp("5.2%"),
    paddingTop: hp("2%"),
    paddingBottom: hp("1.5%"),
    gap: hp("1.6%"),
  },
  logout: { marginTop: hp("1%") },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: wp("1.5%"),
  },
  footerLink: { minHeight: 48, minWidth: 48, justifyContent: "center" },
  footerText: { fontSize: fSize(1.4) },
  dot: { width: wp("0.4%"), height: wp("0.4%"), borderRadius: 999 },
});
