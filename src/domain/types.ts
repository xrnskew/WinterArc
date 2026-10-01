/**
 * Модель данных приложения.
 * Этап «а»: только настройки фона. Полная модель (арки, привычки,
 * цели…) появится на этапе «б» — см. docs/PLAN.md.
 */

/** Интенсивность метели: выкл / лёгкий снег / метель / буран. */
export type SnowIntensity = 'off' | 'light' | 'snow' | 'blizzard';

/** auto — определить по устройству; full — шейдер; lite — CSS-снежинки. */
export type PerformanceMode = 'auto' | 'full' | 'lite';

export interface Settings {
  themeId: 'winter';
  snow: SnowIntensity;
  performance: PerformanceMode;
}
