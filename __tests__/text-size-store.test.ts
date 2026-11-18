import type AsyncStorage from "@react-native-async-storage/async-storage";

let storage: typeof AsyncStorage;
let store: typeof import("@/store/textSizeStore");
const key = "text-size-preference";

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
  store = require("@/store/textSizeStore");
});

test.each(["small", "default", "large", "extraLarge"] as const)(
  "hydrates saved %s once across concurrent callers",
  async (size) => {
    await storage.setItem(key, JSON.stringify({ version: 1, size }));
    const first = store.initializeTextSize();
    expect(store.initializeTextSize()).toBe(first);
    await first;
    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(store.useTextSizeStore.getState()).toMatchObject({
      size,
      hasHydrated: true,
      persistenceError: false,
    });
  }
);

test("missing preference starts at default without reporting an error", async () => {
  await store.initializeTextSize();
  expect(store.useTextSizeStore.getState()).toMatchObject({
    size: "default",
    hasHydrated: true,
    persistenceError: false,
  });
});

test.each([
  "{corrupt",
  '{"version":1,"size":"huge"}',
  '{"version":2,"size":"large"}',
  "null",
  "[]",
])("invalid stored record %s falls back and can be repaired", async (raw) => {
  await storage.setItem(key, raw);
  await store.initializeTextSize();
  expect(store.useTextSizeStore.getState()).toMatchObject({
    size: "default",
    hasHydrated: true,
    persistenceError: true,
  });
  await store.useTextSizeStore.getState().setSize("large");
  expect(store.useTextSizeStore.getState().persistenceError).toBe(false);
  expect(
    store.readTextSizePreference(JSON.parse((await storage.getItem(key))!))
  ).toBe("large");
});

test("read errors release startup and allow a later successful save", async () => {
  jest.mocked(storage.getItem).mockRejectedValueOnce(new Error("unavailable"));
  await store.initializeTextSize();
  expect(store.useTextSizeStore.getState()).toMatchObject({
    size: "default",
    hasHydrated: true,
    persistenceError: true,
  });
  await store.useTextSizeStore.getState().setSize("small");
  expect(store.useTextSizeStore.getState()).toMatchObject({
    size: "small",
    persistenceError: false,
    saving: false,
  });
});

test("rapid choices apply immediately and serialize writes with the latest value last", async () => {
  const blocked = deferred<void>();
  jest.mocked(storage.setItem).mockImplementationOnce(() => blocked.promise);
  const first = store.useTextSizeStore.getState().setSize("large");
  const second = store.useTextSizeStore.getState().setSize("small");
  const latest = store.useTextSizeStore.getState().setSize("extraLarge");
  expect(store.useTextSizeStore.getState()).toMatchObject({
    size: "extraLarge",
    saving: true,
  });
  await Promise.resolve();
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  blocked.resolve();
  await Promise.all([first, second, latest]);
  expect(
    jest
      .mocked(storage.setItem)
      .mock.calls.map(([, raw]) => JSON.parse(raw).size)
  ).toEqual(["large", "small", "extraLarge"]);
  expect(await storage.getItem(key)).toBe(
    JSON.stringify({ version: 1, size: "extraLarge" })
  );
  expect(store.useTextSizeStore.getState()).toMatchObject({
    saving: false,
    persistenceError: false,
  });
});

test("write failure preserves the live choice and retry recovers", async () => {
  jest.mocked(storage.setItem).mockRejectedValueOnce(new Error("disk full"));
  await store.useTextSizeStore.getState().setSize("large");
  expect(store.useTextSizeStore.getState()).toMatchObject({
    size: "large",
    saving: false,
    persistenceError: true,
  });
  await store.useTextSizeStore.getState().setSize("large");
  expect(store.useTextSizeStore.getState()).toMatchObject({
    size: "large",
    saving: false,
    persistenceError: false,
  });
});

test("an older failed write cannot clear saving or flag an error on a newer choice", async () => {
  const failed = deferred<void>();
  const latestWrite = deferred<void>();
  jest
    .mocked(storage.setItem)
    .mockImplementationOnce(() => failed.promise)
    .mockImplementationOnce(() => latestWrite.promise);
  const first = store.useTextSizeStore.getState().setSize("small");
  const latest = store.useTextSizeStore.getState().setSize("large");
  failed.reject(new Error("old request"));
  await first;
  expect(store.useTextSizeStore.getState()).toMatchObject({
    size: "large",
    saving: true,
    persistenceError: false,
  });
  latestWrite.resolve();
  await latest;
  expect(store.useTextSizeStore.getState().saving).toBe(false);
});

test("late hydration does not replace a selection made while reading disk", async () => {
  const read = deferred<string | null>();
  jest.mocked(storage.getItem).mockImplementationOnce(() => read.promise);
  const hydration = store.initializeTextSize();
  await store.useTextSizeStore.getState().setSize("extraLarge");
  read.resolve(JSON.stringify({ version: 1, size: "small" }));
  await hydration;
  expect(store.useTextSizeStore.getState()).toMatchObject({
    size: "extraLarge",
    hasHydrated: true,
    persistenceError: false,
  });
});

test("hydration started after a local choice also cannot restore stale disk values", async () => {
  await store.useTextSizeStore.getState().setSize("large");
  jest
    .mocked(storage.getItem)
    .mockResolvedValueOnce(JSON.stringify({ version: 1, size: "small" }));
  await store.initializeTextSize();
  expect(store.useTextSizeStore.getState().size).toBe("large");
});
