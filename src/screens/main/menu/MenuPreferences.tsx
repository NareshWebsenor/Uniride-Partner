import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Alert, Modal, RadioButton, Switch, Text } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@/utils/fontIcon.utils";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import { MenuRow, MenuSection } from "./MenuSection";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import type { TRootStack } from "@/interface/navigation.type";
import { useNotificationPreferencesStore } from "@/store/notificationPreferencesStore";
import { useTextSizeStore } from "@/store/textSizeStore";

export default function MenuPreferences() {
  const { t } = useAppTranslation();
  const navigation = useNavigation<NavigationProp<TRootStack>>();
  const textSize = useTextSizeStore((state) => state.size);
  const { colors, mode, resolvedTheme, setMode } = useTheme();
  const { language } = useLanguage();
  const sound = useNotificationPreferencesStore((state) => state.sound);
  const notificationsEnabled = useNotificationPreferencesStore(
    (state) => state.notificationsEnabled
  );
  const themeError = useThemeStore((state) => state.persistenceError);
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <>
      <MenuSection title={t("profile.preferences")}>
        <View style={styles.themeRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("settings.appearance")}
            accessibilityHint={t("menu.appearanceHint")}
            onPress={() => setThemeOpen(true)}
            style={styles.themeLabel}
          >
            <Ionicons
              name="moon-outline"
              size={wp("5.2%")}
              color={colors.textPrimary}
            />
            <Text style={styles.label}>{t("menu.darkMode")}</Text>
          </Pressable>
          <Switch
            accessibilityLabel={t("menu.darkMode")}
            value={resolvedTheme === "dark"}
            onValueChange={(value) => {
              void setMode(value ? "dark" : "light");
            }}
            style={styles.toggle}
          />
        </View>
        <View
          style={[styles.divider, { backgroundColor: colors.surfaceRaised }]}
        />
        <MenuRow
          icon="globe-outline"
          title={t("menu.appLanguage")}
          value={t(`language.${language}`)}
          onPress={() => navigation.navigate("AppLanguageScreen")}
        />
        <MenuRow
          icon="volume-high-outline"
          title={t("menu.orderSound")}
          value={t(`menuAlerts.${sound}`)}
          onPress={() => navigation.navigate("OrderSoundScreen")}
        />
        <MenuRow
          icon="notifications-outline"
          title={t("profile.notifications")}
          value={t(notificationsEnabled ? "menu.on" : "menuAlerts.off")}
          onPress={() => navigation.navigate("NotificationsScreen")}
        />
        <MenuRow
          icon="text-outline"
          title={t("textSize.title")}
          value={t(`textSize.${textSize}`)}
          onPress={() => navigation.navigate("TextSizeScreen")}
          last
        />
      </MenuSection>
      {themeError && (
        <Alert tone="error" message={t("settings.themeSaveError")} />
      )}
      <Modal
        visible={themeOpen}
        onClose={() => setThemeOpen(false)}
        title={t("settings.appearance")}
      >
        {(["light", "dark", "system"] as const).map((value) => (
          <RadioButton
            key={value}
            label={t(`settings.${value}`)}
            value={mode === value}
            onValueChange={() => {
              void setMode(value);
            }}
          />
        ))}
        {themeError && (
          <Alert tone="error" message={t("settings.themeSaveError")} />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp("4%"),
  },
  themeLabel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: wp("3.4%"),
    minHeight: Math.max(48, hp("5.7%")),
  },
  label: { flex: 1, fontSize: fSize(1.8), fontWeight: "500" },
  toggle: { minWidth: 48, justifyContent: "flex-end", marginLeft: wp("2%") },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: wp("12.6%"),
    marginRight: wp("3.5%"),
  },
});
