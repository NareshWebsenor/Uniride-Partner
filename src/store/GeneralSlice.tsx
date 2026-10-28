import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type initialStateType = {
  isUnAutharized: boolean;
  configData: {
    zikCoinsPerDollar: number;
  };
};

const initialState: initialStateType = {
  isUnAutharized: false,
  configData: {
    zikCoinsPerDollar: 1,
  },
};

const generalSlice = createSlice({
  name: 'general',
  initialState,
  reducers: {
    setIsUnAutharized: (state, action: PayloadAction<boolean>) => {
      state.isUnAutharized = action.payload;
    },
    setConfigData: (state, { payload }) => {
      state.configData = { ...state.configData, ...payload };
    },
  },
});

export const GeneralManager = generalSlice.reducer;
export const { setIsUnAutharized, setConfigData } = generalSlice.actions;
