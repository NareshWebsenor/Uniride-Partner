import { driverClient, driverRequest, parseRetryAfter } from '@/service/rest/driverClient';
import { _makeAxiosGetRequest, _makeAxiosPostRequest, client } from '@/service/rest';
import { ENDPOINTS } from '@/service/config';
import { AxiosError } from 'axios';
import { clearDriverSession, getDriverSessionToken } from '@/service/driverSession';
import {
  getDriverProfile,
  loadRegistrationForm,
  loadVehicleOptions,
  loginDriver,
  sendEmailCode,
  setRegistrationDriveMode,
  setRegistrationPassword,
  setRegistrationPhone,
  submitRegistration,
  uploadRegistrationFile,
  verifyEmailCode,
  verifyInvitationCode,
  verifyRegistrationPhone,
} from '@/service/rest/auth';

jest.mock('@/service/config', () => ({ ...jest.requireActual('@/service/config'), DRIVER_API_URL: 'https://driver.example/v1', DRIVER_WORKSPACE: 'uniride' }));
jest.mock('@/service/driverSession', () => ({
  ...jest.requireActual('@/service/driverSession'),
  clearDriverSession: jest.fn().mockResolvedValue(undefined),
  getDriverSessionToken: jest.fn().mockResolvedValue('login-session'),
}));
jest.mock('react-native-keychain', () => ({}));
jest.mock('@/utils/helper.utils', () => ({ getAsyncStorage: jest.fn().mockResolvedValue(null) }));

let fetchMock: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>;
const respond = (data: unknown, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers });
const originalAdapter = driverClient.defaults.adapter;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.spyOn(global, 'fetch');
  // Fake server boundary, while exercising real Axios serialization, transforms,
  // configuration and cancellation. Production uses Axios's native adapter.
  driverClient.defaults.adapter = async config => {
    const response = await fetch(driverClient.getUri(config), {
      method: config.method?.toUpperCase(),
      headers: Object.fromEntries(Object.entries(config.headers.toJSON()).map(([key, value]) => [key, String(value)])),
      body: config.data,
      signal: config.signal instanceof AbortSignal ? config.signal : undefined,
    });
    return { data: await response.text(), status: response.status,
      statusText: response.statusText, headers: Object.fromEntries(response.headers.entries()), config };
  };
});
afterEach(() => { driverClient.defaults.adapter = originalAdapter; jest.restoreAllMocks(); jest.useRealTimers(); });

it('shared GET helper and getDriverProfile use driver session and return body', async () => {
  fetchMock
    .mockResolvedValueOnce(respond({ id: 'user-1', driver_id: 'drv-1', email: 'driver@example.com', name: 'Ravi Kumar' }))
    .mockResolvedValueOnce(respond({ id: 'user-1' }));
  const legacyGet = jest.spyOn(client, 'get');
  await expect(getDriverProfile()).resolves.toEqual({
    id: 'user-1', driver_id: 'drv-1', email: 'driver@example.com', name: 'Ravi Kumar',
  });
  expect(fetchMock).toHaveBeenCalledWith('https://driver.example/v1/driver/me', expect.objectContaining({
    method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer login-session', 'X-Uniride-Workspace': 'uniride' }),
  }));
  expect(legacyGet).not.toHaveBeenCalled();

  await expect(_makeAxiosGetRequest('/driver/me', { search: 'a&b' }, { api: 'driver', authenticated: true }))
    .resolves.toMatchObject({ id: 'user-1' });
  expect(fetchMock).toHaveBeenLastCalledWith('https://driver.example/v1/driver/me?search=a%26b', expect.anything());
});

it('form stays POST and public when called through the shared helper', async () => {
  fetchMock.mockResolvedValue(respond({ ...formBody, fields: [nameField], answers: {} }));
  const legacyPost = jest.spyOn(client, 'post');
  await loadRegistrationForm('registration-token');
  expect(fetchMock).toHaveBeenCalledWith('https://driver.example/v1/driver-registration/form', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ token: 'registration-token' }),
  }));
  expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty('Authorization');
  expect(getDriverSessionToken).not.toHaveBeenCalled();
  expect(legacyPost).not.toHaveBeenCalled();
});

it('legacy helper calls keep their existing client', async () => {
  const post = jest.spyOn(client, 'post').mockResolvedValue({ success: true });
  await expect(_makeAxiosPostRequest(ENDPOINTS.AUTH.LOGIN, { example: true })).resolves.toEqual({ success: true });
  expect(post).toHaveBeenCalledWith(ENDPOINTS.AUTH.LOGIN, { example: true }, {});
  expect(fetchMock).not.toHaveBeenCalled();
});

it('maps Axios native timeout to the existing driver error contract', async () => {
  driverClient.defaults.adapter = async () => { throw new AxiosError('private details', 'ECONNABORTED'); };
  await expect(loadRegistrationForm('token')).rejects.toMatchObject({ code: 'timeout', message: '' });
});

it('caller cancellation aborts the Axios request without waiting for timeout', async () => {
  fetchMock.mockImplementation(() => new Promise(() => {}));
  const controller = new AbortController();
  const pending = expect(_makeAxiosPostRequest(ENDPOINTS.DRIVER_REGISTRATION.FORM, { token: 'token' }, {
    api: 'driver', signal: controller.signal,
  })).rejects.toMatchObject({ code: 'aborted' });
  controller.abort();
  await pending;
  expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
});

it('phone and phone/verify endpoints send registration token and 4-digit code without login bearer', async () => {
  fetchMock.mockResolvedValueOnce(respond({ phone: '+919812345678', development_code: '4821' }));
  await expect(setRegistrationPhone('registration-token', '+919812345678')).resolves.toEqual({
    phone: '+919812345678', development_code: '4821',
  });
  expect(fetchMock).toHaveBeenCalledWith('https://driver.example/v1/driver-registration/phone', expect.objectContaining({
    method: 'POST', headers: expect.objectContaining({ 'Content-Type': 'application/json', 'X-Uniride-Workspace': 'uniride' }),
    body: JSON.stringify({ token: 'registration-token', phone: '+919812345678' }),
  }));

  fetchMock.mockResolvedValueOnce(respond({ phone: '+919812345678', phone_verified: true }));
  await expect(verifyRegistrationPhone('registration-token', '4821')).resolves.toEqual({
    phone: '+919812345678', phone_verified: true,
  });
  expect(fetchMock).toHaveBeenLastCalledWith('https://driver.example/v1/driver-registration/phone/verify', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ token: 'registration-token', code: '4821' }),
  }));
  expect(getDriverSessionToken).not.toHaveBeenCalled();
});

it.each([null, {}, { phone: 919812345678 }, { phone: '' }, { phone: ' ' }])('rejects malformed phone response %o', async body => {
  fetchMock.mockResolvedValue(respond(body));
  await expect(setRegistrationPhone('registration-token', '+919812345678')).rejects.toMatchObject({ code: 'invalid_response' });
});

it.each([null, {}, { phone: '+919812345678', phone_verified: false }])('rejects invalid phone verify response %o', async body => {
  fetchMock.mockResolvedValue(respond(body));
  await expect(verifyRegistrationPhone('registration-token', '4821')).rejects.toMatchObject({ code: 'invalid_response' });
});

it('drive-mode and invitation-code endpoints send token and validate responses', async () => {
  fetchMock.mockResolvedValueOnce(respond({ invitation_code_required: true }));
  await expect(setRegistrationDriveMode('registration-token', 'fleet_partner')).resolves.toEqual({
    invitation_code_required: true,
  });
  expect(fetchMock).toHaveBeenCalledWith('https://driver.example/v1/driver-registration/drive-mode', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ token: 'registration-token', drive_mode: 'fleet_partner' }),
  }));

  fetchMock.mockResolvedValueOnce(respond({ invitation_code_accepted: true }));
  await expect(verifyInvitationCode('registration-token', '123456')).resolves.toEqual({
    invitation_code_accepted: true,
  });
  expect(fetchMock).toHaveBeenLastCalledWith('https://driver.example/v1/driver-registration/invitation-code', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ token: 'registration-token', code: '123456' }),
  }));
});

it('password endpoint sends only token and password with workspace, without login bearer', async () => {
  fetchMock.mockResolvedValue(respond({ password_set: true }));
  await expect(setRegistrationPassword('registration-token', 'Ravi@1234')).resolves.toEqual({ password_set: true });
  expect(fetchMock).toHaveBeenCalledWith('https://driver.example/v1/driver-registration/password', expect.objectContaining({
    method: 'POST', headers: expect.objectContaining({ 'Content-Type': 'application/json', 'X-Uniride-Workspace': 'uniride' }),
    body: JSON.stringify({ token: 'registration-token', password: 'Ravi@1234' }),
  }));
  expect(getDriverSessionToken).not.toHaveBeenCalled();
});

it.each([{ password_set: false }, {}, { password_set: 'true' }])('does not accept unsuccessful password response %o', async body => {
  fetchMock.mockResolvedValue(respond(body));
  await expect(setRegistrationPassword('registration-token', 'Ravi@1234')).rejects.toMatchObject({ code: 'invalid_response' });
});

it('submit excludes email, phone, and accept_terms from answers and sends accept_terms: true', async () => {
  fetchMock.mockResolvedValue(respond({ state: 'pending_review' }));
  await expect(submitRegistration({
    token: 'token',
    answers: { first_name: 'Ravi', email: 'ravi@example.com', phone: '+919876543210', mobile_number: '9876543210', accept_terms: true },
    accept_terms: true,
  })).resolves.toEqual({ state: 'pending_review' });
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
    token: 'token', answers: { first_name: 'Ravi' }, accept_terms: true,
  });
});

it('registration sends email-only payload without a login bearer; 4-digit dev code dev-only', async () => {
  fetchMock.mockResolvedValue(respond({ message: 'Sent', expires_in: 600, email_sent: true, development_code: '1234' }));
  expect(await sendEmailCode({ email: 'driver@example.com' })).toEqual({ message: 'Sent', expires_in: 600, email_sent: true, development_code: '1234' });
  expect(fetchMock).toHaveBeenCalledWith('https://driver.example/v1/driver-registration/email-code', expect.objectContaining({
    method: 'POST', headers: expect.objectContaining({ 'Content-Type': 'application/json', 'X-Uniride-Workspace': 'uniride' }),
    body: JSON.stringify({ email: 'driver@example.com' }),
  }));
  expect(getDriverSessionToken).not.toHaveBeenCalled();
});

it('production discards development code even if misconfigured backend sends it', async () => {
  const original = Reflect.get(global, '__DEV__');
  Reflect.set(global, '__DEV__', false);
  try {
    fetchMock.mockResolvedValue(respond({ message: 'Sent', expires_in: 600, email_sent: true, development_code: '1234' }));
    expect(await sendEmailCode({ email: 'driver@example.com' })).not.toHaveProperty('development_code');
  } finally { Reflect.set(global, '__DEV__', original); }
});

it('authenticated driver API uses session and never refreshes after 401', async () => {
  fetchMock.mockResolvedValue(respond({ error: { code: 'unauthorized', message: 'Please log in' } }, 401));
  await expect(driverRequest('/driver/me', { authenticated: true })).rejects.toMatchObject({ status: 401, message: 'Please log in' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer login-session' });
  expect(clearDriverSession).toHaveBeenCalledTimes(1);
});

it('public OTP 401 does not clear a logged-in session', async () => {
  fetchMock.mockResolvedValue(respond({ error: { code: 'invalid_code', message: 'Wrong code' } }, 401));
  await expect(verifyEmailCode('driver@example.com', '1234')).rejects.toMatchObject({ status: 401, message: 'Wrong code' });
  expect(clearDriverSession).not.toHaveBeenCalled();
});

it('preserves end-user server error and Retry-After', async () => {
  fetchMock.mockResolvedValue(respond({ error: { code: 'rate_limited', message: 'Wait before retrying', detail: 'private' } }, 429, { 'Retry-After': '71' }));
  await expect(sendEmailCode({ email: 'driver@example.com' })).rejects.toMatchObject({ status: 429, code: 'rate_limited', message: 'Wait before retrying', retryAfterSeconds: 71 });
});

it('parses HTTP-date retry header without negative or NaN countdowns', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
  expect(parseRetryAfter('Thu, 01 Jan 2026 00:01:00 GMT')).toBe(60);
  expect(parseRetryAfter('Wed, 31 Dec 2025 00:00:00 GMT')).toBe(0);
  expect(parseRetryAfter('invalid')).toBeUndefined();
});

it.each(['invited', 'changes_requested'] as const)('verifies editable %s state with phone flags', async state => {
  fetchMock.mockResolvedValue(respond({
    state, application_id: 'application', token: 'registration-token',
    phone_required: true, phone_verified: false, reason: 'Fix licence',
  }));
  await expect(verifyEmailCode('driver@example.com', '1234')).resolves.toEqual({
    state, application_id: 'application', token: 'registration-token',
    phone_required: true, phone_verified: false, reason: 'Fix licence',
  });
});

it.each(['pending_review', 'activation_pending', 'active'] as const)('verifies non-editable %s without exposing extra token', async state => {
  fetchMock.mockResolvedValue(respond({ state, application_id: 'application', token: 'extra' }));
  await expect(verifyEmailCode('driver@example.com', '1234')).resolves.toEqual({ state, application_id: 'application' });
});

it.each([{ state: 'unknown' }, { state: 'invited', token: 't' }, null])('rejects invalid verification response', async data => {
  fetchMock.mockResolvedValue(respond(data));
  await expect(verifyEmailCode('driver@example.com', '1234')).rejects.toMatchObject({ code: 'invalid_response' });
});

it('rejects malformed login and dynamic form', async () => {
  fetchMock.mockResolvedValue(respond({ session: 'token' }));
  await expect(loginDriver('driver@example.com', 'password')).rejects.toMatchObject({ code: 'invalid_response' });
  fetchMock.mockResolvedValue(respond({ fields: [] }));
  await expect(loadRegistrationForm('token')).rejects.toMatchObject({ code: 'invalid_response' });
});

it('uploads raw bytes with invitation header; no multipart or login bearer', async () => {
  const blob = new Blob(['test-file'], { type: 'application/pdf', lastModified: 0 });
  fetchMock.mockResolvedValueOnce(new Response(blob)).mockResolvedValueOnce(respond({ name: 'server-file.pdf' }, 201));
  await expect(uploadRegistrationFile('registration-token', { uri: 'file:///tmp/file.pdf', name: 'file.pdf', mime: 'application/pdf', size: blob.size })).resolves.toEqual({ name: 'server-file.pdf' });
  const request = fetchMock.mock.calls[1][1];
  expect(request?.headers).toMatchObject({ 'Content-Type': 'application/pdf', 'X-Uniride-Workspace': 'uniride', 'X-Driver-Invitation': 'registration-token' });
  expect(request?.headers).not.toHaveProperty('Authorization');
  expect(request?.body).toBeInstanceOf(Blob);
  expect(getDriverSessionToken).not.toHaveBeenCalled();
});

it('preserves React Native style Blob without JSON stringification during raw upload', async () => {
  class FakeRnBlob {
    _data = { blobId: 'native-blob', offset: 0, size: 12 };
    size = 12;
    type = 'image/jpeg';
  }
  const rnStyleBlob = new FakeRnBlob();
  let receivedData: unknown;
  driverClient.defaults.adapter = async config => {
    receivedData = config.data;
    return {
      data: JSON.stringify({ name: 'photo.jpg' }),
      status: 201,
      statusText: 'Created',
      headers: {},
      config,
    };
  };
  await expect(driverRequest('/driver-registration/files', {
    method: 'POST',
    rawBody: rnStyleBlob as unknown as Blob,
    headers: { 'X-Driver-Invitation': 'token', 'Content-Type': 'image/jpeg' },
  })).resolves.toEqual({ name: 'photo.jpg' });
  expect(receivedData).toBe(rnStyleBlob);
});

it.each([
  { size: 5 * 1024 * 1024 + 1, mime: 'image/png', code: 'file_too_large' },
  { size: 10, mime: 'image/heic', code: 'unsupported_file' },
  { size: -1, mime: 'image/png', code: 'invalid_file' },
])('rejects unsupported/oversized file before reading it', async ({ size, mime, code }) => {
  await expect(uploadRegistrationFile('token', { uri: 'file:///test', name: 'file', mime, size })).rejects.toMatchObject({ code });
  expect(fetchMock).not.toHaveBeenCalled();
});

it('rejects a blob larger than reported metadata', async () => {
  fetchMock.mockResolvedValueOnce(new Response(new Blob(['a'.repeat(5 * 1024 * 1024 + 1)])));
  await expect(uploadRegistrationFile('token', { uri: 'file:///test', name: 'file', mime: 'image/png', size: 1 })).rejects.toMatchObject({ status: 413 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('reads unknown-size provider metadata and uploads only valid actual bytes', async () => {
  fetchMock.mockResolvedValueOnce(new Response(new Blob(['file bytes'])))
    .mockResolvedValueOnce(respond({ name: 'stored.pdf' }, 201));
  await expect(uploadRegistrationFile('token', { uri: 'content://documents/123', name: 'file.pdf', mime: 'application/pdf', size: 0 }))
    .resolves.toEqual({ name: 'stored.pdf' });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it.each([0, 5 * 1024 * 1024 + 1])('unknown metadata cannot bypass actual byte limit: %s', async size => {
  fetchMock.mockResolvedValueOnce(new Response(new Blob(['a'.repeat(size)])));
  await expect(uploadRegistrationFile('token', { uri: 'content://documents/123', name: 'file.pdf', mime: 'application/pdf', size: 0 }))
    .rejects.toMatchObject({ code: size ? 'file_too_large' : 'invalid_file' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('streams { uri } directly on React Native when reading the local blob fails', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { product: 'ReactNative' },
  });
  try {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(respond({ name: 'rn-stream.jpg' }, 201));
    await expect(
      uploadRegistrationFile('registration-token', {
        uri: 'file:///tmp/photo.jpg',
        name: 'photo.jpg',
        mime: 'image/jpeg',
        size: 0,
      }),
    ).resolves.toEqual({ name: 'rn-stream.jpg' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://driver.example/v1/driver-registration/files');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'X-Driver-Invitation': 'registration-token',
      'Content-Type': 'image/jpeg',
    });
    expect(init?.body).toEqual({ uri: 'file:///tmp/photo.jpg' });
  } finally {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', originalNavigator);
    } else {
      delete (globalThis as { navigator?: unknown }).navigator;
    }
  }
});

const formBody = {
  application_id: 'app', state: 'invited', source: 'self', email: 'test@example.com',
  driver_type: null, drive_mode: null, vehicle: null, form_version: 1,
  expires_at: '2030-01-01T00:00:00Z', reason: null,
};
const nameField = { key: 'first_name', label: 'First name', type: 'text', required: true, enabled: true, options: [], expiry: false };

it('ignores disabled unknown controls and their unsupported answers, keeping enabled order', async () => {
  const unknownField = { key: 'future_field', label: 'Future', type: 'new_widget', enabled: false };
  fetchMock.mockResolvedValueOnce(respond({ ...formBody,
    fields: [unknownField, nameField, { ...nameField, key: 'last_name' }],
    answers: { future_field: [1, 2], first_name: 'Ravi' },
  }));
  const result = await loadRegistrationForm('token');
  expect(result.fields.map(item => item.key)).toEqual(['first_name', 'last_name']);
  expect(result.answers).toEqual({ first_name: 'Ravi' });
});

it('fails closed on enabled unknown controls instead of silently submitting an incomplete form', async () => {
  fetchMock.mockResolvedValueOnce(respond({ ...formBody, answers: {}, fields: [{ ...nameField, type: 'new_widget' }] }));
  await expect(loadRegistrationForm('token')).rejects.toMatchObject({ code: 'invalid_response' });
});

it('times out and aborts hung transport', async () => {
  jest.useFakeTimers(); fetchMock.mockImplementation(() => new Promise(() => {}));
  const pending = expect(driverRequest('/driver-registration/form', { body: { token: 'token' } })).rejects.toMatchObject({ code: 'timeout' });
  await jest.advanceTimersByTimeAsync(30000); await pending;
  expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
});

it('handles network and non-JSON dependency failure without raw error leakage', async () => {
  fetchMock.mockRejectedValueOnce(new Error('private raw details'));
  await expect(sendEmailCode({ email: 'driver@example.com' })).rejects.toMatchObject({ code: 'network', message: '' });
  fetchMock.mockResolvedValueOnce(new Response('proxy down', { status: 503 }));
  await expect(sendEmailCode({ email: 'driver@example.com' })).rejects.toMatchObject({ status: 503, message: '' });
});

it('normalizes vehicle options without optional capacities or fuel_types and preserves dynamic fields/categories', async () => {
  fetchMock.mockResolvedValueOnce(respond({
    fields: [
      { key: 'vehicle_registration_certificate_rc', type: 'file', label: 'Vehicle registration certificate (RC)', expiry: false, enabled: true, options: [], required: true, validation: {} },
      { key: 'insurance_expiry', type: 'date', label: 'Insurance expiry', expiry: false, enabled: true, options: [], required: true, validation: {} },
    ],
    categories: [{ category_id: 'cat-1', name: 'Sedan', booking_tier: 'regular', image_url: null }],
    types: [{ type_id: 'car', name: 'Car' }],
    brands: [{ brand_id: 'b1', type_id: 'car', name: 'Toyota' }],
    models: [{ model_id: 'm1', brand_id: 'b1', type_id: 'car', name: 'Camry', passenger_capacity: null, luggage_capacity: null }],
  }));
  await expect(loadVehicleOptions('token')).resolves.toEqual({
    fields: [
      { key: 'vehicle_registration_certificate_rc', type: 'file', label: 'Vehicle registration certificate (RC)', expiry: false, enabled: true, options: [], required: true, validation: {} },
      { key: 'insurance_expiry', type: 'date', label: 'Insurance expiry', expiry: false, enabled: true, options: [], required: true, validation: {} },
    ],
    categories: [{ category_id: 'cat-1', name: 'Sedan', booking_tier: 'regular', image_url: null }],
    types: [{ type_id: 'car', name: 'Car' }],
    brands: [{ brand_id: 'b1', type_id: 'car', name: 'Toyota' }],
    models: [{ model_id: 'm1', brand_id: 'b1', type_id: 'car', name: 'Camry', passenger_capacity: 0, luggage_capacity: 0, fuel_types: [] }],
  });

  fetchMock.mockResolvedValueOnce(respond({ code: 'bad_request', message: 'Vehicle catalog unavailable.' }, 400));
  await expect(loadVehicleOptions('token')).rejects.toMatchObject({
    status: 400, code: 'bad_request', message: 'Vehicle catalog unavailable.',
  });
});
