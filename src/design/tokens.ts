import type { AccentKey } from '../domain/types';

/**
 * Дизайн-токены: описание того, ИЗ ЧЕГО состоит тема.
 * Сами значения лежат в themes/*.ts — новая тема = новый файл там.
 *
 * Правило контраста (проверяется в themeContrast.test.ts):
 * - текст пишем только цветами text, textMuted, number, dangerText —
 *   они дают ≥ 4.5:1 (WCAG AA) даже на стекле, через которое светит снег;
 * - серые gray400 и темнее — только рамки, черты, графики (≥ 3:1 или декор).
 */

/** Ступень шкалы шрифтов: размер и межстрочный интервал. */
export interface TypeStep {
  size: string;
  lineHeight: string;
}

export interface ThemeTokens {
  id: string;
  name: string;

  color: {
    /** Фон приложения — ночь. */
    night: string;
    /** Основа карточек и панелей. */
    graphite: string;
    /** Серые от тёмного к светлому: рамки, неактивные черты, сетка графиков. */
    gray800: string;
    gray700: string;
    gray600: string;
    gray500: string;
    gray400: string;
    gray300: string;
    /** Основной текст. */
    text: string;
    /** Вторичный текст: подписи, пояснения. Самый тёмный допустимый для текста. */
    textMuted: string;
    /** Цифры-табло и самые яркие акценты. */
    number: string;
    /** Срывы и просрочка: черты, рамки, иконки. */
    danger: string;
    /** Срывы и просрочка: текст. */
    dangerText: string;
    /** Срывы и просрочка: подложка. */
    dangerSoft: string;
    /** Матовое стекло карточек. */
    glass: string;
    /** Стекло без размытия — для слабых устройств. */
    glassLite: string;
    glassBorder: string;
    /** Цвет хлопьев в шейдере и CSS-снеге. */
    snowflake: string;
  };

  accent: Record<AccentKey, string>;

  font: {
    /** Сжатый жёсткий шрифт заголовков. */
    display: string;
    /** Основной текст. */
    body: string;
    /** Цифры. */
    mono: string;
  };

  /** Шкала размеров текста (классическая типографская: 12 14 16 18 21 24 36 48 72 96). */
  text: Record<'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl', TypeStep>;

  radius: { sm: string; md: string; lg: string };

  effect: {
    glassBlur: string;
    /** Свечение заливки прогресса и отметок. */
    glow: string;
    /** Сильное свечение — вспышка при отметке, сегодняшняя зарубка. */
    glowStrong: string;
    /** Прозрачность шум-текстуры плёнки на карточках. */
    grainOpacity: string;
  };

  motion: {
    fast: string;
    base: string;
    slow: string;
    /** Длительность пересчёта цифр. */
    countUp: string;
    easeOut: string;
    easeOutExpo: string;
  };
}
