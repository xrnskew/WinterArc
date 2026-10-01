import { arcLength, validateArcDraft, type ArcDraft } from '../../domain/arc';
import { formatRange } from '../../domain/dates';
import type { DateKey } from '../../domain/types';
import { BigNumber } from '../../design/ui/BigNumber';
import { GlassCard } from '../../design/ui/GlassCard';
import { plural } from '../../lib/plural';
import { ArcFields } from '../arc/ArcFields';
import { ArcTally } from '../arc/ArcTally';
import { StepHeading } from './StepHeading';

interface StepArcProps {
  draft: ArcDraft;
  today: DateKey;
  showErrors: boolean;
  onChange: (patch: Partial<ArcDraft>) => void;
}

/** Шаг 1: название и даты. Сверху — сама арка: число дней и зарубки. */
export function StepArc({ draft, today, showErrors, onChange }: StepArcProps) {
  const errors = validateArcDraft(draft);
  const length = errors.dates ? null : arcLength(draft);

  return (
    <>
      <StepHeading title="Новая арка">
        Отрезок, на котором ты каждый день держишь дисциплину. По умолчанию — до 31 декабря.
      </StepHeading>

      {length !== null && (
        <div className="on-snow mt-8">
          <BigNumber value={length} size="xl" fromZero />
          <p className="mt-1 text-sm text-muted">
            {plural(length, 'день', 'дня', 'дней')} в арке,{' '}
            {formatRange(draft.startDate, draft.endDate)}
          </p>
          <div className="mt-5">
            <ArcTally arc={draft} today={today} label={`Арка на ${length} дней`} />
          </div>
        </div>
      )}

      <GlassCard className="mt-8 p-5">
        <ArcFields draft={draft} onChange={onChange} errors={showErrors ? errors : {}} />
      </GlassCard>
    </>
  );
}
