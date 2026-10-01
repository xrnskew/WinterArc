import { create } from 'zustand';
import type { Settings } from '../domain/types';

/**
 * Глобальное состояние приложения (Zustand).
 * Компонент читает нужный кусок: useAppStore((s) => s.settings.snow)
 * и перерисовывается только когда меняется именно он.
 *
 * Этап «а»: только настройки фона, в памяти.
 * Этап «б»: вся модель данных + сохранение в localStorage с миграциями.
 */

interface AppState {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  settings: {
    themeId: 'winter',
    snow: 'snow',
    performance: 'auto',
  },
  updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
}));
