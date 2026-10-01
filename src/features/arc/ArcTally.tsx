import { useMemo } from 'react';
import { arcDays } from '../../domain/arc';
import type { Arc, DateKey } from '../../domain/types';
import { Tally, type TallyDay } from '../../design/ui/tally/Tally';

interface ArcTallyProps {
  arc: Pick<Arc, 'startDate' | 'endDate'>;
  today: DateKey;
  label: string;
}

/**
 * Зарубки для арки. Пока прошедшие дни одного тона: индекс дисциплины
 * и срывы появятся вместе с привычками (этапы «в» и «г»).
 */
export function ArcTally({ arc, today, label }: ArcTallyProps) {
  const days = useMemo<TallyDay[]>(
    () =>
      arcDays(arc, today).map((day) => ({
        key: day.date,
        weekday: day.weekday,
        status: day.status,
        score: null,
        relapse: false,
      })),
    [arc, today],
  );

  return <Tally days={days} label={label} />;
}
