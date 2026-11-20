import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useRetryCountdown } from '@/hooks/useRetryCountdown';
import { getRegistrationCredential, clearRegistrationCredential, saveRegistrationCredential } from '@/service/driverSession';
import { loadRegistrationForm, loadVehicleOptions, submitRegistration } from '@/service/rest/auth';
import { DriverApiError } from '@/service/rest/driverClient';
import { beginRegistrationDraft, saveRegistrationStatus, useRegistrationStore } from '@/store/registrationStore';
import { cleanAnswers, validateAnswers } from '@/utils/registrationValidation';
import { buildVehicle, emptyVehicleDraft, validateVehicle, vehicleToDraft } from '@/utils/registrationVehicle';
import { driverErrorMessage } from '@/utils/driverApiError';
import type { Answer, RegistrationCredential, RegistrationForm, VehicleDraft, VehicleOptions } from '@/interface/driverRegistration.type';
import type { TRootStack } from '@/interface/navigation.type';
import { registrationEntryAnswers } from '@/service/registrationEntry';

export type RegistrationStep = 'form' | 'mode' | 'vehicle' | 'review';
export function useDriverRegistration() {
  const navigation = useNavigation<NativeStackNavigationProp<TRootStack>>();
  const { t } = useAppTranslation();
  const draft = useRegistrationStore(state => state.draft);
  const storageError = useRegistrationStore(state => state.storageError);
  const [credential, setCredential] = useState<RegistrationCredential | null>(null);
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [options, setOptions] = useState<VehicleOptions | null>(null);
  const [step, setStep] = useState<RegistrationStep>('form');
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [vehicleErrors, setVehicleErrors] = useState<Record<string, string>>({});
  const [lockedUntil, setLockedUntil] = useState(0);
  const cooldown = useRetryCountdown(lockedUntil);
  const active = useRef(true);
  const credentialRef = useRef<RegistrationCredential | null>(null);
  const running = useRef(false);
  const errorHandler = async (failure: unknown) => {
    if (!active.current) return;
    const message = driverErrorMessage(failure);
    setError(message);
    if (failure instanceof DriverApiError && failure.status === 429) {
      setLockedUntil(Date.now() + (failure.retryAfterSeconds ?? 60) * 1000);
    }
    if (failure instanceof DriverApiError && [401, 409].includes(failure.status)) {
      try {
        await clearRegistrationCredential();
        const email = credentialRef.current?.email ?? useRegistrationStore.getState().draft?.email;
        if (active.current) navigation.reset({ index: 0, routes: [{ name: 'LoginScreen', params: {
          email, register: true, notice: message,
        } }] });
      } catch { if (active.current) setError(t('driverRegistration.storageFailed')); }
    }
  };
  const run = async (operation: () => Promise<void>) => {
    if (running.current || lockedUntil > Date.now()) return;
    running.current = true; setBusy(true); setError('');
    try { await operation(); }
    catch (failure) { await errorHandler(failure); }
    finally { running.current = false; if (active.current) setBusy(false); }
  };
  const load = () => void run(async () => {
    const saved = await getRegistrationCredential();
    if (!active.current) return;
    if (!saved) {
      navigation.replace('LoginScreen', { register: true, notice: t('driverRegistration.verifyAgain') });
      return;
    }
    setCredential(saved);
    credentialRef.current = saved;
    const response = await loadRegistrationForm(saved.token);
    if (!active.current) return;
    if (response.state === 'pending_review' || response.state === 'activation_pending') {
      await saveRegistrationStatus(response.application_id, response.email, response.state);
      await clearRegistrationCredential();
      if (active.current) navigation.replace('RegistrationStatusScreen', { state: response.state, email: response.email });
      return;
    }
    if (response.state === 'active') {
      await clearRegistrationCredential();
      if (active.current) navigation.replace('LoginScreen', { email: response.email, notice: t('driverRegistration.activeNotice') });
      return;
    }
    await saveRegistrationCredential({ ...saved, expiresAt: response.expires_at });
    if (!saved.passwordSet) {
      if (active.current) navigation.replace('LoginScreen');
      return;
    }
    await beginRegistrationDraft(response);
    const entryAnswers = await registrationEntryAnswers(response);
    for (const [key, value] of Object.entries(entryAnswers)) {
      const current = useRegistrationStore.getState().draft?.answers[key];
      if (current === undefined || current === '') useRegistrationStore.getState().updateAnswer(key, value);
    }
    if (active.current) setForm(response);
  });
  useEffect(() => {
    active.current = true; load();
    return () => { active.current = false; };
    // Loading is per screen entry, not on translated copy changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onBusyChange = useCallback((uploading: boolean) => setUploads(count => Math.max(0, count + (uploading ? 1 : -1))), []);
  const onApiError = (failure: unknown) => { void errorHandler(failure); };
  const updateAnswer = useCallback((key: string, value: Answer | undefined) => {
    useRegistrationStore.getState().updateAnswer(key, value);
    setFieldErrors(previous => {
      if (!(key in previous)) return previous;
      const remaining = { ...previous };
      delete remaining[key];
      return remaining;
    });
  }, []);
  const updateVehicle = useCallback((value: VehicleDraft) => {
    const previous = useRegistrationStore.getState().draft?.vehicle;
    useRegistrationStore.getState().setVehicle(value);
    setVehicleErrors(errors => {
      const remaining = { ...errors };
      for (const key of ['type_id', 'brand_id', 'model_id', 'fuel_type_id', 'year', 'registration_number', 'colour'] as const) {
        if (previous?.[key] !== value[key]) delete remaining[key];
      }
      for (const key of ['registration_certificate', 'insurance', 'pollution_certificate'] as const) {
        if (previous?.documents[key] !== value.documents[key]) delete remaining[key];
      }
      return remaining;
    });
  }, []);
  const next = () => {
    if (!form || !credential || !draft || busy || uploads || cooldown) return;
    setError('');
    if (step === 'form') {
      const errors = validateAnswers(form.fields, draft.answers, form.email);
      setFieldErrors(errors);
      if (!Object.keys(errors).length) setStep('mode');
    } else if (step === 'mode') {
      if (!draft.driveMode) { setError(t('driverRegistration.chooseMode')); return; }
      if (draft.driveMode === 'fleet_partner') { setStep('review'); return; }
      void run(async () => {
        const catalog = options ?? await loadVehicleOptions(credential.token);
        if (!active.current) return;
        setOptions(catalog);
        if (!useRegistrationStore.getState().draft?.vehicle) {
          useRegistrationStore.getState().setVehicle(form.vehicle ? vehicleToDraft(form.vehicle, catalog) : emptyVehicleDraft());
        }
        setStep('vehicle');
      });
    } else if (step === 'vehicle' && draft.vehicle && options) {
      const errors = validateVehicle(draft.vehicle, options);
      setVehicleErrors(errors);
      if (!Object.keys(errors).length) setStep('review');
    } else if (step === 'review') {
      const errors = validateAnswers(form.fields, draft.answers, form.email);
      if (Object.keys(errors).length) { setFieldErrors(errors); setStep('form'); return; }
      if (!draft.driveMode) { setStep('mode'); return; }
      if (draft.driveMode === 'own_vehicle') {
        if (!draft.vehicle || !options) { setStep('mode'); return; }
        const invalidVehicle = validateVehicle(draft.vehicle, options);
        if (Object.keys(invalidVehicle).length) { setVehicleErrors(invalidVehicle); setStep('vehicle'); return; }
      }
      const driveMode = draft.driveMode;
      void run(async () => {
        const response = await submitRegistration({
          token: credential.token,
          answers: cleanAnswers(form.fields, draft.answers, form.email),
          drive_mode: driveMode,
          ...(draft.driveMode === 'own_vehicle' && draft.vehicle ? { vehicle: buildVehicle(draft.vehicle) } : {}),
        });
        // Save terminal state before deleting the consumed credential for crash recovery.
        await saveRegistrationStatus(response.id, form.email, 'pending_review');
        await clearRegistrationCredential();
        if (active.current) navigation.reset({ index: 0, routes: [{ name: 'RegistrationStatusScreen', params: { state: 'pending_review', email: form.email } }] });
      });
    }
  };
  const back = useCallback(() => {
    if (running.current || uploads > 0) return true;
    if (step === 'form') navigation.replace('LoginScreen', { email: draft?.email, register: true });
    else setStep(step === 'review' ? draft?.driveMode === 'own_vehicle' ? 'vehicle' : 'mode' : step === 'vehicle' ? 'mode' : 'form');
    return true;
  }, [step, uploads, draft?.email, draft?.driveMode, navigation]);
  return { credential, form, draft, options, step, busy, uploading: uploads > 0, error,
    fieldErrors, vehicleErrors, storageError, cooldown, next, back, load, onApiError, onBusyChange,
    updateAnswer, updateVehicle };
}
