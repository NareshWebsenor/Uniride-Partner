import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';
import { clearRegistrationDraft, useRegistrationStore } from '@/store/registrationStore';
import { getRegistrationCredential, clearRegistrationCredential, saveRegistrationCredential } from '@/service/driverSession';
import { loadRegistrationForm, loadVehicleOptions, submitRegistration } from '@/service/rest/auth';
import { DriverApiError } from '@/service/rest/driverClient';
import type { Answer, RegistrationField, RegistrationForm, VehicleDraft, VehicleOptions } from '@/interface/driverRegistration.type';
import { emptyVehicleDraft } from '@/utils/registrationVehicle';

const mockNavigation = { replace: jest.fn(), reset: jest.fn() };
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNavigation }));
jest.mock('@/service/config', () => ({ DRIVER_API_URL: 'https://test.invalid/v1', DRIVER_WORKSPACE: 'test' }));
jest.mock('@/service/driverSession', () => ({
  getRegistrationCredential: jest.fn(), clearRegistrationCredential: jest.fn(), saveRegistrationCredential: jest.fn(),
}));
jest.mock('@/service/rest/auth', () => ({
  loadRegistrationForm: jest.fn(), loadVehicleOptions: jest.fn(), submitRegistration: jest.fn(),
}));

const credential = { passwordSet: true, token: 'registration-test-token', applicationId: 'application-1', email: 'test@example.invalid' };
function form(): RegistrationForm {
  return { application_id: credential.applicationId, state: 'invited', source: 'self', email: credential.email,
    driver_type: null, drive_mode: null, vehicle: null, form_version: 1, expires_at: '2099-01-01T00:00:00Z',
    reason: null, answers: {}, fields: [{ key: 'first_name', label: 'First name', type: 'text', required: true,
      enabled: true, options: [], expiry: false }] };
}
const catalog: VehicleOptions = {
  types: [{ type_id: 'car', name: 'Car' }], brands: [{ brand_id: 'brand', type_id: 'car', name: 'Brand' }],
  models: [{ model_id: 'model', brand_id: 'brand', type_id: 'car', name: 'Model', passenger_capacity: 4,
    luggage_capacity: 2, fuel_types: [] }],
};
function vehicle(): VehicleDraft {
  return { ...emptyVehicleDraft(), type_id: 'car', brand_id: 'brand', model_id: 'model',
    year: '2022', registration_number: 'dl 01 ab 1234', colour: 'White', documents: {
      registration_certificate: { name: 'rc.pdf' }, insurance: { name: 'insurance.pdf', expires_on: '2099-12-31' },
    } };
}
let result: ReturnType<typeof useDriverRegistration>;
let tree: Renderer.ReactTestRenderer | undefined;
function Harness() { result = useDriverRegistration(); return null; }
const mount = async () => { await act(async () => { tree = Renderer.create(<Harness />); }); };
const next = async () => { await act(async () => result.next()); };
const fillPersonal = async () => {
  await act(async () => useRegistrationStore.getState().updateAnswer('first_name', 'Test'));
  await next();
};
const fleetReview = async () => {
  await fillPersonal();
  await act(async () => useRegistrationStore.getState().setDriveMode('fleet_partner'));
  await next();
};
beforeEach(async () => {
  jest.clearAllMocks();
  await clearRegistrationDraft(); await AsyncStorage.clear();
  useRegistrationStore.setState({ draft: null, storageError: false });
  jest.mocked(getRegistrationCredential).mockResolvedValue(credential);
  jest.mocked(saveRegistrationCredential).mockResolvedValue(undefined);
  jest.mocked(clearRegistrationCredential).mockResolvedValue(undefined);
  jest.mocked(loadRegistrationForm).mockResolvedValue(form());
  jest.mocked(loadVehicleOptions).mockResolvedValue(catalog);
  jest.mocked(submitRegistration).mockResolvedValue({ id: credential.applicationId, state: 'pending_review' });
});
afterEach(async () => {
  await act(async () => tree?.unmount()); tree = undefined;
  await clearRegistrationDraft(); jest.useRealTimers();
});

test('loads token-scoped form, restores local edits and stores server expiry securely', async () => {
  await mount();
  expect(loadRegistrationForm).toHaveBeenCalledWith(credential.token);
  expect(saveRegistrationCredential).toHaveBeenCalledWith({ ...credential, expiresAt: form().expires_at });
  await act(async () => useRegistrationStore.getState().updateAnswer('first_name', 'Local draft'));
  await act(async () => tree?.unmount());
  useRegistrationStore.setState({ draft: null });
  await mount();
  expect(result.draft?.answers.first_name).toBe('Local draft');
  expect(mockNavigation.reset).not.toHaveBeenCalled();
});

test('fleet submission validates personal fields, omits vehicle and consumes secure credential', async () => {
  await mount(); await next();
  expect(result.step).toBe('form'); expect(result.fieldErrors.first_name).toBeTruthy();
  await fleetReview(); expect(result.step).toBe('review');
  await next();
  expect(submitRegistration).toHaveBeenCalledWith({ token: credential.token, answers: { first_name: 'Test' }, drive_mode: 'fleet_partner' });
  expect(loadVehicleOptions).not.toHaveBeenCalled();
  expect(clearRegistrationCredential).toHaveBeenCalledTimes(1);
  expect(useRegistrationStore.getState().draft?.status).toBe('pending_review');
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'RegistrationStatusScreen', params: { state: 'pending_review', email: credential.email } }] });
});

test.each<{ type: RegistrationField['type']; value: Answer }>([
  { type: 'text', value: 'wqdefr2344' },
  { type: 'date', value: '2099-11-30' },
  { type: 'email', value: 'contact@example.invalid' },
  { type: 'number', value: '42' },
  { type: 'select', value: 'Day' },
  { type: 'checkbox', value: true },
  { type: 'address', value: { line1: 'Road', city: 'Delhi', country: 'IN' } },
  { type: 'file', value: { name: 'licence.pdf', expires_on: '2099-11-30' } },
])('$type correction clears only its stale error before Continue', async ({ type, value }) => {
  const response = form();
  response.fields.push({ key: 'licence', label: 'Licence', type, required: true,
    enabled: true, options: ['Day'], expiry: true });
  jest.mocked(loadRegistrationForm).mockResolvedValueOnce(response);
  await mount();
  expect(result.fieldErrors).toEqual({});
  await next();
  expect(result.fieldErrors.licence).toBeTruthy();
  const untouchedError = result.fieldErrors.first_name;
  await act(async () => result.updateAnswer('licence', value));
  expect(result.draft?.answers.licence).toEqual(value);
  expect(result.fieldErrors.licence).toBeUndefined();
  expect(result.fieldErrors.first_name).toBe(untouchedError);
  expect(result.step).toBe('form');
  await act(async () => result.updateAnswer('licence', undefined));
  expect(result.fieldErrors.licence).toBeUndefined();
  await next();
  expect(result.fieldErrors.licence).toBeTruthy();
  expect(result.step).toBe('form');
  expect(submitRegistration).not.toHaveBeenCalled();
});

test('invalid edits stay quiet until Continue validates the latest value', async () => {
  const response = form();
  response.fields[0].validation = { minLength: 3 };
  jest.mocked(loadRegistrationForm).mockResolvedValueOnce(response);
  await mount(); await next();
  await act(async () => result.updateAnswer('first_name', 'X'));
  expect(result.fieldErrors.first_name).toBeUndefined();
  await next();
  expect(result.fieldErrors.first_name).toBeTruthy();
  expect(result.step).toBe('form');
  await act(async () => result.updateAnswer('first_name', 'Valid'));
  expect(result.fieldErrors.first_name).toBeUndefined();
  await next();
  expect(result.step).toBe('mode');
});

test('vehicle edits clear only changed scalar and document errors and revalidate on Continue', async () => {
  await mount(); await fillPersonal();
  await act(async () => useRegistrationStore.getState().setDriveMode('own_vehicle'));
  await next(); await next();
  const untouchedError = result.vehicleErrors.registration_number;
  await act(async () => result.updateVehicle({ ...emptyVehicleDraft(), year: '2022' }));
  expect(result.vehicleErrors.year).toBeUndefined();
  expect(result.vehicleErrors.insurance).toBeTruthy();
  expect(result.vehicleErrors.registration_number).toBe(untouchedError);
  await act(async () => result.updateVehicle({ ...emptyVehicleDraft(), year: '2022', documents: {
    insurance: { name: 'insurance.pdf' },
  } }));
  expect(result.vehicleErrors.insurance).toBeUndefined();
  expect(result.vehicleErrors.registration_certificate).toBeTruthy();
  await next();
  expect(result.vehicleErrors.insurance).toBeTruthy();
  await act(async () => result.updateVehicle({ ...emptyVehicleDraft(), year: '2022', documents: {
    insurance: { name: 'insurance.pdf', expires_on: '2099-11-30' },
  } }));
  expect(result.vehicleErrors.insurance).toBeUndefined();
  expect(result.vehicleErrors.registration_number).toBe(untouchedError);
  expect(result.step).toBe('vehicle');
});

test('own vehicle loads catalog, blocks missing documents, then submits allowed vehicle fields', async () => {
  await mount(); await fillPersonal();
  await act(async () => useRegistrationStore.getState().setDriveMode('own_vehicle'));
  await next(); expect(loadVehicleOptions).toHaveBeenCalledWith(credential.token);
  expect(result.step).toBe('vehicle'); await next();
  expect(result.vehicleErrors.insurance).toBeTruthy(); expect(submitRegistration).not.toHaveBeenCalled();
  await act(async () => useRegistrationStore.getState().setVehicle(vehicle()));
  await next(); expect(result.step).toBe('review'); await next();
  expect(submitRegistration).toHaveBeenCalledWith(expect.objectContaining({ drive_mode: 'own_vehicle', vehicle: {
    model_id: 'model', year: 2022, registration_number: 'DL 01 AB 1234', colour: 'White', documents: vehicle().documents,
  } }));
});

test.each([401, 409])('%s submission failure clears registration token and requests fresh verification', async status => {
  jest.mocked(submitRegistration).mockRejectedValueOnce(new DriverApiError(status, 'expired', 'Please verify your email again.'));
  await mount(); await fleetReview(); await next();
  expect(clearRegistrationCredential).toHaveBeenCalledTimes(1);
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'LoginScreen', params: {
    email: credential.email, register: true, notice: 'Please verify your email again.',
  } }] });
  expect(useRegistrationStore.getState().draft?.status).toBe('editing');
});

test('429 disables retry until server deadline and then permits submission', async () => {
  jest.useFakeTimers(); jest.setSystemTime(new Date('2026-11-18T00:00:00Z'));
  jest.mocked(submitRegistration).mockRejectedValueOnce(new DriverApiError(429, 'rate_limited', 'Wait briefly.', 3));
  await mount(); await fleetReview(); await next();
  expect(result.cooldown).toBe(3); await next();
  expect(submitRegistration).toHaveBeenCalledTimes(1); expect(mockNavigation.reset).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(3100)); await next();
  expect(submitRegistration).toHaveBeenCalledTimes(2);
  expect(mockNavigation.reset).toHaveBeenCalledTimes(1);
});

test('validation failure preserves editable draft and server message without success navigation', async () => {
  jest.mocked(submitRegistration).mockRejectedValueOnce(new DriverApiError(400, 'validation_failed', 'Driving licence is required.'));
  await mount(); await fleetReview(); await next();
  expect(result.error).toBe('Driving licence is required.'); expect(result.busy).toBe(false);
  expect(mockNavigation.reset).not.toHaveBeenCalled(); expect(clearRegistrationCredential).not.toHaveBeenCalled();
  expect(useRegistrationStore.getState().draft?.status).toBe('editing');
});

test('missing secure credential goes to verification without loading personal form', async () => {
  jest.mocked(getRegistrationCredential).mockResolvedValueOnce(null);
  await mount(); expect(loadRegistrationForm).not.toHaveBeenCalled();
  expect(mockNavigation.replace).toHaveBeenCalledWith('LoginScreen', expect.objectContaining({ register: true }));
});

test.each(['pending_review', 'activation_pending'] as const)('server terminal state %s bypasses editing', async state => {
  jest.mocked(loadRegistrationForm).mockResolvedValueOnce({ ...form(), state });
  await mount(); expect(result.form).toBeNull();
  expect(mockNavigation.replace).toHaveBeenCalledWith('RegistrationStatusScreen', { state, email: credential.email });
  expect(clearRegistrationCredential).toHaveBeenCalledTimes(1); expect(submitRegistration).not.toHaveBeenCalled();
});
