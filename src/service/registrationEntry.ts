import AsyncStorage from '@react-native-async-storage/async-storage';
import { DRIVER_API_URL, DRIVER_WORKSPACE } from '@/service/config';
import type { Answers, RegistrationForm } from '@/interface/driverRegistration.type';

const KEY = `driver-registration-entry:${DRIVER_WORKSPACE}:${DRIVER_API_URL}`;
type Entry = { first_name: string; last_name: string; accept_terms: boolean };

/** Only ordinary profile fields. Password and OTP never enter this storage. */
export async function saveRegistrationEntry(applicationId: string, email: string, answers: Entry) {
  await AsyncStorage.setItem(KEY, JSON.stringify({ applicationId, email, answers }));
}
export async function registrationEntryAnswers(form: RegistrationForm): Promise<Answers> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('applicationId' in value) || value.applicationId !== form.application_id ||
      !('email' in value) || value.email !== form.email || !('answers' in value) || !value.answers || typeof value.answers !== 'object') return {};
    const candidates = value.answers;
    const answers: Answers = {};
    for (const field of form.fields) {
      if (!field.enabled || (field.key in form.answers && form.answers[field.key] !== '')) continue;
      if (['first_name', 'last_name'].includes(field.key) && field.key in candidates) {
        const saved: unknown = Reflect.get(candidates, field.key);
        if (typeof saved === 'string' && saved.trim()) answers[field.key] = saved;
      }
      if (field.key === 'accept_terms' && field.type === 'checkbox' && 'accept_terms' in candidates && candidates.accept_terms === true) answers.accept_terms = true;
    }
    return answers;
  } catch { return {}; }
}
export async function clearRegistrationEntry() { await AsyncStorage.removeItem(KEY); }
