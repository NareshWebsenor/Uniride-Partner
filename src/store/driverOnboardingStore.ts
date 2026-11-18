import { create } from 'zustand';
import type {
  DocumentDraft,
  DriverOnboardingDraft,
  DriverOnboardingStore,
} from '@/interface/driverOnboarding.type';
import {
  canFinish,
  documentValid,
  vehicleValid,
} from '@/utils/driverOnboarding';
import { logger } from '@/utils/logger';

const emptyDocument = (): DocumentDraft => ({
  number: '',
  provider: '',
  validUntil: '',
  submitted: false,
});
const emptyDraft = (): DriverOnboardingDraft => ({
  firstName: '',
  city: '',
  referral: '',
  vehicleType: undefined,
  preference: undefined,
  documents: {
    license: emptyDocument(),
    photo: emptyDocument(),
    government: emptyDocument(),
    rc: emptyDocument(),
    pollution: emptyDocument(),
    insurance: emptyDocument(),
  },
  vehicle: { make: '', model: '', variant: '', year: '', submitted: false },
  bank: {
    bankName: '',
    holderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    iban: '',
  },
});

// Deliberately memory-only: documents and bank details are never persisted here.
export const useDriverOnboardingStore = create<DriverOnboardingStore>(
  (set, get) => ({
    ...emptyDraft(),
    start: firstName => {
      set({ ...emptyDraft(), firstName: firstName.trim() });
      logger.info('driver_onboarding.started', { scope: 'preview' });
    },
    clear: () => set(emptyDraft()),
    completePreview: () => {
      if (!canFinish(get())) return false;
      // The Menu reads this session's documents; bank data is no longer needed.
      set({ bank: emptyDraft().bank });
      return true;
    },
    setCity: city => set({ city }),
    setReferral: referral => set({ referral }),
    setVehicleType: vehicleType => {
      if (get().vehicleType === vehicleType) return;
      set(state => ({
        vehicleType,
        vehicle: emptyDraft().vehicle,
        documents: {
          ...state.documents,
          rc: emptyDocument(),
          pollution: emptyDocument(),
          insurance: emptyDocument(),
        },
      }));
    },
    setPreference: preference => set({ preference }),
    updateDocument: (kind, value) =>
      set(state => ({
        documents: {
          ...state.documents,
          [kind]: { ...state.documents[kind], ...value, submitted: false },
        },
      })),
    commitDocument: kind => {
      const draft = get().documents[kind];
      if (!documentValid(kind, draft)) return false;
      set(state => ({
        documents: {
          ...state.documents,
          [kind]: { ...draft, submitted: true },
        },
      }));
      logger.debug('driver_onboarding.document_added', { scope: kind });
      return true;
    },
    updateVehicle: value =>
      set(state => ({
        vehicle: { ...state.vehicle, ...value, submitted: false },
      })),
    commitVehicle: () => {
      if (!vehicleValid(get().vehicle)) return false;
      set(state => ({ vehicle: { ...state.vehicle, submitted: true } }));
      return true;
    },
    updateBank: value => set(state => ({ bank: { ...state.bank, ...value } })),
  }),
);
