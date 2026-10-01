import type { SnowIntensity } from '../domain/types';

/**
 * Параметры метели для одной ступени ползунка.
 * Слоёв глубины всегда три (дальний, средний, ближний); интенсивность — это
 * сколько прослоек в каждом слое, как плотно они заполнены, скорость и ветер.
 */
export interface SnowPreset {
  /** Прослоек в каждом слое глубины (1…3): больше — гуще снег. */
  copies: number;
  /** Доля ячеек, в которых есть хлопья (0…1). */
  density: number;
  /** Множитель скорости падения. */
  fallSpeed: number;
  /** Сила ветра: 0 — штиль, 1 — обычный ветер. */
  wind: number;
  /** Непрозрачность позёмки у нижнего края. */
  driftAlpha: number;
  /** Доля разрешения экрана для рендера. Меньше — быстрее и мягче. */
  renderScale: number;
  /** Сколько снежинок в CSS-варианте для слабых устройств. */
  cssFlakes: number;
}

export const SNOW_PRESETS: Record<Exclude<SnowIntensity, 'off'>, SnowPreset> = {
  light: {
    copies: 1,
    density: 0.4,
    fallSpeed: 0.85,
    wind: 0.6,
    driftAlpha: 0.02,
    renderScale: 0.75,
    cssFlakes: 16,
  },
  snow: {
    copies: 2,
    density: 0.5,
    fallSpeed: 1,
    wind: 1,
    driftAlpha: 0.035,
    renderScale: 0.7,
    cssFlakes: 26,
  },
  // Буран — гуще и ветренее, но тоже плавный: ветер нарастает постепенно,
  // а падение лишь чуть быстрее обычного.
  blizzard: {
    copies: 3,
    density: 0.62,
    fallSpeed: 1.25,
    wind: 1.8,
    driftAlpha: 0.05,
    renderScale: 0.6,
    cssFlakes: 38,
  },
};

/** Подписи для ползунка в настройках — в том же порядке, что и ступени. */
export const SNOW_LEVELS: { value: SnowIntensity; label: string }[] = [
  { value: 'off', label: 'Выкл' },
  { value: 'light', label: 'Лёгкий снег' },
  { value: 'snow', label: 'Метель' },
  { value: 'blizzard', label: 'Буран' },
];
