import { createDemoOffer, useHomeRideStore } from '@/store/homeRideStore';

const store = () => useHomeRideStore.getState();
const advanceTo = (time: number) => {
  jest.setSystemTime(time);
  store().tick();
};
const request = () => {
  store().goOnline();
  advanceTo(105_000);
};
const arrive = () => {
  request();
  store().accept();
  store().arrive();
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(100_000);
  store().reset();
});
afterEach(() => {
  store().reset();
  jest.useRealTimers();
});

test('going online waits five seconds, then receives one 15-second offer', () => {
  expect(store().ride).toEqual({ status: 'offline' });
  store().goOnline();
  expect(store().ride).toEqual({ status: 'online', demoDueAt: 105_000 });
  advanceTo(104_999);
  store().goOnline();
  expect(store().ride).toEqual({ status: 'online', demoDueAt: 105_000 });
  advanceTo(105_000);
  expect(store().ride).toMatchObject({
    status: 'request', offer: { durationMs: 15_000, expiresAt: 120_000, fare: 300 },
  });
  const offerState = store().ride;
  advanceTo(106_000);
  expect(store().ride).toBe(offerState);
});

test('offer expiration transitions once and stays online without endless demo offers', () => {
  request();
  advanceTo(119_999);
  expect(store().ride.status).toBe('request');
  const changed = jest.fn();
  const unsubscribe = useHomeRideStore.subscribe(changed);
  advanceTo(120_000);
  expect(store().ride).toEqual({ status: 'online', demoDueAt: null });
  advanceTo(300_000);
  expect(store().ride).toEqual({ status: 'online', demoDueAt: null });
  expect(changed).toHaveBeenCalledTimes(1);
  unsubscribe();
});

test('accept at the deadline is rejected even before the next tick', () => {
  request();
  jest.setSystemTime(120_000);
  store().accept();
  expect(store().ride).toEqual({ status: 'online', demoDueAt: null });
});

test('accepted ride keeps its offer and never expires into waiting', () => {
  request();
  jest.setSystemTime(119_999);
  store().accept();
  const accepted = store().ride;
  expect(accepted.status).toBe('arriving');
  advanceTo(300_000);
  store().accept();
  store().goOffline();
  store().decline();
  expect(store().ride).toBe(accepted);
});

test('decline returns to online waiting; another online cycle can request again', () => {
  request();
  store().decline();
  expect(store().ride).toEqual({ status: 'online', demoDueAt: null });
  advanceTo(300_000);
  expect(store().ride.status).toBe('online');
  store().goOffline();
  store().goOnline();
  advanceTo(305_000);
  expect(store().ride.status).toBe('request');
});

test('going offline cancels the scheduled demo and ignores incoming offers', () => {
  store().goOnline();
  advanceTo(104_000);
  store().goOffline();
  advanceTo(110_000);
  store().receiveOffer(createDemoOffer(Date.now()));
  expect(store().ride).toEqual({ status: 'offline' });
});

test('a supplied offer replaces the pending demo and preserves its own deadline', () => {
  store().goOnline();
  const offer = { ...createDemoOffer(Date.now()), id: 'incoming', durationMs: 8000, expiresAt: 108_000 };
  store().receiveOffer(offer);
  expect(store().ride).toEqual({ status: 'request', offer });
  advanceTo(105_000);
  expect(store().ride).toEqual({ status: 'request', offer });
  advanceTo(108_000);
  expect(store().ride).toEqual({ status: 'online', demoDueAt: null });
});

test.each([
  { expiresAt: 100_000 }, { expiresAt: Number.NaN },
  { expiresAt: Number.POSITIVE_INFINITY }, { durationMs: 0 },
  { durationMs: Number.NaN }, { durationMs: -1 },
])('invalid incoming timing is ignored: %j', (invalid) => {
  store().goOnline();
  store().receiveOffer({ ...createDemoOffer(Date.now()), ...invalid });
  expect(store().ride).toEqual({ status: 'online', demoDueAt: 105_000 });
});

test.each(['1234', '4477', '0000'])('arrive then start accepts any four digits: %s', (otp) => {
  arrive();
  expect(store().ride.status).toBe('otp');
  expect(store().startTrip(otp)).toBe(true);
  expect(store().ride.status).toBe('started');
  expect(store().startTrip(otp)).toBe(false);
  advanceTo(300_000);
  expect(store().ride.status).toBe('started');
});

test.each(['', '123', '12345', '12a4', ' 1234', '１２３４'])('rejects invalid OTP without advancing: %j', (otp) => {
  arrive();
  expect(store().startTrip(otp)).toBe(false);
  expect(store().ride.status).toBe('otp');
});

test('arrive and start cannot skip accepting the ride', () => {
  store().arrive();
  expect(store().startTrip('1234')).toBe(false);
  expect(store().ride.status).toBe('offline');
  request();
  store().arrive();
  expect(store().startTrip('1234')).toBe(false);
  expect(store().ride.status).toBe('request');
});

test('reset clears the active ride and all pending demo work', () => {
  arrive();
  store().reset();
  advanceTo(300_000);
  expect(store().ride).toEqual({ status: 'offline' });
  store().goOnline();
  store().reset();
  advanceTo(400_000);
  expect(store().ride).toEqual({ status: 'offline' });
});
