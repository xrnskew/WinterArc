/**
 * Работа с цветом: разбор строк, смешивание, контраст по WCAG 2.x.
 * Контраст нужен, чтобы тест проверял тему:
 * серый текст на чёрном легко сделать нечитаемым.
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

export type Rgb = [number, number, number];

/** "#9a9a9a" или "rgba(16, 16, 16, 0.66)" → [r, g, b] и альфа. */
export function parseColor(color: string): { rgb: Rgb; alpha: number } {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
    return { rgb, alpha: 1 };
  }
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) throw new Error(`Не понимаю цвет: ${color}`);
  const [r, g, b, a = '1'] = match[1].split(',').map((part) => part.trim());
  return { rgb: [Number(r), Number(g), Number(b)], alpha: Number(a) };
}

/** Кладёт полупрозрачный цвет поверх непрозрачного фона. */
export function blend(top: string, bottom: Rgb): Rgb {
  const { rgb, alpha } = parseColor(top);
  return rgb.map((channel, i) => Math.round(channel * alpha + bottom[i] * (1 - alpha))) as Rgb;
}

function relativeLuminance([r, g, b]: Rgb): number {
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Отношение контраста от 1 до 21. AA для обычного текста — 4.5, для графики — 3. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
