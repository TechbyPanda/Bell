import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useScheduleClock() {
  const [clock, setClock] = useState<{ now: Date; activation: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function tick(activated = false) {
      clearTimeout(timer);
      const now = new Date();
      setClock((previous) => ({ now, activation: (previous?.activation ?? 0) + Number(activated) }));
      timer = setTimeout(tick, 60_000 - (now.getTime() % 60_000));
    }

    tick();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick(true);
      else clearTimeout(timer);
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return clock;
}
