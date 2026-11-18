import type AsyncStorage from "@react-native-async-storage/async-storage";

let storage: typeof AsyncStorage;
let preferences: typeof import("@/store/notificationPreferencesStore");
const key = "notification-preferences";
const record = (
  sound = "classic",
  vibrate = true,
  notificationsEnabled = true
) => JSON.stringify({ version: 1, sound, vibrate, notificationsEnabled });

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: Error) => void = () => {};
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

beforeEach(async () => {
  jest.resetModules();
  storage = require("@react-native-async-storage/async-storage");
  await storage.clear();
  jest.clearAllMocks();
  preferences = require("@/store/notificationPreferencesStore");
});

test("missing preferences hydrate once with defaults", async () => {
  const first = preferences.initializeNotificationPreferences();
  expect(preferences.initializeNotificationPreferences()).toBe(first);
  await first;
  expect(storage.getItem).toHaveBeenCalledTimes(1);
  expect(preferences.useNotificationPreferencesStore.getState()).toMatchObject({
    sound: "classic",
    vibrate: true,
    notificationsEnabled: true,
    hasHydrated: true,
    persistenceError: false,
  });
});

test("saved sound, vibration and notifications restore on startup", async () => {
  await storage.setItem(key, record("pulse", false, false));
  await preferences.initializeNotificationPreferences();
  expect(preferences.useNotificationPreferencesStore.getState()).toMatchObject({
    sound: "pulse",
    vibrate: false,
    notificationsEnabled: false,
  });
});

test.each([
  "{broken",
  "null",
  "[]",
  '{"version":2}',
  '{"version":1,"sound":"unknown","vibrate":true,"notificationsEnabled":true}',
])(
  "invalid storage %s falls back and a subsequent save repairs it",
  async (raw) => {
    await storage.setItem(key, raw);
    await preferences.initializeNotificationPreferences();
    expect(
      preferences.useNotificationPreferencesStore.getState()
    ).toMatchObject({
      sound: "classic",
      vibrate: true,
      notificationsEnabled: true,
      hasHydrated: true,
      persistenceError: true,
    });
    await preferences.useNotificationPreferencesStore
      .getState()
      .saveSound({ sound: "bell", vibrate: false });
    expect(await storage.getItem(key)).toBe(record("bell", false, true));
    expect(
      preferences.useNotificationPreferencesStore.getState().persistenceError
    ).toBe(false);
  }
);

test("read failure releases hydration and later notification choice recovers", async () => {
  jest
    .mocked(storage.getItem)
    .mockRejectedValueOnce(new Error("disk unavailable"));
  await preferences.initializeNotificationPreferences();
  expect(preferences.useNotificationPreferencesStore.getState()).toMatchObject({
    hasHydrated: true,
    persistenceError: true,
  });
  expect(
    await preferences.useNotificationPreferencesStore
      .getState()
      .setNotificationsEnabled(false)
  ).toBe(true);
  expect(await storage.getItem(key)).toBe(record("classic", true, false));
});

test("failed save keeps the previous committed preference and retry succeeds", async () => {
  await preferences.initializeNotificationPreferences();
  jest.mocked(storage.setItem).mockRejectedValueOnce(new Error("disk full"));
  const store = preferences.useNotificationPreferencesStore;
  expect(
    await store.getState().saveSound({ sound: "chime", vibrate: false })
  ).toBe(false);
  expect(store.getState()).toMatchObject({
    sound: "classic",
    vibrate: true,
    persistenceError: true,
    saving: false,
  });
  expect(
    await store.getState().saveSound({ sound: "chime", vibrate: false })
  ).toBe(true);
  expect(store.getState()).toMatchObject({
    sound: "chime",
    vibrate: false,
    persistenceError: false,
  });
});

test("concurrent different patches serialize and preserve each other", async () => {
  await preferences.initializeNotificationPreferences();
  const write = deferred<void>();
  jest.mocked(storage.setItem).mockImplementationOnce(() => write.promise);
  const store = preferences.useNotificationPreferencesStore;
  const sound = store.getState().saveSound({ sound: "bell", vibrate: false });
  const notifications = store.getState().setNotificationsEnabled(false);
  await Promise.resolve();
  await Promise.resolve();
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  expect(store.getState().saving).toBe(true);
  write.resolve();
  await Promise.all([sound, notifications]);
  expect(store.getState()).toMatchObject({
    sound: "bell",
    vibrate: false,
    notificationsEnabled: false,
    saving: false,
  });
  expect(await storage.getItem(key)).toBe(record("bell", false, false));
});

test("pending disk hydration finishes before merging a new choice", async () => {
  const read = deferred<string | null>();
  jest.mocked(storage.getItem).mockImplementationOnce(() => read.promise);
  const hydration = preferences.initializeNotificationPreferences();
  const save = preferences.useNotificationPreferencesStore
    .getState()
    .setNotificationsEnabled(false);
  await Promise.resolve();
  expect(storage.setItem).not.toHaveBeenCalled();
  read.resolve(record("pulse", false, true));
  await Promise.all([hydration, save]);
  expect(preferences.useNotificationPreferencesStore.getState()).toMatchObject({
    sound: "pulse",
    vibrate: false,
    notificationsEnabled: false,
  });
  expect(await storage.getItem(key)).toBe(record("pulse", false, false));
});

test("a failed earlier write cannot leave a newer successful choice in error", async () => {
  await preferences.initializeNotificationPreferences();
  const failed = deferred<void>();
  jest.mocked(storage.setItem).mockImplementationOnce(() => failed.promise);
  const store = preferences.useNotificationPreferencesStore;
  const first = store.getState().setNotificationsEnabled(false);
  const second = store.getState().saveSound({ sound: "pulse", vibrate: false });
  failed.reject(new Error("first save failed"));
  expect(await first).toBe(false);
  expect(await second).toBe(true);
  expect(store.getState()).toMatchObject({
    sound: "pulse",
    vibrate: false,
    notificationsEnabled: true,
    persistenceError: false,
    saving: false,
  });
});
