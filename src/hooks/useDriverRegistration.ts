import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useRetryCountdown } from '@/hooks/useRetryCountdown';
import {
  clearRegistrationCredential,
  getRegistrationCredential,
  saveRegistrationCredential,
} from '@/service/driverSession';
import {
  loadRegistrationForm,
  loadVehicleOptions,
  setRegistrationDriveMode,
  submitRegistration,
  verifyInvitationCode,
} from '@/service/rest/auth';
import { DriverApiError } from '@/service/rest/driverClient';
import {
  beginRegistrationDraft,
  saveRegistrationStatus,
  useRegistrationStore,
} from '@/store/registrationStore';
import { cleanAnswers, validateAnswers } from '@/utils/registrationValidation';
import {
  buildVehicle,
  emptyVehicleDraft,
  validateVehicle,
  vehicleToDraft,
} from '@/utils/registrationVehicle';
import { driverErrorMessage } from '@/utils/driverApiError';
import type {
  Answer,
  RegistrationCredential,
  RegistrationForm,
  VehicleDraft,
  VehicleOptions,
} from '@/interface/driverRegistration.type';
import type { TRootStack } from '@/interface/navigation.type';

export type RegistrationStep =
  | 'mode'
  | 'invitation'
  | 'hub'
  | 'vehicleType'
  | 'vehicleBrand'
  | 'vehicleModel'
  | 'vehicleFuel'
  | 'vehicleCategory'
  | 'vehicleFields'
  | 'form'
  | 'review';

export function useDriverRegistration() {
  const navigation = useNavigation<NativeStackNavigationProp<TRootStack>>();
  const { t } = useAppTranslation();
  const draft = useRegistrationStore(state => state.draft);
  const storageError = useRegistrationStore(state => state.storageError);
  const [credential, setCredential] = useState<RegistrationCredential | null>(
    null,
  );
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [options, setOptions] = useState<VehicleOptions | null>(null);
  const [step, setStep] = useState<RegistrationStep>('mode');
  const [invitationCode, setInvitationCode] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [vehicleErrors, setVehicleErrors] = useState<Record<string, string>>(
    {},
  );
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
    if (
      failure instanceof DriverApiError &&
      [401, 409].includes(failure.status)
    ) {
      try {
        await clearRegistrationCredential();
        const email =
          credentialRef.current?.email ??
          useRegistrationStore.getState().draft?.email;
        if (active.current) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'LoginScreen',
                params: { email, register: true, notice: message },
              },
            ],
          });
        }
      } catch {
        if (active.current) setError(t('driverRegistration.storageFailed'));
      }
    }
  };

  const run = async (operation: () => Promise<void>) => {
    if (running.current || lockedUntil > Date.now()) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      await operation();
    } catch (failure) {
      await errorHandler(failure);
    } finally {
      running.current = false;
      if (active.current) setBusy(false);
    }
  };

  const updateCredential = async (nextCred: RegistrationCredential) => {
    await saveRegistrationCredential(nextCred);
    if (!active.current) return;
    credentialRef.current = nextCred;
    setCredential(nextCred);
  };

  const applyForm = async (response: RegistrationForm) => {
    await beginRegistrationDraft(response);
    if (!active.current) return;
    setForm(response);
    const hasPrefilledProfile =
      Object.keys(response.answers).length > 0 &&
      Object.keys(
        validateAnswers(
          response.fields,
          useRegistrationStore.getState().draft?.answers ?? response.answers,
          response.email,
        ),
      ).length === 0;
    if (hasPrefilledProfile) setProfileSaved(true);
  };

  const load = () =>
    void run(async () => {
      const saved = await getRegistrationCredential();
      if (!active.current) return;
      if (!saved) {
        navigation.replace('LoginScreen', {
          register: true,
          notice: t('driverRegistration.verifyAgain'),
        });
        return;
      }
      if ((saved.phoneRequired && !saved.phoneVerified) || !saved.passwordSet) {
        navigation.replace('LoginScreen');
        return;
      }
      setCredential(saved);
      credentialRef.current = saved;
      const response = await loadRegistrationForm(saved.token);
      if (!active.current) return;
      if (
        response.state === 'pending_review' ||
        response.state === 'activation_pending'
      ) {
        await saveRegistrationStatus(
          response.application_id,
          response.email,
          response.state,
        );
        await clearRegistrationCredential();
        if (active.current) {
          navigation.replace('RegistrationStatusScreen', {
            state: response.state,
            email: response.email,
          });
        }
        return;
      }
      if (response.state === 'active') {
        await clearRegistrationCredential();
        if (active.current) {
          navigation.replace('LoginScreen', {
            email: response.email,
            notice: t('driverRegistration.activeNotice'),
          });
        }
        return;
      }
      const nextCred: RegistrationCredential = {
        ...saved,
        ...(response.expires_at && Number.isFinite(Date.parse(response.expires_at))
          ? { expiresAt: response.expires_at }
          : {}),
      };
      await updateCredential(nextCred);
      await applyForm(response);
      const effectiveMode = response.drive_mode ?? nextCred.driveMode ?? null;
      if (effectiveMode && !useRegistrationStore.getState().draft?.driveMode) {
        useRegistrationStore.getState().setDriveMode(effectiveMode);
      }
      if (!effectiveMode || (!nextCred.driveModeSet && !response.drive_mode)) {
        setStep('mode');
        return;
      }
      if (
        effectiveMode === 'fleet_partner' &&
        nextCred.invitationCodeRequired &&
        !nextCred.invitationCodeAccepted
      ) {
        setStep('invitation');
        return;
      }
      if (effectiveMode === 'own_vehicle') {
        const catalog = options ?? (await loadVehicleOptions(nextCred.token));
        if (!active.current) return;
        setOptions(catalog);
        if (!useRegistrationStore.getState().draft?.vehicle) {
          useRegistrationStore
            .getState()
            .setVehicle(
              response.vehicle
                ? vehicleToDraft(response.vehicle, catalog)
                : emptyVehicleDraft(),
            );
        }
        setStep('hub');
        return;
      }
      setStep('form');
    });

  useEffect(() => {
    active.current = true;
    load();
    return () => {
      active.current = false;
    };
    // Loading is per screen entry, not on translated copy changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBusyChange = useCallback(
    (uploading: boolean) =>
      setUploads(count => Math.max(0, count + (uploading ? 1 : -1))),
    [],
  );
  const onApiError = (failure: unknown) => {
    if (
      failure instanceof DriverApiError &&
      [401, 409, 429].includes(failure.status)
    ) {
      void errorHandler(failure);
    }
  };
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
      for (const key of [
        'type_id',
        'brand_id',
        'model_id',
        'category_id',
        'fuel_type_id',
        'year',
        'registration_number',
        'colour',
      ] as const) {
        if (previous?.[key] !== value[key]) delete remaining[key];
      }
      for (const key of [
        'registration_certificate',
        'insurance',
        'pollution_certificate',
      ] as const) {
        if (previous?.documents[key] !== value.documents[key]) {
          delete remaining[key];
        }
      }
      return remaining;
    });
  }, []);

  const selectedModel = options?.models.find(
    m =>
      m.model_id === draft?.vehicle?.model_id &&
      m.brand_id === draft?.vehicle?.brand_id &&
      m.type_id === draft?.vehicle?.type_id,
  );
  const hasFuelOptions = Boolean(selectedModel?.fuel_types.length);
  const hasCategories = Boolean(options?.categories?.length);

  const vehicleDone = Boolean(
    draft?.driveMode === 'own_vehicle' &&
      draft.vehicle &&
      options &&
      Object.keys(validateVehicle(draft.vehicle, options, draft.answers)).length === 0,
  );
  const profileDone = Boolean(
    form &&
      draft &&
      profileSaved &&
      Object.keys(validateAnswers(form.fields, draft.answers, form.email)).length === 0,
  );

  const openVehicleStep = () => {
    if (!credential || busy || uploads || cooldown) return;
    setError('');
    void run(async () => {
      const catalog = options ?? (await loadVehicleOptions(credential.token));
      if (!active.current) return;
      setOptions(catalog);
      if (!useRegistrationStore.getState().draft?.vehicle) {
        useRegistrationStore
          .getState()
          .setVehicle(
            form?.vehicle
              ? vehicleToDraft(form.vehicle, catalog)
              : emptyVehicleDraft(),
          );
      }
      setStep('vehicleType');
    });
  };

  const openProfileStep = () => {
    if (busy || uploads || cooldown) return;
    setError('');
    setStep('form');
  };

  const next = () => {
    if (!form || !credential || !draft || busy || uploads || cooldown) return;
    setError('');
    if (step === 'mode') {
      const selectedMode = draft.driveMode;
      if (!selectedMode) {
        setError(t('driverRegistration.chooseMode'));
        return;
      }
      void run(async () => {
        const modeResponse = await setRegistrationDriveMode(
          credential.token,
          selectedMode,
        );
        if (!active.current) return;
        const nextCred: RegistrationCredential = {
          ...credential,
          driveMode: selectedMode,
          driveModeSet: true,
          invitationCodeRequired: modeResponse.invitation_code_required,
          invitationCodeAccepted: !modeResponse.invitation_code_required,
        };
        await updateCredential(nextCred);
        if (!active.current) return;
        if (selectedMode === 'fleet_partner') {
          if (modeResponse.invitation_code_required) {
            setInvitationCode('');
            setStep('invitation');
          } else {
            const latest = await loadRegistrationForm(credential.token);
            if (!active.current) return;
            await applyForm(latest);
            setStep('form');
          }
          return;
        }
        const catalog = options ?? (await loadVehicleOptions(credential.token));
        if (!active.current) return;
        setOptions(catalog);
        if (!useRegistrationStore.getState().draft?.vehicle) {
          useRegistrationStore
            .getState()
            .setVehicle(
              form.vehicle
                ? vehicleToDraft(form.vehicle, catalog)
                : emptyVehicleDraft(),
            );
        }
        setStep('hub');
      });
    } else if (step === 'invitation') {
      if (!/^\d{6}$/.test(invitationCode)) {
        setError(t('driverRegistration.invitationRequired'));
        return;
      }
      void run(async () => {
        await verifyInvitationCode(credential.token, invitationCode);
        if (!active.current) return;
        await updateCredential({ ...credential, invitationCodeAccepted: true });
        if (!active.current) return;
        const latest = await loadRegistrationForm(credential.token);
        if (!active.current) return;
        await applyForm(latest);
        setStep('form');
      });
    } else if (step === 'hub') {
      if (vehicleDone && profileDone) setStep('review');
    } else if (step === 'vehicleType') {
      if (draft.vehicle?.type_id) setStep('vehicleBrand');
    } else if (step === 'vehicleBrand') {
      if (draft.vehicle?.brand_id) setStep('vehicleModel');
    } else if (step === 'vehicleModel') {
      if (!draft.vehicle?.model_id) return;
      if (hasFuelOptions) setStep('vehicleFuel');
      else if (hasCategories) setStep('vehicleCategory');
      else setStep('vehicleFields');
    } else if (step === 'vehicleFuel') {
      if (hasFuelOptions && !draft.vehicle?.fuel_type_id) return;
      if (hasCategories) setStep('vehicleCategory');
      else setStep('vehicleFields');
    } else if (step === 'vehicleCategory') {
      if (hasCategories && !draft.vehicle?.category_id) return;
      setStep('vehicleFields');
    } else if (step === 'vehicleFields' && draft.vehicle && options) {
      const errors = validateVehicle(draft.vehicle, options, draft.answers);
      const vehicleFieldKeys = new Set(options.fields?.map(f => f.key) ?? []);
      const nextVehicleErrors: Record<string, string> = {};
      const nextFieldErrors: Record<string, string> = { ...fieldErrors };
      for (const field of options.fields ?? []) {
        delete nextFieldErrors[field.key];
      }
      for (const [key, msg] of Object.entries(errors)) {
        if (vehicleFieldKeys.has(key)) nextFieldErrors[key] = msg;
        else nextVehicleErrors[key] = msg;
      }
      setVehicleErrors(nextVehicleErrors);
      setFieldErrors(nextFieldErrors);
      if (Object.keys(errors).length) return;
      setStep('hub');
    } else if (step === 'form') {
      const errors = validateAnswers(form.fields, draft.answers, form.email);
      setFieldErrors(errors);
      if (Object.keys(errors).length) return;
      setProfileSaved(true);
      setStep(draft.driveMode === 'own_vehicle' ? 'hub' : 'review');
    } else if (step === 'review') {
      const errors = validateAnswers(form.fields, draft.answers, form.email);
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        setStep('form');
        return;
      }
      if (!draft.driveMode) {
        setStep('mode');
        return;
      }
      if (draft.driveMode === 'own_vehicle') {
        if (!draft.vehicle || !options) {
          setStep('mode');
          return;
        }
        const invalidVehicle = validateVehicle(
          draft.vehicle,
          options,
          draft.answers,
        );
        if (Object.keys(invalidVehicle).length) {
          setVehicleErrors(invalidVehicle);
          setStep('vehicleFields');
          return;
        }
      }
      if (!agreed) {
        setError(t('driverRegistration.acceptTermsRequired'));
        return;
      }
      const allFields = [...form.fields, ...(options?.fields ?? [])];
      void run(async () => {
        const response = await submitRegistration({
          token: credential.token,
          answers: cleanAnswers(allFields, draft.answers, form.email),
          ...(draft.driveMode === 'own_vehicle' && draft.vehicle
            ? { vehicle: buildVehicle(draft.vehicle, options, draft.answers) }
            : {}),
          accept_terms: true,
        });
        // Save terminal state before deleting the consumed credential for crash recovery.
        await saveRegistrationStatus(
          response.id ?? form.application_id,
          form.email,
          'pending_review',
        );
        await clearRegistrationCredential();
        if (active.current) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'RegistrationStatusScreen',
                params: { state: 'pending_review', email: form.email },
              },
            ],
          });
        }
      });
    }
  };

  const back = useCallback(() => {
    if (running.current || uploads > 0) return true;
    if (step === 'mode') {
      navigation.replace('LoginScreen', { email: draft?.email, register: true });
    } else if (step === 'invitation' || step === 'hub') {
      setStep('mode');
    } else if (step === 'vehicleType') {
      setStep('hub');
    } else if (step === 'vehicleBrand') {
      setStep('vehicleType');
    } else if (step === 'vehicleModel') {
      setStep('vehicleBrand');
    } else if (step === 'vehicleFuel') {
      setStep('vehicleModel');
    } else if (step === 'vehicleCategory') {
      setStep(hasFuelOptions ? 'vehicleFuel' : 'vehicleModel');
    } else if (step === 'vehicleFields') {
      if (hasCategories) setStep('vehicleCategory');
      else if (hasFuelOptions) setStep('vehicleFuel');
      else setStep('vehicleModel');
    } else if (step === 'form') {
      if (draft?.driveMode === 'own_vehicle') setStep('hub');
      else if (credential?.invitationCodeRequired) setStep('invitation');
      else setStep('mode');
    } else {
      setStep(draft?.driveMode === 'own_vehicle' ? 'hub' : 'form');
    }
    return true;
  }, [
    step,
    uploads,
    draft?.email,
    draft?.driveMode,
    hasFuelOptions,
    hasCategories,
    credential?.invitationCodeRequired,
    navigation,
  ]);

  return {
    credential,
    form,
    draft,
    options,
    step,
    vehicleDone,
    profileDone,
    invitationCode,
    setInvitationCode,
    agreed,
    setAgreed,
    busy,
    uploading: uploads > 0,
    error,
    fieldErrors,
    vehicleErrors,
    storageError,
    cooldown,
    openVehicleStep,
    openProfileStep,
    next,
    back,
    load,
    onApiError,
    onBusyChange,
    updateAnswer,
    updateVehicle,
  };
}
