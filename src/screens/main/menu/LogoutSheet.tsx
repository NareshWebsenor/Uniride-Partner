import React, { useRef } from "react";
import { StyleSheet } from "react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { BottomSheet, Button, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { TRootStack } from "@/interface/navigation.type";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";
import { logger } from "@/utils/logger";
import { fSize } from "@/utils/responsive.utils";

export default function LogoutSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const navigation = useNavigation<NavigationProp<TRootStack>>();
  const leaving = useRef(false);
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      showCloseButton={false}
      edgeToEdge
    >
      <Text accessibilityRole="header" style={styles.title}>
        {t("menuDetails.logoutTitle")}
      </Text>
      <Text style={styles.message}>{t("menuDetails.logoutMessage")}</Text>
      <Button
        title={t("profile.log_out")}
        style={{ backgroundColor: colors.error }}
        onPress={() => {
          if (leaving.current) return;
          leaving.current = true;
          // Active auth is a local preview; no remote session/token is created by it.
          useDriverOnboardingStore.getState().clear();
          logger.info("menu.preview_logged_out", { scope: "auth" });
          onClose();
          navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
        }}
      />
      <Button title={t("ui.cancel")} variant="secondary" onPress={onClose} />
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  title: { textAlign: "center", fontWeight: "700", fontSize: fSize(2.3) },
  message: { textAlign: "center", fontSize: fSize(1.9) },
});
