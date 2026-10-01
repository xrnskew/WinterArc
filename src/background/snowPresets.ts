import type { SnowIntensity } from '../domain/types';

/** Параметры метели для одной ступени ползунка. */
export interface SnowPreset {
  /** Слоёв глубины: от дальних мелких хлопьев к ближним крупным. */
  layers: number;
  /** Доля ячеек, в которых есть хлопья (0…1). */
  density: number;
  /** Множитель скорости падения. */
  fallSpeed: number;
  /** Сила ветра: 0 — штиль, 1 — обычные порывы. */
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
    layers: 3,
    density: 0.32,
    fallSpeed: 0.8,
    wind: 0.35,
    driftAlpha: 0.025,
    renderScale: 0.75,
    cssFlakes: 14,
  },
  snow: {
    layers: 5,
    density: 0.45,
    fallSpeed: 1,
    wind: 0.75,
    driftAlpha: 0.045,
    renderScale: 0.7,
    cssFlakes: 22,
  },
  blizzard: {
    layers: 7,
    density: 0.62,
    fallSpeed: 1.35,
    wind: 1.5,
    driftAlpha: 0.065,
    renderScale: 0.6,
    cssFlakes: 32,
  },
};

/** Подписи для ползунка в настройках — в том же порядке, что и ступени. */
export const SNOW_LEVELS: { value: SnowIntensity; label: string }[] = [
  { value: 'off', label: 'Выкл' },
  { value: 'light', label: 'Лёгкий снег' },
  { value: 'snow', label: 'Метель' },
  { value: 'blizzard', label: 'Буран' },
];
