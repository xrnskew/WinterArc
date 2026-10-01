/**
 * Числа по-русски: пробел между тысячами, запятая в дробях, настоящий минус.
 * formatNumber(12400) → "12 400", formatNumber(-0.5) → "−0,5"
 */
export function formatNumber(value: number, maxFractionDigits = 2): string {
  const text = Math.abs(value).toLocaleString('ru-RU', {
    maximumFractionDigits: maxFractionDigits,
  });
  // Ноль после округления (−0,001 → "0") — без знака.
  const isZero = Number(text.replace(/\s/g, '').replace(',', '.')) === 0;
  return value < 0 && !isZero ? `−${text}` : text;
}

/**
 * Вычисленное число (темп, прогноз) — без лишней точности:
 * от 100 — целое, от 10 — один знак, меньше — два.
 * formatRounded(1234.567) → "1 235", formatRounded(0.4321) → "0,43"
 */
export function formatRounded(value: number): string {
  const size = Math.abs(value);
  return formatNumber(value, size >= 100 ? 0 : size >= 10 ? 1 : 2);
}

/** Со знаком: "+1 000", "−0,4". Ноль — без знака. */
export function formatSigned(value: number, format = formatRounded): string {
  const text = format(value);
  return value > 0 && text !== '0' ? `+${text}` : text;
}
