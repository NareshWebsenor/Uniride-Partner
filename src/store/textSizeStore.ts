import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { TextSize } from "@/interface/textSize.type";
import { logger } from "@/utils/logger";

const STORAGE_KEY = "text-size-preference";
let writeQueue = Promise.resolve();
let initialization: Promise<void> | undefined;
let preferenceRevision = 0;

type TextSizeStore = {
  size: TextSize;
  hasHydrated: boolean;
  persistenceError: boolean;
  saving: boolean;
  setSize: (size: TextSize) => Promise<void>;
};

export const isTextSize = (value: unknown): value is TextSize =>
  value === "small" ||
  value === "default" ||
  value === "large" ||
  value === "extraLarge";

function isStoredPreference(
  value: unknown
): value is { version: 1; size: TextSize } {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    value.version === 1 &&
    "size" in value &&
    isTextSize(value.size)
  );
}

/** Invalid/unsupported records never reach the font renderers. */
export function readTextSizePreference(value: unknown): TextSize {
  return isStoredPreference(value) ? value.size : "default";
}

export const useTextSizeStore = create<TextSizeStore>((set) => ({
  size: "default",
  hasHydrated: false,
  persistenceError: false,
  saving: false,
  setSize: (size) => {
    if (!isTextSize(size)) return Promise.resolve();
    const revision = ++preferenceRevision;
    set({ size, saving: true, persistenceError: false });
    // Immediate visual update; queued writes keep rapid selections ordered.
    writeQueue = writeQueue.then(async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ version: 1, size })
        );
        if (revision === preferenceRevision) {
          set({ saving: false, persistenceError: false });
        }
        logger.debug("text_size.saved", { scope: "preferences" });
      } catch {
        if (revision === preferenceRevision) {
          set({ saving: false, persistenceError: true });
        }
        logger.warn("text_size.persistence_failed", { scope: "preferences" });
      }
    });
    return writeQueue;
  },
}));

export function initializeTextSize(): Promise<void> {
  if (!initialization) {
    const revisionAtStart = preferenceRevision;
    initialization = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const stored: unknown = raw === null ? null : JSON.parse(raw);
        const invalid = raw !== null && !isStoredPreference(stored);
        // A user choice made before/during hydration always wins over disk.
        if (revisionAtStart === 0 && preferenceRevision === revisionAtStart) {
          useTextSizeStore.setState({
            size: readTextSizePreference(stored),
            persistenceError: invalid,
          });
        }
        if (invalid)
          logger.warn("text_size.invalid_preference", { scope: "preferences" });
      } catch {
        if (revisionAtStart === 0 && preferenceRevision === revisionAtStart) {
          useTextSizeStore.setState({
            size: "default",
            persistenceError: true,
          });
        }
        logger.warn("text_size.hydration_failed", { scope: "preferences" });
      } finally {
        useTextSizeStore.setState({ hasHydrated: true });
      }
    })();
  }
  return initialization;
}
