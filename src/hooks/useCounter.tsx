import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function useCounter(target: number, inView: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const startValRef = useRef<number>(0);

  useEffect(() => {
    if (!inView) return;

    startRef.current = null;
    startValRef.current = value;

    const run = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - (startRef.current || now);
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const current = startValRef.current + (target - startValRef.current) * eased;
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(run);
      }
    };

    rafRef.current = requestAnimationFrame(run);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, inView]);

  return value;
}
