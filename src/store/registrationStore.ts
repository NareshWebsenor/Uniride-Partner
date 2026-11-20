import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { DRIVER_API_URL, DRIVER_WORKSPACE } from '@/service/config';
import type { Answers, Answer, DriveMode, RegistrationForm, VehicleDraft } from '@/interface/driverRegistration.type';
import { logger } from '@/utils/logger';

const STORAGE_KEY = `driver-registration-draft:${DRIVER_WORKSPACE}:${DRIVER_API_URL}`;
export type RegistrationDraft = {
  applicationId: string; email: string; revision: string;
  answers: Answers; driveMode: DriveMode | null; vehicle: VehicleDraft | null;
  status: 'editing' | 'pending_review' | 'activation_pending';
};
type State = {
  draft: RegistrationDraft | null; storageError: boolean;
  updateAnswer: (key: string, value: Answer | undefined) => void;
  setDriveMode: (mode: DriveMode) => void;
  setVehicle: (vehicle: VehicleDraft) => void;
};
let writes = Promise.resolve();
function persistDraft() {
  const snapshot = useRegistrationStore.getState().draft;
  writes = writes.then(async () => {
    try {
      if (snapshot) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      else await AsyncStorage.removeItem(STORAGE_KEY);
      useRegistrationStore.setState({ storageError: false });
    } catch {
      useRegistrationStore.setState({ storageError: true });
      logger.warn('registration.draft_save_failed', { scope: 'registration' });
    }
  });
  return writes;
}
export const useRegistrationStore = create<State>((set) => ({
  draft: null, storageError: false,
  updateAnswer: (key, value) => {
    set(state => {
      if (!state.draft) return state;
      const answers = { ...state.draft.answers };
      if (value === undefined) delete answers[key]; else answers[key] = value;
      return { draft: { ...state.draft, answers } };
    });
    void persistDraft();
  },
  setDriveMode: driveMode => {
    set(state => ({ draft: state.draft ? { ...state.draft, driveMode } : null }));
    void persistDraft();
  },
  setVehicle: vehicle => {
    set(state => ({ draft: state.draft ? { ...state.draft, vehicle } : null }));
    void persistDraft();
  },
}));

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function answer(value: unknown): value is Answer {
  if (typeof value === 'string' || typeof value === 'boolean') return true;
  if (!record(value)) return false;
  return Object.values(value).every(part => typeof part === 'string') &&
    (typeof value.name === 'string' || ['line1', 'city', 'country'].every(key => typeof value[key] === 'string'));
}
function vehicleDraft(value: unknown): value is VehicleDraft {
  if (!record(value) || !record(value.documents)) return false;
  return ['type_id', 'brand_id', 'model_id', 'fuel_type_id', 'year', 'registration_number', 'colour']
    .every(key => typeof value[key] === 'string') && Object.values(value.documents)
    .every(file => record(file) && typeof file.name === 'string' &&
      (file.expires_on === undefined || typeof file.expires_on === 'string'));
}
export async function restoreRegistrationDraft() {
  await writes;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) { useRegistrationStore.setState({ draft: null }); return; }
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || typeof value.applicationId !== 'string' || typeof value.email !== 'string' ||
      typeof value.revision !== 'string' || !record(value.answers) || !Object.values(value.answers).every(answer) ||
      !['editing', 'pending_review', 'activation_pending'].includes(String(value.status)) ||
      !(value.driveMode === null || value.driveMode === 'fleet_partner' || value.driveMode === 'own_vehicle') ||
      !(value.vehicle === null || vehicleDraft(value.vehicle))) throw new Error('invalid_draft');
    const draft: RegistrationDraft = {
      applicationId: value.applicationId, email: value.email, revision: value.revision,
      answers: Object.fromEntries(Object.entries(value.answers).filter((entry): entry is [string, Answer] => answer(entry[1]))),
      driveMode: value.driveMode, vehicle: value.vehicle,
      status: value.status === 'pending_review' ? 'pending_review' : value.status === 'activation_pending' ? 'activation_pending' : 'editing',
    };
    useRegistrationStore.setState({ draft, storageError: false });
  } catch {
    useRegistrationStore.setState({ draft: null, storageError: true });
    logger.warn('registration.draft_invalid', { scope: 'registration' });
  }
}
export async function beginRegistrationDraft(form: RegistrationForm) {
  await restoreRegistrationDraft();
  const previous = useRegistrationStore.getState().draft;
  // Admin edits/reasons/schema changes invalidate the old local baseline.
  const revision = JSON.stringify([form.form_version, form.fields, form.answers, form.vehicle, form.reason, form.drive_mode]);
  const reusable = previous?.applicationId === form.application_id && previous.email === form.email &&
    previous.revision === revision && previous.status === 'editing';
  useRegistrationStore.setState({ draft: reusable ? previous : {
    applicationId: form.application_id, email: form.email, revision,
    answers: form.answers, driveMode: form.drive_mode, vehicle: null, status: 'editing',
  } });
  await persistDraft();
}
export async function saveRegistrationStatus(applicationId: string, email: string, status: 'pending_review' | 'activation_pending') {
  useRegistrationStore.setState({ draft: { applicationId, email, status, revision: '', answers: {}, driveMode: null, vehicle: null } });
  await persistDraft();
}
export async function clearRegistrationDraft() {
  useRegistrationStore.setState({ draft: null });
  await persistDraft();
}
