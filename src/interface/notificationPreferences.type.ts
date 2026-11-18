export const ALERT_TONES = ["classic", "chime", "bell", "pulse"] as const;
export type AlertTone = (typeof ALERT_TONES)[number];

export interface NotificationPreferences {
  sound: AlertTone;
  vibrate: boolean;
  notificationsEnabled: boolean;
}
