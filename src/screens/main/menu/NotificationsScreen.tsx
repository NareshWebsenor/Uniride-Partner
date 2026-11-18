import React, { useState } from "react";
import { Alert, Button, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useNotificationPreferencesStore } from "@/store/notificationPreferencesStore";
import MenuDetailLayout, {
  ChoiceRow,
  DetailCard,
  DetailIntro,
} from "./MenuDetailLayout";

export default function NotificationsScreen() {
  const { t } = useAppTranslation();
  const enabled = useNotificationPreferencesStore(
    (state) => state.notificationsEnabled
  );
  const save = useNotificationPreferencesStore(
    (state) => state.setNotificationsEnabled
  );
  const saving = useNotificationPreferencesStore((state) => state.saving);
  const error = useNotificationPreferencesStore(
    (state) => state.persistenceError
  );
  const [requested, setRequested] = useState(enabled);
  const select = (value: boolean) => {
    setRequested(value);
    void save(value);
  };
  return (
    <MenuDetailLayout
      title={t("profile.notifications")}
      testID="notifications-screen"
    >
      <DetailIntro
        title={t("menuAlerts.notificationPreference")}
        description={t("menuAlerts.notificationDescription")}
      />
      <DetailCard>
        <ChoiceRow
          title={t("menu.on")}
          selected={enabled}
          disabled={saving}
          onPress={() => select(true)}
        />
        <ChoiceRow
          title={t("menuAlerts.off")}
          selected={!enabled}
          disabled={saving}
          onPress={() => select(false)}
          last
        />
      </DetailCard>
      {saving && (
        <Text tone="secondary" accessibilityLiveRegion="polite">
          {t("menuAlerts.saving")}
        </Text>
      )}
      {error && (
        <>
          <Alert tone="error" message={t("menuAlerts.preferenceError")} />
          <Button
            title={t("ui.retry")}
            onPress={() => select(requested)}
            disabled={saving}
            variant="outline"
          />
        </>
      )}
    </MenuDetailLayout>
  );
}
