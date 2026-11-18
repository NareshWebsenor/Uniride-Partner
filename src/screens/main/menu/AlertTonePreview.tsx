import React, { useEffect } from "react";
import { AppState, Image, StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import Video from "react-native-video";
import type { AlertTone } from "@/interface/notificationPreferences.type";
import { hp, wp } from "@/utils/responsive.utils";
import { logger } from "@/utils/logger";

const sources: Record<AlertTone, number> = {
  classic: require("@/assets/audio/alerts/classic.wav"),
  chime: require("@/assets/audio/alerts/chime.wav"),
  bell: require("@/assets/audio/alerts/bell.wav"),
  pulse: require("@/assets/audio/alerts/pulse.wav"),
};

/** One short player, destroyed on blur/background, selection change or unmount. */
export default function AlertTonePreview({
  tone,
  onStop,
  onError,
}: {
  tone: AlertTone | null;
  onStop: () => void;
  onError: () => void;
}) {
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) onStop();
  }, [focused, onStop]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") onStop();
    });
    return () => subscription.remove();
  }, [onStop]);
  if (!tone || !focused) return null;
  return (
    <Video
      key={tone}
      testID="alert-tone-player"
      source={Image.resolveAssetSource(sources[tone])}
      style={styles.player}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      controls={false}
      repeat={false}
      playInBackground={false}
      playWhenInactive={false}
      preventsDisplaySleepDuringVideoPlayback={false}
      ignoreSilentSwitch="ignore"
      showNotificationControls={false}
      onEnd={onStop}
      onAudioBecomingNoisy={onStop}
      onAudioFocusChanged={(event) => {
        if (!event.hasAudioFocus) onStop();
      }}
      onError={() => {
        logger.warn("notification_preferences.preview_failed", {
          scope: "audio",
        });
        onError();
      }}
    />
  );
}

const styles = StyleSheet.create({
  player: {
    width: wp("0.1%"),
    height: hp("0.1%"),
    opacity: 0,
    position: "absolute",
  },
});
