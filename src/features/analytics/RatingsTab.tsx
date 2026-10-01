import { lazy, Suspense } from 'react';
import {
  arcRatingAverage,
  ratingWeeks,
  weekdayExtremes,
  WEEKDAY_NAMES,
} from '../../domain/analytics';
import { activeScales } from '../../domain/days';
import type { AppData, Arc, DateKey } from '../../domain/types';
import { BigNumber } from '../../design/ui/BigNumber';
import { EmptyState } from '../../design/ui/EmptyState';
import { GlassCard } from '../../design/ui/GlassCard';
import { HabitIcon } from '../../design/ui/HabitIcon';
import { THEMES } from '../../design/themes';
import { formatNumber } from '../../lib/formatNumber';

// График грузится отдельным файлом: Recharts тяжёлый.
const RatingChart = lazy(() => import('./RatingChart'));

interface RatingsTabProps {
  data: AppData;
  arc: Arc;
  today: DateKey;
}

/** Каждая шкала оценок: среднее за арку, линия по неделям, лучший и худший день недели. */
export function RatingsTab({ data, arc, today }: RatingsTabProps) {
  const scales = activeScales(data);
  const theme = THEMES[data.settings.themeId];
  if (scales.length === 0) {
    return <EmptyState title="Шкал оценок нет" text="Шкалы настраиваются в настройках." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {scales.map((scale) => {
        const average = arcRatingAverage(data, scale.id, arc, today);
        const extremes = weekdayExtremes(data, scale.id, arc, today);
        return (
          <GlassCard key={scale.id} as="section" aria-label={scale.name} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2.5 text-base text-text">
                <HabitIcon name={scale.icon} className="shrink-0" />
                {scale.name}
              </h2>
              {average !== null && (
                <span className="text-right">
                  <BigNumber value={average} size="sm" decimals={1} />
                  <span className="block text-xs text-muted">в среднем</span>
                </span>
              )}
            </div>

            {average === null ? (
              <p className="mt-2 text-sm text-muted">
                Оценок пока нет. Их ставят в чек-ине, в конце дня.
              </p>
            ) : (
              <>
                <p className="mt-1 mb-3 text-sm text-muted">
                  Средняя оценка по неделям. Линия — среднее за арку.
                </p>
                <Suspense fallback={<div className="h-[182px]" />}>
                  <RatingChart
                    weeks={ratingWeeks(data, scale.id, arc, today)}
                    average={average}
                    theme={theme}
                  />
                </Suspense>
                {extremes && (
                  <p className="mt-3 text-sm text-text">
                    Выше всего — {WEEKDAY_NAMES[extremes.best.weekday - 1]} (
                    <span className="numeric">{formatNumber(extremes.best.average, 1)}</span>), ниже
                    всего — {WEEKDAY_NAMES[extremes.worst.weekday - 1]} (
                    <span className="numeric">{formatNumber(extremes.worst.average, 1)}</span>).
                  </p>
                )}
              </>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}
