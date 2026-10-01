import { useMemo } from 'react';
import { arcDays } from '../../domain/arc';
import type { ArcDayMark } from '../../domain/discipline';
import type { Arc, DateKey } from '../../domain/types';
import { Tally, type TallyDay } from '../../design/ui/tally/Tally';

interface ArcTallyProps {
  arc: Pick<Arc, 'startDate' | 'endDate'>;
  today: DateKey;
  label: string;
  /**
   * Индекс и срывы по дням (domain/discipline.ts → arcDayMarks).
   * Без них — просто лента дней (например, превью в онбординге).
   */
  marks?: ArcDayMark[];
}

/** Зарубки арки: прошедшие дни светлеют по индексу дисциплины, срыв — красный. */
export function ArcTally({ arc, today, label, marks }: ArcTallyProps) {
  const days = useMemo<TallyDay[]>(() => {
    const source =
      marks ?? arcDays(arc, today).map((day) => ({ ...day, score: null, relapse: false }));
    return source.map((day) => ({
      key: day.date,
      weekday: day.weekday,
      status: day.status,
      score: day.score,
      relapse: day.relapse,
    }));
  }, [arc, today, marks]);

  return <Tally days={days} label={label} />;
}
