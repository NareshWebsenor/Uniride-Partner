import { ERoles } from '@/interface/general.type';
import { OnboardingState, User } from '@/interface/user.type';
import { createSlice } from '@reduxjs/toolkit';

type initialStateType = {
  token?: string | null;
  refreshToken?: string | null;
  onBoardingStatus?: OnboardingState;
  user?: Partial<User>;
  role: ERoles | string;
  onBoarding?: boolean;
};

const initialState: initialStateType = {
  token: null,
  refreshToken: null,
  user: {},
  role: '',
  onBoarding: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserData: (state, { payload }) => {
      state.token = payload.accessToken;
      state.refreshToken = payload.efreshToken;
      state.user = payload.user;
    },
    setUserRole: (state, { payload }) => {
      state.role = payload;
    },
    setOnBoardingStatus: (state, { payload }) => {
      state.onBoardingStatus = payload;
    },
    resetUser: state => {
      state.token = null;
      state.refreshToken = null;
      state.role = '';
      state.user = {};
    },
  },
});

export const AuthManager = authSlice.reducer;
export const { setUserData, resetUser, setUserRole, setOnBoardingStatus } =
  authSlice.actions;
