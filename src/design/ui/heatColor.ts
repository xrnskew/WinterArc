/** Цвет клетки тепловой карты или черты: 0 — тёмно-серая, 1 — белая, между ними — плавно. */
export function heatColor(value: number): string {
  const percent = Math.round(value * 100);
  return `color-mix(in srgb, var(--wa-color-number) ${percent}%, var(--wa-color-gray-700))`;
}
