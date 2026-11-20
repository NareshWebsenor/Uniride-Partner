import React, { useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { BottomSheet, Button, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { TRootStack } from "@/interface/navigation.type";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";
import { logger } from "@/utils/logger";
import { fSize } from "@/utils/responsive.utils";
import { clearDriverSession } from '@/service/driverSession';

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
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
        loading={busy}
        onPress={async () => {
          if (leaving.current) return;
          leaving.current = true;
          setBusy(true); setError(false);
          try {
            useDriverOnboardingStore.getState().clear();
            await clearDriverSession();
            logger.info('driver_session.logged_out', { scope: 'auth' });
            onClose();
            navigation.reset({ index: 0, routes: [{ name: 'LoginScreen', params: { register: false } }] });
          } catch {
            leaving.current = false;
            setError(true);
          } finally { setBusy(false); }
        }}
      />
      {error ? <Text tone="error">{t('driverRegistration.storageFailed')}</Text> : null}
      <Button title={t("ui.cancel")} variant="secondary" onPress={onClose} />
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  title: { textAlign: "center", fontWeight: "700", fontSize: fSize(2.3) },
  message: { textAlign: "center", fontSize: fSize(1.9) },
});
