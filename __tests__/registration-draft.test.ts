import AsyncStorage from '@react-native-async-storage/async-storage';
import { beginRegistrationDraft, clearRegistrationDraft, restoreRegistrationDraft, saveRegistrationStatus, useRegistrationStore } from '@/store/registrationStore';
import type { RegistrationForm } from '@/interface/driverRegistration.type';

jest.mock('@/service/config', () => ({ DRIVER_API_URL: 'https://test.invalid/v1', DRIVER_WORKSPACE: 'test' }));
const storageKey = 'driver-registration-draft:test:https://test.invalid/v1';
function form(): RegistrationForm {
  return { application_id: 'application-1', state: 'invited', source: 'self', email: 'test@example.invalid',
    driver_type: null, drive_mode: null, vehicle: null, form_version: 1, expires_at: '2099-01-01T00:00:00Z',
    reason: null, answers: { first_name: 'Server value' }, fields: [{ key: 'first_name', label: 'First name', type: 'text',
      enabled: true, required: true, options: [], expiry: false }] };
}
beforeEach(async () => {
  await clearRegistrationDraft(); await AsyncStorage.clear();
  useRegistrationStore.setState({ draft: null, storageError: false });
});
afterEach(async () => { jest.restoreAllMocks(); await clearRegistrationDraft(); });

test('restores in-progress answers and uploaded names for unchanged server revision', async () => {
  await beginRegistrationDraft(form());
  useRegistrationStore.getState().updateAnswer('first_name', 'Local edit');
  useRegistrationStore.getState().updateAnswer('licence_front', { name: 'upload.jpg', expires_on: '2099-01-01' });
  useRegistrationStore.getState().setDriveMode('fleet_partner');
  await restoreRegistrationDraft();
  useRegistrationStore.setState({ draft: null });
  await beginRegistrationDraft(form());
  expect(useRegistrationStore.getState().draft).toEqual(expect.objectContaining({
    answers: { first_name: 'Local edit', licence_front: { name: 'upload.jpg', expires_on: '2099-01-01' } },
    driveMode: 'fleet_partner', status: 'editing',
  }));
  const raw = JSON.parse((await AsyncStorage.getItem(storageKey))!);
  expect(raw).not.toHaveProperty('token'); expect(raw).not.toHaveProperty('session'); expect(raw).not.toHaveProperty('password');
});

test.each(['answers', 'reason', 'schema', 'application', 'email'] as const)('server %s change replaces stale local draft', async changed => {
  await beginRegistrationDraft(form());
  useRegistrationStore.getState().updateAnswer('first_name', 'Stale local edit');
  const updated = form();
  if (changed === 'answers') updated.answers = { first_name: 'Admin correction' };
  if (changed === 'reason') { updated.state = 'changes_requested'; updated.reason = 'Replace blurry image'; }
  if (changed === 'schema') updated.form_version = 2;
  if (changed === 'application') updated.application_id = 'application-2';
  if (changed === 'email') updated.email = 'different@example.invalid';
  await beginRegistrationDraft(updated);
  expect(useRegistrationStore.getState().draft?.answers.first_name).toBe(updated.answers.first_name);
  expect(useRegistrationStore.getState().draft?.applicationId).toBe(updated.application_id);
});

test('terminal status drops form/vehicle data and survives restart', async () => {
  await beginRegistrationDraft(form());
  await saveRegistrationStatus('application-1', form().email, 'pending_review');
  useRegistrationStore.setState({ draft: null });
  await restoreRegistrationDraft();
  expect(useRegistrationStore.getState().draft).toEqual({ applicationId: 'application-1', email: form().email,
    status: 'pending_review', revision: '', answers: {}, driveMode: null, vehicle: null });
});

test('corrupt persisted draft fails closed with recoverable storage error', async () => {
  await AsyncStorage.setItem(storageKey, '{bad json');
  await restoreRegistrationDraft();
  expect(useRegistrationStore.getState().draft).toBeNull(); expect(useRegistrationStore.getState().storageError).toBe(true);
  await AsyncStorage.setItem(storageKey, JSON.stringify({ applicationId: 'application-1', email: form().email,
    revision: '', status: 'editing', answers: { invalid: 99 }, driveMode: null, vehicle: null }));
  await restoreRegistrationDraft(); expect(useRegistrationStore.getState().draft).toBeNull();
});

test('failed storage writes preserve memory and expose error to form', async () => {
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage unavailable'));
  await beginRegistrationDraft(form());
  expect(useRegistrationStore.getState().draft?.answers.first_name).toBe('Server value');
  expect(useRegistrationStore.getState().storageError).toBe(true);
});
