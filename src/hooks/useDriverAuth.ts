import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useRetryCountdown } from '@/hooks/useRetryCountdown';
import {
  loginDriver,
  sendEmailCode,
  setRegistrationPassword,
  setRegistrationPhone,
  verifyEmailCode,
  verifyRegistrationPhone,
} from '@/service/rest/auth';
import { DriverApiError } from '@/service/rest/driverClient';
import {
  clearRegistrationCredential,
  getRegistrationCredential,
  saveDriverSession,
  saveRegistrationCredential,
} from '@/service/driverSession';
import {
  clearRegistrationDraft,
  restoreRegistrationDraft,
  saveRegistrationStatus,
  useRegistrationStore,
} from '@/store/registrationStore';
import { driverErrorMessage } from '@/utils/driverApiError';
import type { TRootStack } from '@/interface/navigation.type';
import { clearRegistrationEntry } from '@/service/registrationEntry';
import { countries, type Country } from '@/screens/auth/OtpVerificationSteps';
import { passwordRules } from '@/utils/authPreview';

export type AuthStep = 'entry' | 'code' | 'mobile' | 'phoneCode' | 'password';

export function useDriverAuth(params: TRootStack['LoginScreen']) {
  const navigation = useNavigation<NativeStackNavigationProp<TRootStack>>();
  const { t } = useAppTranslation();
  const [email, setEmail] = useState(params?.email ?? '');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneRequired, setPhoneRequired] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [country, setCountry] = useState<Country>(countries[0]);
  const [register, setRegister] = useState(params?.register ?? false);
  const [step, setStep] = useState<AuthStep>('entry');
  const [code, setCode] = useState('');
  const [error, setError] = useState(params?.notice ?? '');
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [phoneResendAt, setPhoneResendAt] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const lock = useRef(false);
  const mounted = useRef(true);
  const resend = useRetryCountdown(resendAt);
  const phoneResend = useRetryCountdown(phoneResendAt);
  const cooldown = useRetryCountdown(lockedUntil);

  useEffect(() => {
    mounted.current = true;
    if (!params) {
      lock.current = true;
      setBusy(true);
      (async () => {
        await restoreRegistrationDraft();
        const credential = await getRegistrationCredential();
        if (!mounted.current) return;
        if (credential) {
          const needsPhone = Boolean(
            credential.phoneRequired && !credential.phoneVerified,
          );
          if (credential.passwordSet && !needsPhone) {
            navigation.replace('DriverRegistrationScreen');
            return;
          }
          setEmail(credential.email);
          setPhoneRequired(Boolean(credential.phoneRequired));
          setPhoneVerified(Boolean(credential.phoneVerified));
          setRegister(true);
          setStep(needsPhone ? 'mobile' : 'password');
          return;
        }
        const saved = useRegistrationStore.getState().draft;
        if (
          saved?.status === 'pending_review' ||
          saved?.status === 'activation_pending'
        ) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'RegistrationStatusScreen',
                params: { state: saved.status, email: saved.email },
              },
            ],
          });
        } else if (saved) {
          setEmail(saved.email);
          setRegister(true);
        }
      })()
        .catch(() => {
          if (mounted.current) setError(t('driverRegistration.restoreFailed'));
        })
        .finally(() => {
          lock.current = false;
          if (mounted.current) setBusy(false);
        });
    }
    return () => {
      mounted.current = false;
    };
    // Restore only at initial entry; changing language must not navigate again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (operation: () => Promise<void>) => {
    if (lock.current || lockedUntil > Date.now()) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await operation();
    } catch (failure) {
      if (!mounted.current) return;
      setError(driverErrorMessage(failure));
      if (failure instanceof DriverApiError && failure.status === 429) {
        setLockedUntil(Date.now() + (failure.retryAfterSeconds ?? 60) * 1000);
      }
      if (
        failure instanceof DriverApiError &&
        [401, 409].includes(failure.status) &&
        register
      ) {
        setStep('entry');
        setCode('');
        setPhoneCode('');
        setPassword('');
        setConfirm('');
        setPasswordSaved(false);
        try {
          await clearRegistrationCredential();
        } catch {
          if (mounted.current) setError(t('driverRegistration.storageFailed'));
        }
      }
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const send = () => {
    if (resendAt > Date.now()) return;
    void run(async () => {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await sendEmailCode({ email: normalizedEmail });
      if (!mounted.current) return;
      setEmail(normalizedEmail);
      // Explicitly requested development convenience; never use outside DEV.
      const developmentCode = response.development_code ?? '';
      setCode(__DEV__ && /^\d{4}$/.test(developmentCode) ? developmentCode : '');
      setResendAt(Date.now() + 60_000);
      setStep('code');
    });
  };

  const verify = () => {
    if (!/^\d{4}$/.test(code)) return;
    void run(async () => {
      const response = await verifyEmailCode(email, code);
      if (!mounted.current) return;
      setCode('');
      if (
        response.state === 'invited' ||
        response.state === 'changes_requested'
      ) {
        setPassword('');
        setConfirm('');
        setPasswordSaved(false);
        setPhoneCode('');
        setPhoneRequired(response.phone_required);
        setPhoneVerified(response.phone_verified);
        await saveRegistrationCredential({
          token: response.token,
          applicationId: response.application_id,
          email,
          phoneRequired: response.phone_required,
          phoneVerified: response.phone_verified,
        });
        await clearRegistrationEntry();
        if (mounted.current) {
          setStep(
            response.phone_required && !response.phone_verified
              ? 'mobile'
              : 'password',
          );
        }
      } else {
        await clearRegistrationCredential();
        if (response.state === 'active') {
          await clearRegistrationDraft();
          if (mounted.current) {
            setRegister(false);
            setStep('entry');
            setError(t('driverRegistration.activeNotice'));
          }
        } else {
          await saveRegistrationStatus(
            response.application_id,
            email,
            response.state,
          );
          if (mounted.current) {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'RegistrationStatusScreen',
                  params: { state: response.state, email },
                },
              ],
            });
          }
        }
      }
    });
  };

  const sendPhoneOtp = () => {
    if (step === 'phoneCode' && phoneResendAt > Date.now()) return;
    if (!phone.trim()) {
      setError(t('partnerAuth.phoneRequired'));
      return;
    }
    void run(async () => {
      const credential = await getRegistrationCredential();
      if (!credential || credential.email !== email) {
        throw new DriverApiError(401, 'session_expired');
      }
      const nextPhone = `${country.dial}${phone.trim()}`;
      const response = await setRegistrationPhone(credential.token, nextPhone);
      if (!mounted.current) return;
      const developmentCode = response.development_code ?? '';
      setFormattedPhone(response.phone || nextPhone);
      setPhoneCode(
        __DEV__ && /^\d{4}$/.test(developmentCode) ? developmentCode : '',
      );
      setPhoneResendAt(Date.now() + 60_000);
      setStep('phoneCode');
    });
  };

  const login = (loginPassword: string) =>
    void run(async () => {
      const response = await loginDriver(
        email.trim().toLowerCase(),
        loginPassword,
      );
      if (!mounted.current) return;
      await clearRegistrationCredential();
      await clearRegistrationEntry();
      await clearRegistrationDraft();
      await saveDriverSession(response);
      if (mounted.current) {
        navigation.reset({ index: 0, routes: [{ name: 'MainStack' }] });
      }
    });

  const back = useCallback(() => {
    if (lock.current) return true;
    if (step === 'entry') return false;
    if (step === 'phoneCode') {
      setStep('mobile');
      setPhoneCode('');
    } else if (step === 'password') {
      setStep(phoneRequired && !phoneVerified ? 'mobile' : 'entry');
      setPassword('');
      setConfirm('');
    } else {
      setStep('entry');
      setCode('');
    }
    setError('');
    return true;
  }, [step, phoneRequired, phoneVerified]);

  const valid =
    step === 'code'
      ? /^\d{4}$/.test(code)
      : step === 'mobile'
        ? phone.trim().length >= 5
        : step === 'phoneCode'
          ? /^\d{4}$/.test(phoneCode)
          : step === 'password' &&
            ((passwordSaved && !password && !confirm) ||
              (Object.values(passwordRules(password)).every(Boolean) &&
                password === confirm));

  const next = () => {
    if (!valid || busy || cooldown) return;
    if (step === 'code') verify();
    else if (step === 'mobile') sendPhoneOtp();
    else if (step === 'phoneCode') {
      void run(async () => {
        const credential = await getRegistrationCredential();
        if (!credential || credential.email !== email) {
          throw new DriverApiError(401, 'session_expired');
        }
        const response = await verifyRegistrationPhone(
          credential.token,
          phoneCode,
        );
        if (!mounted.current) return;
        setPhoneVerified(true);
        setPhoneCode('');
        await saveRegistrationCredential({
          ...credential,
          phone: response.phone,
          phoneVerified: true,
        });
        if (mounted.current) setStep('password');
      });
    } else if (step === 'password') {
      if (passwordSaved && !password && !confirm) {
        navigation.replace('DriverRegistrationScreen');
        return;
      }
      void run(async () => {
        const credential = await getRegistrationCredential();
        if (!credential || credential.email !== email) {
          throw new DriverApiError(401, 'session_expired');
        }
        await setRegistrationPassword(credential.token, password);
        if (!mounted.current) return;
        await saveRegistrationCredential({ ...credential, passwordSet: true });
        if (mounted.current) {
          setPassword('');
          setConfirm('');
          setPasswordSaved(true);
          navigation.replace('DriverRegistrationScreen');
        }
      });
    }
  };

  return {
    email,
    setEmail,
    register,
    setRegister,
    step,
    code,
    setCode,
    phoneCode,
    setPhoneCode,
    formattedPhone,
    error,
    setError,
    busy,
    phone,
    setPhone,
    country,
    setCountry,
    password,
    setPassword,
    confirm,
    setConfirm,
    passwordSaved,
    resend,
    phoneResend,
    cooldown,
    send,
    sendPhoneOtp,
    verify,
    login,
    back,
    next,
    valid,
  };
}
