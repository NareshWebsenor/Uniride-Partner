import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useHomeRideStore } from '@/store/homeRideStore';

export function useHomeRideLifecycle() {
  const focused = useIsFocused();
  const needsTick = useHomeRideStore(({ ride }) =>
    ride.status === 'request' || (ride.status === 'online' && ride.demoDueAt !== null));
  useEffect(() => {
    if (!focused || !needsTick) return;
    const tick = () => {
      if (!focused || AppState.currentState !== 'active') return;
      useHomeRideStore.getState().tick();
    };
    tick();
    const timer = setInterval(tick, 200);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && focused) useHomeRideStore.getState().tick();
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [focused, needsTick]);
  // Preview session belongs to MainTabs; logout/unmount must release it.
  useEffect(() => () => useHomeRideStore.getState().reset(), []);
}
