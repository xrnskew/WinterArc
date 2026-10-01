import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/** Быстрый старт и долгое плавное торможение — как у табло. */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - 2 ** (-10 * t);
}

interface CountUpOptions {
  /** Длительность пересчёта, мс. */
  duration?: number;
  /** Считать от нуля при первом показе. По умолчанию — сразу показать число. */
  fromZero?: boolean;
}

/**
 * Плавно «докручивает» число до target.
 * Анимация идёт, только когда target изменился (или при fromZero на старте),
 * а при «Уменьшить движение» число просто меняется.
 */
export function useCountUp(target: number, { duration = 900, fromZero = false }: CountUpOptions = {}) {
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(fromZero && !reducedMotion ? 0 : target);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (reducedMotion || from === target) {
      shownRef.current = target;
      setValue(target);
      return;
    }

    let rafId = 0;
    const startedAt = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const next = from + (target - from) * easeOutExpo(progress);
      shownRef.current = next;
      setValue(next);
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, reducedMotion]);

  return value;
}
