import type { ThemeTokens } from './tokens';

/** "gray800" → "gray-800", "textMuted" → "text-muted", "2xl" → "2xl". */
function toKebab(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([a-z])(\d)/g, '$1-$2')
    .toLowerCase();
}

/**
 * Превращает токены темы в плоский список CSS-переменных:
 * color.gray800 → --wa-color-gray-800, text.sm → --wa-text-sm и --wa-text-sm-line-height.
 * global.css связывает эти переменные с классами Tailwind (bg-night, text-sm…).
 */
export function themeToCssVars(theme: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};

  const groups = {
    color: theme.color,
    accent: theme.accent,
    font: theme.font,
    radius: theme.radius,
    effect: theme.effect,
    motion: theme.motion,
  };
  for (const [group, values] of Object.entries(groups)) {
    for (const [key, value] of Object.entries(values)) {
      vars[`--wa-${group}-${toKebab(key)}`] = value;
    }
  }

  for (const [step, { size, lineHeight }] of Object.entries(theme.text)) {
    vars[`--wa-text-${step}`] = size;
    vars[`--wa-text-${step}-line-height`] = lineHeight;
  }

  return vars;
}

/** Записывает тему в :root. Вызывается один раз до первого рендера (main.tsx). */
export function applyTheme(theme: ThemeTokens): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(themeToCssVars(theme))) {
    root.style.setProperty(name, value);
  }
  root.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.color.night);
}
