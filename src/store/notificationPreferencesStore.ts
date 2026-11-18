import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type {
  AlertTone,
  NotificationPreferences,
} from "@/interface/notificationPreferences.type";
import { logger } from "@/utils/logger";

const STORAGE_KEY = "notification-preferences";
const defaults: NotificationPreferences = {
  sound: "classic",
  vibrate: true,
  notificationsEnabled: true,
};
let initialization: Promise<void> | undefined;
let writes = Promise.resolve();
let revision = 0;

interface NotificationPreferencesState extends NotificationPreferences {
  hasHydrated: boolean;
  saving: boolean;
  persistenceError: boolean;
  saveSound: (
    value: Pick<NotificationPreferences, "sound" | "vibrate">
  ) => Promise<boolean>;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
}

export function isAlertTone(value: unknown): value is AlertTone {
  return (
    value === "classic" ||
    value === "chime" ||
    value === "bell" ||
    value === "pulse"
  );
}

function isStoredPreferences(
  value: unknown
): value is NotificationPreferences & { version: 1 } {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    value.version === 1 &&
    "sound" in value &&
    isAlertTone(value.sound) &&
    "vibrate" in value &&
    typeof value.vibrate === "boolean" &&
    "notificationsEnabled" in value &&
    typeof value.notificationsEnabled === "boolean"
  );
}

export const useNotificationPreferencesStore =
  create<NotificationPreferencesState>(() => ({
    ...defaults,
    hasHydrated: false,
    saving: false,
    persistenceError: false,
    saveSound: (value) =>
      isAlertTone(value.sound) && typeof value.vibrate === "boolean"
        ? savePreference(value)
        : Promise.resolve(false),
    setNotificationsEnabled: (enabled) =>
      typeof enabled === "boolean"
        ? savePreference({ notificationsEnabled: enabled })
        : Promise.resolve(false),
  }));

function savePreference(
  patch: Partial<NotificationPreferences>
): Promise<boolean> {
  const request = ++revision;
  useNotificationPreferencesStore.setState({
    saving: true,
    persistenceError: false,
  });
  const result = writes.then(async () => {
    // Hydrate before merging a patch: toggling notifications cannot reset a saved tone.
    await initializeNotificationPreferences();
    const current = useNotificationPreferencesStore.getState();
    const next: NotificationPreferences = {
      sound: current.sound,
      vibrate: current.vibrate,
      notificationsEnabled: current.notificationsEnabled,
      ...patch,
    };
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, ...next })
      );
      useNotificationPreferencesStore.setState({
        ...next,
        ...(request === revision
          ? { saving: false, persistenceError: false }
          : {}),
      });
      logger.debug("notification_preferences.saved", { scope: "preferences" });
      return true;
    } catch {
      if (request === revision) {
        useNotificationPreferencesStore.setState({
          saving: false,
          persistenceError: true,
        });
      }
      logger.warn("notification_preferences.save_failed", {
        scope: "preferences",
      });
      return false;
    }
  });
  // A failed write keeps the last saved preference and does not poison later writes.
  writes = result.then(() => undefined);
  return result;
}

export function initializeNotificationPreferences(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      let preferences = defaults;
      let persistenceError = false;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const value: unknown = raw === null ? null : JSON.parse(raw);
        if (isStoredPreferences(value)) {
          preferences = {
            sound: value.sound,
            vibrate: value.vibrate,
            notificationsEnabled: value.notificationsEnabled,
          };
        } else if (raw !== null) {
          persistenceError = true;
          logger.warn("notification_preferences.invalid_record", {
            scope: "preferences",
          });
        }
      } catch {
        persistenceError = true;
        logger.warn("notification_preferences.read_failed", {
          scope: "preferences",
        });
      }
      // All mutations wait for this read; disk can never replace a newer saved choice.
      useNotificationPreferencesStore.setState({
        ...preferences,
        hasHydrated: true,
        persistenceError,
      });
    })();
  }
  return initialization;
}
