import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ERoles } from '@/interface/general.type';
import { OnboardingState, User } from '@/interface/user.type';

type AuthStore = {
  token?: string | null;
  refreshToken?: string | null;
  onBoardingStatus?: OnboardingState;
  user?: Partial<User>;
  role: ERoles | string;
  onBoarding?: boolean;

  setUserData: (payload: any) => void;
  updateUserProfile: (payload: Partial<User>) => void;
  setUserRole: (role: ERoles | string) => void;
  setOnBoardingStatus: (status: OnboardingState) => void;
  resetUser: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    set => ({
      token: null,
      refreshToken: null,
      user: {},
      role: '',
      onBoarding: true,

      setUserData: payload =>
        set({
          token: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
        }),

      updateUserProfile: payload =>
        set(state => ({ user: { ...state.user, ...payload } })),

      setUserRole: role => set({ role }),

      setOnBoardingStatus: status => set({ onBoardingStatus: status }),

      resetUser: () =>
        set({
          token: null,
          refreshToken: null,
          role: '',
          user: {},
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
