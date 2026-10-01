import { useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '../../app/routes';
import { SNOW_LEVELS } from '../../background/snowPresets';
import type { PerformanceMode } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { GlassCard } from '../../design/ui/GlassCard';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { Segmented } from '../../design/ui/Segmented';
import { StepSlider } from '../../design/ui/StepSlider';
import { useAppStore } from '../../store/useAppStore';
import { ArcSettings } from './ArcSettings';
import { DataSettings } from './DataSettings';
import { HabitsSettings } from './HabitsSettings';
import { ScalesSettings } from './ScalesSettings';

const PERFORMANCE_OPTIONS: { value: PerformanceMode; label: string }[] = [
  { value: 'auto', label: 'Авто' },
  { value: 'full', label: 'Полная' },
  { value: 'lite', label: 'Лёгкая' },
];

const PERFORMANCE_HINTS: Record<PerformanceMode, string> = {
  auto: 'Метель подстроится под устройство: на слабом телефоне будет лёгкий CSS-снег.',
  full: 'Всегда живая метель. Если телефон греется — выбери «Авто» или «Лёгкая».',
  lite: 'Редкие снежинки без размытия под карточками. Бережёт батарею.',
};

/** Настройки: арка, привычки, шкалы, виджеты, метель, графика, данные. */
export function SettingsScreen() {
  const settings = useAppStore((state) => state.data.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const resetDashboard = useAppStore((state) => state.resetDashboard);
  const [dashboardReset, setDashboardReset] = useState(false);

  return (
    <>
      <ScreenHeader title="Настройки" />

      <div className="flex flex-col gap-4">
        <ArcSettings />
        <HabitsSettings />
        <ScalesSettings />

        <GlassCard as="section" aria-labelledby="settings-widgets" className="p-5">
          <h2 id="settings-widgets" className="text-base text-text">
            Виджеты
          </h2>
          <p className="mt-1 text-sm text-muted">
            Добавляются и переставляются на{' '}
            <Link to={PATHS.center} className="text-text underline underline-offset-4">
              главном экране
            </Link>{' '}
            кнопкой «Настроить».
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                resetDashboard();
                setDashboardReset(true);
              }}
            >
              Вернуть набор по умолчанию
            </Button>
            <p aria-live="polite" className="text-sm text-text">
              {dashboardReset && 'Набор возвращён'}
            </p>
          </div>
        </GlassCard>

        <GlassCard as="section" className="p-5">
          <StepSlider
            label="Снег на фоне"
            steps={SNOW_LEVELS}
            value={settings.snow}
            onChange={(snow) => updateSettings({ snow })}
          />
        </GlassCard>

        <GlassCard as="section" className="p-5">
          <h2 className="mb-3 text-base text-text">Графика</h2>
          <Segmented
            label="Графика"
            options={PERFORMANCE_OPTIONS}
            value={settings.performance}
            onChange={(performance) => updateSettings({ performance })}
          />
          <p className="mt-3 text-sm text-muted">{PERFORMANCE_HINTS[settings.performance]}</p>
        </GlassCard>

        <DataSettings />
      </div>
    </>
  );
}
