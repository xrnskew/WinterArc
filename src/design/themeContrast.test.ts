import { describe, expect, it } from 'vitest';
import { blend, contrastRatio, parseColor, type Rgb } from './color';
import { winterTheme } from './themes/winter';

const AA_TEXT = 4.5;
const AA_GRAPHICS = 3;

const theme = winterTheme;
const rgb = (color: string): Rgb => parseColor(color).rgb;

/**
 * Худший фон под стеклянной карточкой: за стеклом проплывает размытая
 * ближняя снежинка, и фон светлеет примерно до gray600.
 */
const glassOverSnow = blend(theme.color.glass, rgb(theme.color.gray600));

const backgrounds: Record<string, Rgb> = {
  night: rgb(theme.color.night),
  graphite: rgb(theme.color.graphite),
  glassOverSnow,
};

describe('контраст темы «Суровая зима»', () => {
  const textColors = {
    text: theme.color.text,
    textMuted: theme.color.textMuted,
    number: theme.color.number,
    dangerText: theme.color.dangerText,
  };

  for (const [name, color] of Object.entries(textColors)) {
    for (const [bgName, bg] of Object.entries(backgrounds)) {
      it(`текст ${name} на ${bgName} ≥ ${AA_TEXT}:1`, () => {
        expect(contrastRatio(rgb(color), bg)).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }

  const graphicColors = { danger: theme.color.danger, ...theme.accent };

  for (const [name, color] of Object.entries(graphicColors)) {
    for (const [bgName, bg] of Object.entries(backgrounds)) {
      it(`графика ${name} на ${bgName} ≥ ${AA_GRAPHICS}:1`, () => {
        expect(contrastRatio(rgb(color), bg)).toBeGreaterThanOrEqual(AA_GRAPHICS);
      });
    }
  }

  it('подписи читаются и на стекле без размытия (слабые устройства)', () => {
    const lite = blend(theme.color.glassLite, rgb(theme.color.gray600));
    expect(contrastRatio(rgb(theme.color.textMuted), lite)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
