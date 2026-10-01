import type { Settings } from '../../domain/types';
import type { ThemeTokens } from '../tokens';
import { winterTheme } from './winter';

/** Все темы приложения. Новая тема: файл рядом + строка здесь + id в Settings.themeId. */
export const THEMES: Record<Settings['themeId'], ThemeTokens> = {
  winter: winterTheme,
};
