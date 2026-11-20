import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Wall-clock deadline remains correct when the app returns from background. */
export function useRetryCountdown(deadline: number) {
  const remaining = () => Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  const [seconds, setSeconds] = useState(remaining);
  useEffect(() => {
    const update = () => setSeconds(remaining());
    update();
    if (deadline <= Date.now()) return;
    const timer = setInterval(update, 1000);
    const subscription = AppState.addEventListener('change', update);
    return () => { clearInterval(timer); subscription.remove(); };
    // The deadline owns this timer; state updates must not reset it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);
  return seconds;
}
