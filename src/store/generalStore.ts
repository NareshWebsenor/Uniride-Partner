import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type GeneralStore = {
  isUnAutharized: boolean;
  configData: {
    zikCoinsPerDollar: number;
  };

  setIsUnAutharized: (value: boolean) => void;
  setConfigData: (data: Partial<{ zikCoinsPerDollar: number }>) => void;
};

export const useGeneralStore = create<GeneralStore>()(
  persist(
    set => ({
      isUnAutharized: false,
      configData: {
        zikCoinsPerDollar: 1,
      },

      setIsUnAutharized: value => set({ isUnAutharized: value }),

      setConfigData: data =>
        set(state => ({
          configData: {
            ...state.configData,
            ...data,
          },
        })),
    }),
    {
      name: 'general-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
