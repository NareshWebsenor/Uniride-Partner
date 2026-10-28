const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: mockStorage,
}));
jest.mock('../src/utils/logger', () => ({
  logger: { debug: jest.fn(), warn: jest.fn() },
}));

function loadLanguage() {
  const store =
    require('../src/store/languageStore') as typeof import('../src/store/languageStore');
  const i18n =
    require('../src/localizations').default as typeof import('../src/localizations').default;
  return { ...store, i18n };
}

beforeEach(() => {
  jest.resetModules();
  mockStorage.getItem.mockReset().mockResolvedValue(null);
  mockStorage.setItem.mockReset().mockResolvedValue(undefined);
});

test('hydrates the legacy JSON language once before screens render', async () => {
  mockStorage.getItem.mockResolvedValue(JSON.stringify('hi'));
  const { initializeLanguage, useLanguageStore, i18n } = loadLanguage();
  const first = initializeLanguage();
  expect(initializeLanguage()).toBe(first);
  await first;

  expect(mockStorage.getItem).toHaveBeenCalledTimes(1);
  expect(mockStorage.getItem).toHaveBeenCalledWith('LANGUAGE');
  expect(useLanguageStore.getState()).toMatchObject({
    language: 'hi',
    hasHydrated: true,
    error: null,
  });
  expect(i18n.resolvedLanguage).toBe('hi');
});

test.each(['"fr"', '{}', 'null', 'invalid-json'])(
  'falls back safely for invalid stored preference %s',
  async stored => {
    mockStorage.getItem.mockResolvedValue(stored);
    const { initializeLanguage, useLanguageStore, i18n } = loadLanguage();
    await initializeLanguage();
    expect(useLanguageStore.getState()).toMatchObject({
      language: 'en',
      hasHydrated: true,
    });
    expect(i18n.resolvedLanguage).toBe('en');
  },
);

test('storage read failure exposes a translated error without blocking boot', async () => {
  mockStorage.getItem.mockRejectedValue(new Error('storage unavailable'));
  const { initializeLanguage, useLanguageStore } = loadLanguage();
  await expect(initializeLanguage()).resolves.toBeUndefined();
  expect(useLanguageStore.getState()).toMatchObject({
    language: 'en',
    hasHydrated: true,
    error: 'settings.languageReadError',
  });
});

test('persists selection in the original format and restores after restart', async () => {
  let stored: string | null = null;
  mockStorage.getItem.mockImplementation(async () => stored);
  mockStorage.setItem.mockImplementation(async (_key, value: string) => {
    stored = value;
  });
  const firstSession = loadLanguage();
  await firstSession.useLanguageStore.getState().changeLanguage('hi');
  expect(mockStorage.setItem).toHaveBeenCalledWith('LANGUAGE', '"hi"');

  jest.resetModules();
  const secondSession = loadLanguage();
  await secondSession.initializeLanguage();
  expect(secondSession.useLanguageStore.getState().language).toBe('hi');
  expect(secondSession.i18n.resolvedLanguage).toBe('hi');
});

test('serializes rapid changes so the last preference wins in memory and storage', async () => {
  const { initializeLanguage, useLanguageStore, i18n } = loadLanguage();
  await initializeLanguage();
  await Promise.all([
    useLanguageStore.getState().changeLanguage('hi'),
    useLanguageStore.getState().changeLanguage('en'),
  ]);
  expect(mockStorage.setItem.mock.calls).toEqual([
    ['LANGUAGE', '"hi"'],
    ['LANGUAGE', '"en"'],
  ]);
  expect(useLanguageStore.getState().language).toBe('en');
  expect(i18n.resolvedLanguage).toBe('en');
});

test('failed writes keep the previous preference and a later retry recovers', async () => {
  mockStorage.setItem.mockRejectedValueOnce(new Error('storage full'));
  const { initializeLanguage, useLanguageStore, i18n } = loadLanguage();
  await initializeLanguage();
  await useLanguageStore.getState().changeLanguage('hi');
  expect(useLanguageStore.getState()).toMatchObject({
    language: 'en',
    error: 'settings.languageSaveError',
  });
  expect(i18n.resolvedLanguage).toBe('en');

  await useLanguageStore.getState().changeLanguage('hi');
  expect(useLanguageStore.getState()).toMatchObject({
    language: 'hi',
    error: null,
  });
  expect(i18n.resolvedLanguage).toBe('hi');
});

test('bundled resources support English fallback, interpolation and plurals', async () => {
  const { initializeLanguage, useLanguageStore, i18n } = loadLanguage();
  await initializeLanguage();
  expect(i18n.t('settings.items', { count: 1 })).toBe('1 item selected');
  expect(i18n.t('settings.items', { count: 3 })).toBe('3 items selected');
  await useLanguageStore.getState().changeLanguage('hi');

  expect(i18n.t('settings.welcome', { name: 'Test' })).toBe('नमस्ते, Test!');
  expect(i18n.t('settings.items', { count: 1 })).toBe('1 आइटम चुना गया');
  expect(i18n.t('settings.items', { count: 3 })).toBe('3 आइटम चुने गए');
  // This original Hindi bundle deliberately lacks the legacy key.
  expect(i18n.t('buttons.createAccount')).toBe('Create Account');
});
