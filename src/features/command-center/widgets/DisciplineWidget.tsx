import { weekSummary } from '../../../domain/discipline';
import { BigNumber } from '../../../design/ui/BigNumber';
import type { WidgetProps } from './WidgetFrame';

/** Индекс дисциплины недели 0–100 и разница с прошлой неделей. */
export function DisciplineWidget({ data, arc, today, firstOpen }: WidgetProps) {
  const week = weekSummary(data, arc, today);

  if (week.index === null) {
    return (
      <p className="text-sm text-muted">
        Неделя только началась. Отметь первую привычку — и появится индекс.
      </p>
    );
  }

  const delta = week.previousIndex === null ? null : week.index - week.previousIndex;
  let comparison = 'прошлой недели в арке не было';
  if (delta !== null) {
    comparison =
      delta === 0
        ? 'как на прошлой неделе'
        : `на ${Math.abs(delta)} ${delta > 0 ? 'выше' : 'ниже'}, чем на прошлой`;
  }

  return (
    <>
      <BigNumber value={week.index} size="lg" fromZero={firstOpen} />
      <p className="mt-1 text-sm text-muted">{comparison}</p>
    </>
  );
}
