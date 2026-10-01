import { addDays, eachDay } from '../../../domain/dates';
import { averageRating, RATING_MAX, RATING_MIN, ratingSeries } from '../../../domain/days';
import { BigNumber } from '../../../design/ui/BigNumber';
import { Sparkline } from '../../../design/ui/Sparkline';
import type { WidgetProps } from './WidgetFrame';

/** Сколько дней показываем на линии. */
const WINDOW = 14;

/** Одна оценка дня за две недели: среднее крупно и линия. */
export function RatingTrendWidget({ widget, data, today }: WidgetProps) {
  const scale = data.ratingScales.find((item) => item.id === widget.scaleId);
  if (!scale) return <p className="text-sm text-muted">Шкалы больше нет. Убери этот виджет.</p>;

  const points = ratingSeries(data, scale.id, eachDay(addDays(today, -(WINDOW - 1)), today));
  const average = averageRating(points);

  if (average === null) {
    return <p className="text-sm text-muted">Оценок за две недели нет. Ставь их в чек-ине.</p>;
  }

  return (
    <>
      <BigNumber value={average} size="lg" decimals={1} />
      <p className="mb-2 text-sm text-muted">в среднем за {WINDOW} дней</p>
      <Sparkline values={points.map((p) => p.value)} min={RATING_MIN} max={RATING_MAX} />
    </>
  );
}
