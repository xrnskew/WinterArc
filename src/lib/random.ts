/**
 * Предсказуемый генератор случайных чисел (mulberry32).
 * С одним и тем же seed выдаёт одну и ту же последовательность —
 * удобно для тестов и для CSS-снежинок, которые не должны
 * перескакивать при каждом рендере.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Случайное число в диапазоне [min, max). */
export function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}
