import type { ThemeTokens } from '../tokens';

/**
 * Тема «Суровая зима»: ночь, графит, серые, белые цифры.
 * Единственный цвет — приглушённый красный для срывов и просрочки.
 */
export const winterTheme: ThemeTokens = {
  id: 'winter',
  name: 'Суровая зима',

  color: {
    night: '#0a0a0a',
    graphite: '#1a1a1a',
    gray800: '#2a2a2a',
    gray700: '#3a3a3a',
    gray600: '#4d4d4d',
    gray500: '#666666',
    gray400: '#808080',
    gray300: '#9a9a9a',
    text: '#e8e8e8',
    textMuted: '#9a9a9a',
    number: '#ffffff',
    danger: '#bc5050',
    dangerText: '#d07a7a',
    dangerSoft: 'rgba(188, 80, 80, 0.15)',
    glass: 'rgba(16, 16, 16, 0.66)',
    glassLite: 'rgba(22, 22, 22, 0.94)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    snowflake: '#ffffff',
  },

  accent: {
    snow: '#ffffff',
    frost: '#dcdcdc',
    silver: '#bdbdbd',
    steel: '#9e9e9e',
    ash: '#8a8a8a',
    smoke: '#757575',
  },

  font: {
    display: "'Oswald', 'Arial Narrow', sans-serif",
    body: "'Golos Text', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },

  text: {
    xs: { size: '12px', lineHeight: '1.4' },
    sm: { size: '14px', lineHeight: '1.45' },
    base: { size: '16px', lineHeight: '1.5' },
    lg: { size: '18px', lineHeight: '1.45' },
    xl: { size: '21px', lineHeight: '1.3' },
    '2xl': { size: '24px', lineHeight: '1.25' },
    '3xl': { size: '36px', lineHeight: '1.1' },
    '4xl': { size: '48px', lineHeight: '1' },
    '5xl': { size: '72px', lineHeight: '0.95' },
    '6xl': { size: '96px', lineHeight: '0.9' },
  },

  radius: { sm: '2px', md: '4px', lg: '8px' },

  effect: {
    glassBlur: '16px',
    glow: '0 0 12px rgba(255, 255, 255, 0.35)',
    glowStrong: '0 0 24px rgba(255, 255, 255, 0.6)',
    grainOpacity: '0.045',
  },

  motion: {
    fast: '120ms',
    base: '220ms',
    slow: '600ms',
    countUp: '900ms',
    easeOut: 'cubic-bezier(0.2, 0, 0, 1)',
    easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
};
