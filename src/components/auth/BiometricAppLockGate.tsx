import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  BackHandler,
  StyleSheet,
  View,
  type AppStateStatus,
} from 'react-native';
import Application from '@/navigations/Application';
import { hasActiveCustomerSession } from '@/service/startup';
import {
  authenticateBiometricAppLock,
  type BiometricFailure,
  readBiometricAppLockPreference,
} from '@/service/biometricAppLock';
import { BiometricAppLockContext } from '@/context/BiometricAppLockContext';
import { BiometricLockModal } from './BiometricLockModal';
import { SplashContent } from '@/screens/splash/SplashScreen';
import { logger } from '@/utils/logger';
import { useAppTranslation } from '@/hooks/useAppTranslation';

type GatePhase = 'checking' | 'open' | 'locked';

export function BiometricAppLockGate() {
  const { t } = useAppTranslation();
  const [phase, setPhase] = useState<GatePhase>('checking');
  const [applicationMounted, setApplicationMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<BiometricFailure | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [protectedRouteActive, setProtectedRouteActive] = useState(false);
  const phaseRef = useRef<GatePhase>('checking');
  const enabledRef = useRef(false);
  const hasSessionRef = useRef(false);
  const applicationMountedRef = useRef(false);
  const initialAppState = AppState.currentState;
  const appStateRef = useRef<AppStateStatus>(
    initialAppState === 'background' ||
      initialAppState === 'inactive' ||
      initialAppState === 'extension'
      ? initialAppState
      : 'active',
  );
  const protectedRouteRef = useRef(false);
  const currentEventRef = useRef<number | null>(null);
  const nextEventRef = useRef(1);
  const attemptedEventRef = useRef<number | null>(null);
  const queuedEventRef = useRef<number | null>(null);
  const authenticationInFlightRef = useRef(false);
  const initializedRef = useRef(false);
  const initializationStartedRef = useRef(false);
  const mountedRef = useRef(true);
  const promptCopyRef = useRef({
    title: '',
    subtitle: '',
    cancel: '',
  });
  promptCopyRef.current = {
    title: t('appLock.promptTitle'),
    subtitle: t('appLock.promptSubtitle'),
    cancel: t('appLock.promptCancel'),
  };

  const moveTo = useCallback((next: GatePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const setEnabledState = useCallback((next: boolean) => {
    enabledRef.current = next;
    setEnabled(next);
  }, []);

  const updateEnabled = useCallback(
    (next: boolean) => setEnabledState(next),
    [setEnabledState],
  );

  const isCurrentForegroundEvent = useCallback(
    (eventId: number) =>
      currentEventRef.current === eventId &&
      appStateRef.current === 'active' &&
      protectedRouteRef.current &&
      mountedRef.current,
    [],
  );

  const authenticationRef = useRef<(eventId: number) => Promise<void>>(
    async () => undefined,
  );

  const redirectToLogin = useCallback(async () => {
    currentEventRef.current = null;
    queuedEventRef.current = null;
    attemptedEventRef.current = null;
    const { onLogout } = await import('@/utils/helper.utils');
    const loggedOut = await onLogout();
    if (loggedOut) {
      hasSessionRef.current = false;
      setError(null);
    } else {
      setError('sessionInvalid');
    }
  }, []);

  const authenticateEvent = useCallback(
    async (eventId: number) => {
      if (!enabledRef.current || !isCurrentForegroundEvent(eventId)) {
        return;
      }
      if (authenticationInFlightRef.current) {
        queuedEventRef.current = eventId;
        return;
      }
      if (attemptedEventRef.current === eventId) {
        return;
      }
      attemptedEventRef.current = eventId;
      authenticationInFlightRef.current = true;
      setAuthenticating(true);

      try {
        const result = await authenticateBiometricAppLock(
          promptCopyRef.current,
        );
        if (!isCurrentForegroundEvent(eventId)) {
          return;
        }
        if (!result.success) {
          setError(result.reason);
          logger.warn('app_lock.authentication_failed', {
            scope: 'security',
          });
          return;
        }

        const sessionIsActive = await hasActiveCustomerSession();
        if (!isCurrentForegroundEvent(eventId)) {
          return;
        }
        if (!sessionIsActive) {
          hasSessionRef.current = false;
          setError('sessionInvalid');
          await redirectToLogin();
          return;
        }

        hasSessionRef.current = true;
        setError(null);
        moveTo('open');
        logger.info('app_lock.unlocked', { scope: 'security' });
      } catch {
        if (isCurrentForegroundEvent(eventId)) {
          setError('storage');
          logger.warn('app_lock.session_check_failed', { scope: 'security' });
        }
      } finally {
        authenticationInFlightRef.current = false;
        if (mountedRef.current) {
          setAuthenticating(false);
        }
        const queuedEvent = queuedEventRef.current;
        queuedEventRef.current = null;
        if (
          queuedEvent !== null &&
          queuedEvent === currentEventRef.current &&
          appStateRef.current === 'active' &&
          protectedRouteRef.current
        ) {
          authenticationRef.current(queuedEvent);
        }
      }
    },
    [isCurrentForegroundEvent, moveTo, redirectToLogin],
  );

  authenticationRef.current = authenticateEvent;

  const checkSessionAndAuthenticate = useCallback(
    async (eventId: number) => {
      if (!enabledRef.current || !isCurrentForegroundEvent(eventId)) {
        return;
      }
      try {
        const sessionIsActive = await hasActiveCustomerSession();
        if (!isCurrentForegroundEvent(eventId)) {
          return;
        }
        if (!sessionIsActive) {
          hasSessionRef.current = false;
          setError('sessionInvalid');
          await redirectToLogin();
          return;
        }
        hasSessionRef.current = true;
        await authenticationRef.current(eventId);
      } catch {
        if (isCurrentForegroundEvent(eventId)) {
          setError('storage');
        }
      }
    },
    [isCurrentForegroundEvent, redirectToLogin],
  );

  const beginAuthenticationEvent = useCallback(() => {
    if (
      !enabledRef.current ||
      !initializedRef.current ||
      !protectedRouteRef.current ||
      appStateRef.current !== 'active'
    ) {
      return;
    }
    const eventId = nextEventRef.current++;
    currentEventRef.current = eventId;
    setError(null);
    moveTo('locked');
    checkSessionAndAuthenticate(eventId);
  }, [checkSessionAndAuthenticate, moveTo]);

  const initializeGate = useCallback(async () => {
    if (!applicationMountedRef.current) {
      moveTo('checking');
    }
    setError(null);
    try {
      const [lockEnabled, sessionIsActive] = await Promise.all([
        readBiometricAppLockPreference(),
        hasActiveCustomerSession(),
      ]);
      if (!mountedRef.current) {
        return;
      }
      initializedRef.current = true;
      setEnabledState(lockEnabled);
      hasSessionRef.current = sessionIsActive;
      applicationMountedRef.current = true;
      setApplicationMounted(true);
      if (lockEnabled && sessionIsActive) {
        moveTo('locked');
        if (
          protectedRouteRef.current &&
          appStateRef.current === 'active'
        ) {
          beginAuthenticationEvent();
        }
      } else {
        moveTo('open');
      }
    } catch {
      if (!mountedRef.current) {
        return;
      }
      initializedRef.current = true;
      setEnabledState(true);
      hasSessionRef.current = true;
      applicationMountedRef.current = true;
      setApplicationMounted(true);
      setError('storage');
      moveTo('locked');
      logger.warn('app_lock.startup_check_failed', { scope: 'security' });
      if (
        protectedRouteRef.current &&
        appStateRef.current === 'active'
      ) {
        beginAuthenticationEvent();
      }
    }
  }, [beginAuthenticationEvent, moveTo, setEnabledState]);

  const handleRouteChange = useCallback(
    (routeName: string | undefined) => {
      const isProtected =
        routeName === 'MainStack' || routeName === 'SettingsScreen';
      const wasProtected = protectedRouteRef.current;
      protectedRouteRef.current = isProtected;
      setProtectedRouteActive(isProtected);

      if (routeName === 'AuthStack' || routeName === 'LandingScreen') {
        hasSessionRef.current = false;
        if (phaseRef.current === 'locked') {
          moveTo('open');
        }
        return;
      }

      if (
        isProtected &&
        !wasProtected &&
        enabledRef.current &&
        initializedRef.current &&
        appStateRef.current === 'active'
      ) {
        beginAuthenticationEvent();
      }
    },
    [beginAuthenticationEvent, moveTo],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!initializationStartedRef.current) {
      initializationStartedRef.current = true;
      initializeGate();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [initializeGate]);

  useEffect(() => {
    const onAppStateChange = (nextState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      if (nextState !== 'active') {
        if (enabledRef.current && phaseRef.current !== 'checking') {
          currentEventRef.current = null;
          attemptedEventRef.current = null;
          queuedEventRef.current = null;
          setError(null);
          moveTo('locked');
        }
        return;
      }
      if (
        previousState !== 'active' &&
        enabledRef.current &&
        initializedRef.current &&
        phaseRef.current !== 'checking' &&
        protectedRouteRef.current
      ) {
        beginAuthenticationEvent();
      }
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [beginAuthenticationEvent, moveTo]);

  useEffect(() => {
    if (phase !== 'locked' || !protectedRouteActive) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => subscription.remove();
  }, [phase, protectedRouteActive]);

  const retry = useCallback(() => {
    if (
      appStateRef.current !== 'active' ||
      !protectedRouteRef.current ||
      authenticationInFlightRef.current
    ) {
      return;
    }
    if (error === 'sessionInvalid') {
      redirectToLogin();
      return;
    }
    if (error === 'storage') {
      initializeGate();
      return;
    }
    beginAuthenticationEvent();
  }, [
    beginAuthenticationEvent,
    error,
    initializeGate,
    redirectToLogin,
  ]);

  const contextValue = useMemo(
    () => ({ enabled, updateEnabled }),
    [enabled, updateEnabled],
  );

  const showLock = phase === 'locked' && protectedRouteActive;
  // Keep Home blocked independently of the retry card. Wait for an unsuccessful
  // attempt before showing the card, avoiding a flash before the native prompt.
  const showRetryModal = showLock && !authenticating && error !== null;

  return (
    <BiometricAppLockContext.Provider value={contextValue}>
      <View style={styles.root}>
        <View
          style={styles.root}
          pointerEvents={showLock ? 'none' : 'auto'}
          accessibilityElementsHidden={showLock}
          importantForAccessibility={showLock ? 'no-hide-descendants' : 'auto'}
        >
          {applicationMounted ? (
            <Application onRouteChange={handleRouteChange} />
          ) : (
            <SplashContent />
          )}
        </View>
        {showRetryModal ? (
          <BiometricLockModal
            authenticating={authenticating}
            error={error}
            onUnlock={retry}
          />
        ) : null}
      </View>
    </BiometricAppLockContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
