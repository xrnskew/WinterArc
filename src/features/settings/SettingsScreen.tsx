import { SNOW_LEVELS } from '../../background/snowPresets';
import type { PerformanceMode } from '../../domain/types';
import { GlassCard } from '../../design/ui/GlassCard';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { Segmented } from '../../design/ui/Segmented';
import { StepSlider } from '../../design/ui/StepSlider';
import { useAppStore } from '../../store/useAppStore';
import { StagePlaceholder } from '../StagePlaceholder';

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

export function SettingsScreen() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  return (
    <>
      <ScreenHeader title="Настройки" />

      <div className="flex flex-col gap-4">
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

        <StagePlaceholder stage="з">
          Арка, привычки, шкалы оценок, виджеты, экспорт и импорт данных, сброс.
        </StagePlaceholder>
      </div>
    </>
  );
}
