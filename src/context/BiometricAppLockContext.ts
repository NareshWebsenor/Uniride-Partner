import { createContext, useContext } from 'react';

export type BiometricAppLockContextValue = {
  enabled: boolean;
  updateEnabled: (enabled: boolean) => void;
};

export const BiometricAppLockContext =
  createContext<BiometricAppLockContextValue>({
    enabled: false,
    updateEnabled: () => undefined,
  });

export function useBiometricAppLock() {
  return useContext(BiometricAppLockContext);
}
