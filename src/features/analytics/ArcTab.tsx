import { lazy, Suspense } from 'react';
import { arcCalendar, arcSummary, arcWeeks } from '../../domain/analytics';
import { formatDayMonth } from '../../domain/dates';
import type { AppData, Arc, DateKey } from '../../domain/types';
import { BigNumber } from '../../design/ui/BigNumber';
import { GlassCard } from '../../design/ui/GlassCard';
import { THEMES } from '../../design/themes';
import { ArcCalendar } from './ArcCalendar';

// График грузится отдельным файлом: Recharts тяжёлый.
const WeeksChart = lazy(() => import('./WeeksChart'));

interface ArcTabProps {
  data: AppData;
  arc: Arc;
  today: DateKey;
}

/** Арка целиком: итоги, календарь по дням, индекс по неделям. */
export function ArcTab({ data, arc, today }: ArcTabProps) {
  const summary = arcSummary(data, arc, today);
  const weeks = arcWeeks(data, arc, today);

  const tiles = [
    { label: 'средний индекс недель', value: summary.averageIndex },
    {
      label: summary.bestWeek
        ? `лучшая неделя, с ${formatDayMonth(summary.bestWeek.monday)}`
        : 'лучшая неделя',
      value: summary.bestWeek?.index ?? null,
    },
    { label: 'дней с индексом 100', value: summary.perfectDays },
    { label: 'отметок за арку', value: summary.marks },
  ];

  return (
    <div className="flex flex-col gap-4">
      <GlassCard as="section" aria-label="Итоги арки" className="grid grid-cols-2 p-0">
        {tiles.map((tile, i) => (
          <div
            key={tile.label}
            className={`min-w-0 p-4 ${i % 2 === 1 ? 'border-l border-gray-800' : ''} ${i > 1 ? 'border-t border-gray-800' : ''}`}
          >
            {tile.value === null ? (
              <span className="numeric text-3xl text-muted">—</span>
            ) : (
              <BigNumber value={tile.value} size="sm" />
            )}
            <p className="mt-1 text-sm text-muted">{tile.label}</p>
          </div>
        ))}
      </GlassCard>

      <GlassCard as="section" aria-label="Календарь арки" className="p-4">
        <ArcCalendar months={arcCalendar(data, arc, today)} />
      </GlassCard>

      <GlassCard as="section" className="p-5">
        <h2 className="mb-1 text-base text-text">Индекс по неделям</h2>
        <Suspense fallback={<div className="h-[212px]" />}>
          <WeeksChart weeks={weeks} theme={THEMES[data.settings.themeId]} />
        </Suspense>
      </GlassCard>
    </div>
  );
}
