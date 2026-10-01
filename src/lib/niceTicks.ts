/**
 * Круглые деления оси от нуля: для максимума 36 — 0, 10, 20, 30, 40,
 * а не 0, 9, 18, 27, 36. Шаг — 1, 2 или 5, умноженные на 10ⁿ, не меньше 1.
 */
export function niceTicks(max: number, count = 4): number[] {
  const rough = Math.max(max, 1) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(
    [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough,
    1,
  );
  const top = Math.ceil(Math.max(max, 1) / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}
