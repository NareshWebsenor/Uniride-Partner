import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Alert, Button, IconButton, Switch, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import {
  ALERT_TONES,
  type AlertTone,
} from "@/interface/notificationPreferences.type";
import { useNotificationPreferencesStore } from "@/store/notificationPreferencesStore";
import { Ionicons } from "@/utils/fontIcon.utils";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import MenuDetailLayout, { DetailCard, DetailIntro } from "./MenuDetailLayout";
import AlertTonePreview from "./AlertTonePreview";

export default function OrderSoundScreen() {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const navigation = useNavigation();
  const savedSound = useNotificationPreferencesStore((state) => state.sound);
  const savedVibrate = useNotificationPreferencesStore(
    (state) => state.vibrate
  );
  const saveSound = useNotificationPreferencesStore((state) => state.saveSound);
  const saving = useNotificationPreferencesStore((state) => state.saving);
  const error = useNotificationPreferencesStore(
    (state) => state.persistenceError
  );
  const [sound, setSound] = useState(savedSound);
  const [vibrate, setVibrate] = useState(savedVibrate);
  const [preview, setPreview] = useState<AlertTone | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const stopPreview = useCallback(() => setPreview(null), []);
  const failPreview = useCallback(() => {
    setPreview(null);
    setPreviewError(true);
  }, []);
  return (
    <MenuDetailLayout
      title={t("menu.orderSound")}
      testID="order-sound-screen"
      footer={
        <>
          {error && (
            <Alert tone="error" message={t("menuAlerts.preferenceError")} />
          )}
          <Button
            title={t("menuAlerts.save")}
            loading={saving}
            onPress={async () => {
              stopPreview();
              if (await saveSound({ sound, vibrate })) navigation.goBack();
            }}
          />
        </>
      }
    >
      <DetailIntro
        title={t("menuAlerts.chooseSound")}
        description={t("menuAlerts.soundDescription")}
      />
      <View style={styles.toneSection}>
        <View style={styles.legend}>
          <Text tone="secondary" style={styles.caption}>
            {t("menuAlerts.alertTone")}
          </Text>
          <Text tone="secondary" style={styles.caption}>
            {t("menuAlerts.tapPreview")}
          </Text>
        </View>
        <DetailCard>
          {ALERT_TONES.map((tone, index) => (
            <View
              key={tone}
              style={[
                styles.toneRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth:
                    index === ALERT_TONES.length - 1
                      ? 0
                      : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={t(`menuAlerts.${tone}`)}
                accessibilityState={{
                  checked: sound === tone,
                  disabled: saving,
                }}
                disabled={saving}
                onPress={() => setSound(tone)}
                style={styles.toneCopy}
              >
                <Text style={styles.label}>{t(`menuAlerts.${tone}`)}</Text>
                <Text tone="secondary" style={styles.caption}>
                  {t(
                    savedSound === tone
                      ? "menuAlerts.currentSound"
                      : `menuAlerts.${tone}Description`
                  )}
                </Text>
              </Pressable>
              <IconButton
                accessibilityLabel={t(
                  preview === tone
                    ? "menuAlerts.stopPreview"
                    : "menuAlerts.preview",
                  { sound: t(`menuAlerts.${tone}`) }
                )}
                accessibilityState={{ selected: preview === tone }}
                disabled={saving}
                onPress={() => {
                  setPreviewError(false);
                  setPreview(preview === tone ? null : tone);
                }}
                style={[
                  styles.previewButton,
                  { backgroundColor: colors.transparent },
                ]}
                icon={
                  <View
                    style={[
                      styles.playDisc,
                      { backgroundColor: colors.surfaceRaised },
                    ]}
                  >
                    <Ionicons
                      name={preview === tone ? "stop" : "play"}
                      size={wp("3%")}
                      color={colors.warning}
                    />
                  </View>
                }
              />
              <Pressable
                accessible={false}
                importantForAccessibility="no"
                disabled={saving}
                onPress={() => setSound(tone)}
                style={styles.radioTarget}
              >
                <Ionicons
                  name={sound === tone ? "radio-button-on" : "radio-button-off"}
                  size={wp("5.5%")}
                  color={sound === tone ? colors.primary : colors.textSecondary}
                />
              </Pressable>
            </View>
          ))}
        </DetailCard>
      </View>
      {previewError && (
        <Alert tone="error" message={t("menuAlerts.previewError")} />
      )}
      <DetailCard>
        <View style={styles.vibrateRow}>
          <View style={styles.copy}>
            <Text style={styles.label}>{t("menuAlerts.vibrate")}</Text>
            <Text tone="secondary" style={styles.caption}>
              {t("menuAlerts.vibrateDescription")}
            </Text>
          </View>
          <Switch
            accessibilityLabel={t("menuAlerts.vibrate")}
            value={vibrate}
            onValueChange={setVibrate}
            disabled={saving}
          />
        </View>
      </DetailCard>
      <AlertTonePreview
        tone={preview}
        onStop={stopPreview}
        onError={failPreview}
      />
    </MenuDetailLayout>
  );
}

const styles = StyleSheet.create({
  toneSection: { gap: hp("1%") },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: wp("2%"),
    flexWrap: "wrap",
  },
  toneRow: { flexDirection: "row", alignItems: "center", gap: wp("1%") },
  toneCopy: {
    flex: 1,
    minHeight: Math.max(48, hp("7%")),
    justifyContent: "center",
    gap: hp("0.4%"),
    paddingVertical: hp("1%"),
  },
  label: { fontSize: fSize(1.85), fontWeight: "500" },
  caption: { fontSize: fSize(1.4), lineHeight: fSize(2) },
  previewButton: { borderRadius: 999 },
  playDisc: {
    width: wp("7%"),
    height: wp("7%"),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  radioTarget: {
    minWidth: Math.max(48, wp("12%")),
    minHeight: Math.max(48, wp("12%")),
    alignItems: "center",
    justifyContent: "center",
  },
  vibrateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("3%"),
    paddingVertical: hp("0.5%"),
  },
  copy: { flex: 1, gap: hp("0.5%") },
});
