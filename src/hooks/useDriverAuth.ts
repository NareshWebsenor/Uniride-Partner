import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useRetryCountdown } from '@/hooks/useRetryCountdown';
import { loginDriver, sendEmailCode, setRegistrationPassword, setRegistrationPhone, verifyEmailCode } from '@/service/rest/auth';
import { DriverApiError } from '@/service/rest/driverClient';
import { clearRegistrationCredential, getRegistrationCredential, saveDriverSession, saveRegistrationCredential } from '@/service/driverSession';
import { clearRegistrationDraft, restoreRegistrationDraft, saveRegistrationStatus, useRegistrationStore } from '@/store/registrationStore';
import { driverErrorMessage } from '@/utils/driverApiError';
import type { TRootStack } from '@/interface/navigation.type';
import { saveRegistrationEntry, clearRegistrationEntry } from '@/service/registrationEntry';
import { countries, type Country } from '@/screens/auth/OtpVerificationSteps';
import { passwordRules } from '@/utils/authPreview';

export function useDriverAuth(params: TRootStack['LoginScreen']) {
  const navigation = useNavigation<NativeStackNavigationProp<TRootStack>>();
  const { t } = useAppTranslation();
  const [email, setEmail] = useState(params?.email ?? '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [country, setCountry] = useState<Country>(countries[0]);
  const [agreed, setAgreed] = useState(false);
  const [register, setRegister] = useState(params?.register ?? false);
  const [step, setStep] = useState<'entry' | 'code' | 'mobile' | 'password' | 'terms'>('entry');
  const [code, setCode] = useState('');
  const [error, setError] = useState(params?.notice ?? '');
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const lock = useRef(false);
  const mounted = useRef(true);
  const resend = useRetryCountdown(resendAt);
  const cooldown = useRetryCountdown(lockedUntil);
  useEffect(() => {
    mounted.current = true;
    if (!params) {
      lock.current = true; setBusy(true);
      (async () => {
        await restoreRegistrationDraft();
        const credential = await getRegistrationCredential();
        if (!mounted.current) return;
        if (credential) {
          if (credential.passwordSet) navigation.replace('DriverRegistrationScreen');
          else { setEmail(credential.email); setRegister(true); setStep('mobile'); }
          return;
        }
        const saved = useRegistrationStore.getState().draft;
        if (saved?.status === 'pending_review' || saved?.status === 'activation_pending') {
          navigation.reset({ index: 0, routes: [{ name: 'RegistrationStatusScreen', params: { state: saved.status, email: saved.email } }] });
        } else if (saved) { setEmail(saved.email); setRegister(true); }
      })().catch(() => {
        if (mounted.current) setError(t('driverRegistration.restoreFailed'));
      }).finally(() => { lock.current = false; if (mounted.current) setBusy(false); });
    }
    return () => { mounted.current = false; };
    // Restore only at initial entry; changing language must not navigate again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (operation: () => Promise<void>) => {
    if (lock.current || lockedUntil > Date.now()) return;
    lock.current = true; setBusy(true); setError('');
    try { await operation(); }
    catch (failure) {
      if (!mounted.current) return;
      setError(driverErrorMessage(failure));
      if (failure instanceof DriverApiError && failure.status === 429) {
        setLockedUntil(Date.now() + (failure.retryAfterSeconds ?? 60) * 1000);
      }
      if (failure instanceof DriverApiError && [401, 409].includes(failure.status) && register) {
        setStep('entry'); setCode('');
        setPassword(''); setConfirm(''); setPasswordSaved(false);
        try { await clearRegistrationCredential(); }
        catch { if (mounted.current) setError(t('driverRegistration.storageFailed')); }
      }
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  const send = () => {
    if (resendAt > Date.now()) return;
    void run(async () => {
      const response = await sendEmailCode({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim().toLowerCase() });
      if (!mounted.current) return;
      setEmail(email.trim().toLowerCase());
      // Explicitly requested development convenience; never use outside DEV.
      const developmentCode = response.development_code ?? '';
      setCode(__DEV__ && /^\d{6}$/.test(developmentCode) ? developmentCode : '');
      setResendAt(Date.now() + 60_000);
      setStep('code');
    });
  };
  const verify = () => {
    if (!/^\d{6}$/.test(code)) return;
    void run(async () => {
      const response = await verifyEmailCode(email, code);
      if (!mounted.current) return;
      setCode('');
      if (response.state === 'invited' || response.state === 'changes_requested') {
        setPassword(''); setConfirm(''); setPasswordSaved(false);
        await saveRegistrationCredential({ token: response.token, applicationId: response.application_id, email });
        await saveRegistrationEntry(response.application_id, email, {
          first_name: firstName.trim(), last_name: lastName.trim(), accept_terms: false,
        });
        if (mounted.current) setStep('mobile');
      } else {
        await clearRegistrationCredential();
        if (response.state === 'active') {
          await clearRegistrationDraft();
          if (mounted.current) { setRegister(false); setStep('entry'); setError(t('driverRegistration.activeNotice')); }
        }
        else {
          await saveRegistrationStatus(response.application_id, email, response.state);
          if (mounted.current) navigation.reset({ index: 0, routes: [{ name: 'RegistrationStatusScreen', params: { state: response.state, email } }] });
        }
      }
    });
  };
  const login = (password: string) => void run(async () => {
    const response = await loginDriver(email.trim().toLowerCase(), password);
    if (!mounted.current) return;
    await clearRegistrationCredential();
    await clearRegistrationEntry();
    await clearRegistrationDraft();
    await saveDriverSession(response);
    if (mounted.current) navigation.reset({ index: 0, routes: [{ name: 'MainStack' }] });
  });
  const back = useCallback(() => {
    if (lock.current) return true;
    if (step === 'entry') return false;
    setStep(step === 'terms' ? 'password' : step === 'password' ? 'mobile' : 'entry');
    setCode(''); setError(''); return true;
  }, [step]);
  const valid = step === 'code' ? /^\d{6}$/.test(code) : step === 'mobile'
    ? true
    : step === 'password'
      ? (passwordSaved && !password && !confirm) || (Object.values(passwordRules(password)).every(Boolean) && password === confirm)
      : step === 'terms' && agreed;
  const next = () => {
    if (!valid || busy || cooldown) return;
    if (step === 'code') verify();
    else if (step === 'mobile') {
      if (!phone.trim()) { setError(''); setStep('password'); return; }
      void run(async () => {
        const credential = await getRegistrationCredential();
        if (!credential || credential.email !== email) throw new DriverApiError(401, 'session_expired');
        await setRegistrationPhone(credential.token, `${country.dial}${phone.trim()}`);
        if (mounted.current) setStep('password');
      });
    }
    else if (step === 'password') {
      if (passwordSaved && !password && !confirm) { setStep('terms'); return; }
      void run(async () => {
        const credential = await getRegistrationCredential();
        if (!credential || credential.email !== email) throw new DriverApiError(401, 'session_expired');
        await setRegistrationPassword(credential.token, password);
        if (!mounted.current) return;
        await saveRegistrationCredential({ ...credential, passwordSet: true });
        if (mounted.current) {
          setPassword(''); setConfirm(''); setPasswordSaved(true); setStep('terms');
        }
      });
    }
    else if (step === 'terms') void run(async () => {
      const credential = await getRegistrationCredential();
      if (!credential || credential.email !== email) throw new DriverApiError(401, 'session_expired');
      await saveRegistrationEntry(credential.applicationId, email, {
        first_name: firstName.trim(), last_name: lastName.trim(), accept_terms: agreed,
      });
      if (mounted.current) navigation.replace('DriverRegistrationScreen');
    });
  };
  return { email, setEmail, register, setRegister, step, code, setCode, error, setError, busy,
    firstName, setFirstName, lastName, setLastName, phone, setPhone, country, setCountry, agreed, setAgreed,
    password, setPassword, confirm, setConfirm, passwordSaved,
    resend, cooldown, send, verify, login, back, next, valid };
}
