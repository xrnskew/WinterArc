/**
 * «ТЯГА СЕЙЧАС»: 5 минут и дыхание 4-4-6 —
 * вдох 4 секунды, задержка 4, выдох 6. Цикл — 14 секунд.
 */

export const CRAVING_SECONDS = 5 * 60;

export type BreathPhase = 'inhale' | 'hold' | 'exhale';

export const BREATH_PHASES: { phase: BreathPhase; seconds: number; label: string }[] = [
  { phase: 'inhale', seconds: 4, label: 'Вдох' },
  { phase: 'hold', seconds: 4, label: 'Задержка' },
  { phase: 'exhale', seconds: 6, label: 'Выдох' },
];

export const BREATH_CYCLE_SECONDS = BREATH_PHASES.reduce((sum, p) => sum + p.seconds, 0);

export interface BreathState {
  phase: BreathPhase;
  label: string;
  /** Сколько секунд осталось в фазе: 4, 3, 2, 1. */
  secondsLeft: number;
  /** Насколько прошла фаза: 0…1. */
  progress: number;
}

/** Фаза дыхания через elapsed секунд от начала. */
export function breathingAt(elapsed: number): BreathState {
  let t = ((elapsed % BREATH_CYCLE_SECONDS) + BREATH_CYCLE_SECONDS) % BREATH_CYCLE_SECONDS;
  for (const { phase, seconds, label } of BREATH_PHASES) {
    if (t < seconds) {
      return { phase, label, secondsLeft: Math.ceil(seconds - t), progress: t / seconds };
    }
    t -= seconds;
  }
  // Сюда не попадаем: t всегда меньше длины цикла.
  return { phase: 'inhale', label: 'Вдох', secondsLeft: 4, progress: 0 };
}

/** 299 → "4:59" */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
