import { create } from 'zustand';
import { ERoles } from '@/interface/general.type';
import { OnboardingState, User } from '@/interface/user.type';
import type { DriverLoginResponse, DriverProfile } from '@/interface/driverRegistration.type';

type AuthStore = {
  token?: string | null;
  refreshToken?: string | null;
  sessionExpiresAt: number | null;
  driverUser: DriverLoginResponse['user'] | null;
  driverProfile: DriverProfile | null;
  onBoardingStatus?: OnboardingState;
  user?: Partial<User>;
  role: ERoles | string;
  onBoarding?: boolean;
  setUserData: (payload: { accessToken?: string; refreshToken?: string; user?: Partial<User> }) => void;
  setDriverProfile: (profile: DriverProfile | null) => void;
  updateUserProfile: (payload: Partial<User>) => void;
  setUserRole: (role: ERoles | string) => void;
  setOnBoardingStatus: (status: OnboardingState) => void;
  resetUser: () => void;
};

// Secrets live in Keychain; this store is only the active in-memory session.
export const useAuthStore = create<AuthStore>(set => ({
  token: null, refreshToken: null, sessionExpiresAt: null, driverUser: null, driverProfile: null,
  user: {}, role: '', onBoarding: true,
  setUserData: payload => set({
    token: payload.accessToken, refreshToken: payload.refreshToken, user: payload.user,
  }),
  setDriverProfile: driverProfile => set({ driverProfile }),
  updateUserProfile: payload => set(state => ({ user: { ...state.user, ...payload } })),
  setUserRole: role => set({ role }),
  setOnBoardingStatus: onBoardingStatus => set({ onBoardingStatus }),
  resetUser: () => set({
    token: null, refreshToken: null, sessionExpiresAt: null,
    driverUser: null, driverProfile: null, role: '', user: {},
  }),
}));
