import { Link } from 'react-router';
import { PATHS } from '../../app/routes';
import {
  arcDayNumber,
  arcLength,
  arcPhase,
  arcProgress,
  daysUntilEnd,
  daysUntilStart,
} from '../../domain/arc';
import { formatDayMonth, formatRange } from '../../domain/dates';
import type { Arc, DateKey } from '../../domain/types';
import { BigNumber } from '../../design/ui/BigNumber';
import { plural } from '../../lib/plural';
import { ArcTally } from '../arc/ArcTally';

interface ArcHeroProps {
  arc: Arc;
  today: DateKey;
}

const days = (n: number) => plural(n, 'день', 'дня', 'дней');

/**
 * Верх командного центра: название арки, отсчёт и зарубки.
 * Стоит прямо на метели, без стекла.
 */
export function ArcHero({ arc, today }: ArcHeroProps) {
  const phase = arcPhase(arc, today);
  const length = arcLength(arc);
  const dayNumber = arcDayNumber(arc, today);
  const percent = Math.round(arcProgress(arc, today) * 100);

  let number: number;
  let label: string;
  if (phase === 'upcoming') {
    number = daysUntilStart(arc, today);
    label = `${days(number)} до начала арки`;
  } else if (phase === 'active') {
    number = daysUntilEnd(arc, today);
    label = number === 0 ? 'сегодня последний день арки' : `${days(number)} до конца арки`;
  } else {
    number = length;
    label = `${days(length)} позади, арка завершена`;
  }

  return (
    <section aria-label="Арка" className="on-snow">
      <h1 className="screen-title text-3xl text-number">{arc.name}</h1>
      <p className="mt-1 text-sm text-muted">{formatRange(arc.startDate, arc.endDate)}</p>

      <div className="mt-8">
        <BigNumber value={number} size="xl" />
        <p className="mt-1 text-sm text-muted">{label}</p>
      </div>

      <div className="mt-6">
        <ArcTally
          arc={arc}
          today={today}
          label={`Арка: день ${dayNumber} из ${length}, пройдено ${percent}%`}
        />
        <div className="mt-2 flex justify-between gap-4 text-sm text-muted">
          <span>
            {phase === 'upcoming'
              ? `Старт ${formatDayMonth(arc.startDate)}`
              : `День ${dayNumber} из ${length}`}
          </span>
          <span>
            Пройдено <span className="numeric">{percent}%</span>
          </span>
        </div>
      </div>

      {phase === 'finished' && (
        <p className="mt-6 text-base text-text">
          Арка позади.{' '}
          <Link to={PATHS.settings} className="underline underline-offset-4 hover:text-number">
            Завершить её и начать новую
          </Link>
        </p>
      )}
    </section>
  );
}
