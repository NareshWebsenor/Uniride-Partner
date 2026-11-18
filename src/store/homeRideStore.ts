import { create } from 'zustand';
import { logger } from '@/utils/logger';

export interface RideOffer {
  id: string;
  fare: number;
  currency: string;
  pickup: string;
  dropoff: string;
  rider: string;
  rating: string;
  durationMs: number;
  expiresAt: number;
}

export type HomeRideState =
  | { status: 'offline' }
  | { status: 'online'; demoDueAt: number | null }
  | { status: 'request'; offer: RideOffer }
  | { status: 'arriving' | 'otp' | 'started'; offer: RideOffer };

interface HomeRideStore {
  ride: HomeRideState;
  goOnline: () => void;
  goOffline: () => void;
  receiveOffer: (offer: RideOffer) => void;
  tick: () => void;
  decline: () => void;
  accept: () => void;
  arrive: () => void;
  startTrip: (otp: string) => boolean;
  reset: () => void;
}

// Local preview fixture. A backend adapter will supply its own ID/deadline later.
export function createDemoOffer(now: number): RideOffer {
  return {
    id: `demo-${now}`, fare: 300, currency: 'USD',
    pickup: 'Forum Mall, Koramangala', dropoff: 'TCS Tech Park',
    rider: 'Priya Sharma', rating: '4.8',
    durationMs: 15000, expiresAt: now + 15000,
  };
}

export const useHomeRideStore = create<HomeRideStore>((set, get) => ({
  ride: { status: 'offline' },
  goOnline: () => {
    if (get().ride.status !== 'offline') return;
    set({ ride: { status: 'online', demoDueAt: Date.now() + 5000 } });
    logger.info('home.preview.online', { scope: 'home' });
  },
  goOffline: () => {
    if (get().ride.status !== 'online') return;
    set({ ride: { status: 'offline' } });
    logger.info('home.preview.offline', { scope: 'home' });
  },
  receiveOffer: (offer) => {
    if (get().ride.status !== 'online' || offer.expiresAt <= Date.now() ||
      !Number.isFinite(offer.expiresAt) || !Number.isFinite(offer.durationMs) ||
      offer.durationMs <= 0) return;
    set({ ride: { status: 'request', offer } });
    logger.info('home.preview.offer_received', { scope: 'home' });
  },
  tick: () => {
    const ride = get().ride;
    if (ride.status === 'online' && ride.demoDueAt !== null && Date.now() >= ride.demoDueAt) {
      get().receiveOffer(createDemoOffer(Date.now()));
    } else if (ride.status === 'request' && Date.now() >= ride.offer.expiresAt) {
      set({ ride: { status: 'online', demoDueAt: null } });
      logger.info('home.preview.offer_expired', { scope: 'home' });
    }
  },
  decline: () => {
    if (get().ride.status !== 'request') return;
    set({ ride: { status: 'online', demoDueAt: null } });
    logger.info('home.preview.offer_declined', { scope: 'home' });
  },
  accept: () => {
    const ride = get().ride;
    if (ride.status !== 'request') return;
    if (Date.now() >= ride.offer.expiresAt) { get().tick(); return; }
    set({ ride: { status: 'arriving', offer: ride.offer } });
    logger.info('home.preview.offer_accepted', { scope: 'home' });
  },
  arrive: () => {
    const ride = get().ride;
    if (ride.status !== 'arriving') return;
    set({ ride: { status: 'otp', offer: ride.offer } });
    logger.info('home.preview.arrived', { scope: 'home' });
  },
  startTrip: (otp) => {
    const ride = get().ride;
    if (ride.status !== 'otp' || !/^\d{4}$/.test(otp)) return false;
    set({ ride: { status: 'started', offer: ride.offer } });
    logger.info('home.preview.trip_started', { scope: 'home' });
    return true;
  },
  reset: () => set({ ride: { status: 'offline' } }),
}));
