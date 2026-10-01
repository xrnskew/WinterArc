import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { getActiveArc } from '../../domain/arc';
import { addDays, daysBetween, formatRange, isDateKey, weekStart } from '../../domain/dates';
import {
  defaultReviewWeek,
  getReview,
  previousFocus,
  reviewWeekRange,
  weekReviewSummary,
} from '../../domain/weeklyReview';
import type { DateKey } from '../../domain/types';
import { GlassCard } from '../../design/ui/GlassCard';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { useToday } from '../../hooks/useToday';
import { useAppStore } from '../../store/useAppStore';
import { ReviewForm } from './ReviewForm';
import { WeekSummaryCard } from './WeekSummaryCard';

const ARROW =
  'flex size-11 items-center justify-center rounded-md text-muted transition-colors duration-(--wa-motion-fast) hover:text-number disabled:pointer-events-none disabled:opacity-30';

/** "Эта неделя", "Прошлая неделя" или даты. */
function weekTitle(monday: DateKey, today: DateKey): string {
  const current = weekStart(today);
  if (monday === current) return 'Эта неделя';
  if (monday === addDays(current, -7)) return 'Прошлая неделя';
  return formatRange(monday, addDays(monday, 6));
}

/**
 * Обзор недели: итоги считаются сами, а ты отвечаешь на три вопроса.
 * Неделя — в адресе (?week=2026-10-05), чтобы на неё могла вести ссылка.
 */
export function WeeklyReviewScreen() {
  const today = useToday();
  const data = useAppStore((state) => state.data);
  const [params, setParams] = useSearchParams();
  const arc = getActiveArc(data);
  if (!arc) return null;

  const { first, last } = reviewWeekRange(arc, today);
  const requested = params.get('week');
  const valid =
    requested !== null &&
    isDateKey(requested) &&
    weekStart(requested) === requested &&
    daysBetween(first, requested) >= 0 &&
    daysBetween(requested, last) >= 0;
  const monday = valid ? requested : defaultReviewWeek(arc, today);

  if (daysBetween(today, arc.startDate) > 0) {
    return (
      <>
        <ScreenHeader title="Обзор недели" />
        <GlassCard className="p-5">
          <p className="text-base text-text">
            Арка ещё не началась — обзор появится в её первую неделю.
          </p>
        </GlassCard>
      </>
    );
  }

  const summary = weekReviewSummary(data, arc, monday, today);
  const focus = previousFocus(data, monday);
  const go = (week: DateKey) => setParams({ week }, { replace: true });

  return (
    <>
      <ScreenHeader title="Обзор недели" description={formatRange(monday, summary.sunday)} />

      <div className="on-snow -mx-2 mb-4 flex items-center justify-between">
        <button
          type="button"
          className={ARROW}
          onClick={() => go(addDays(monday, -7))}
          disabled={daysBetween(first, monday) <= 0}
          aria-label="Предыдущая неделя"
        >
          <ChevronLeft size={22} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <p className="text-base text-text" aria-live="polite">
          {weekTitle(monday, today)}
        </p>
        <button
          type="button"
          className={ARROW}
          onClick={() => go(addDays(monday, 7))}
          disabled={daysBetween(monday, last) <= 0}
          aria-label="Следующая неделя"
        >
          <ChevronRight size={22} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {focus && (
          <GlassCard as="section" aria-label="Фокус недели" className="p-4">
            <p className="text-sm text-muted">Фокус этой недели — из прошлого обзора</p>
            <p className="mt-1 text-base text-text">{focus}</p>
          </GlassCard>
        )}

        <WeekSummaryCard summary={summary} />

        {/* key: при смене недели форма открывается заново с ответами этой недели. */}
        <ReviewForm key={monday} monday={monday} review={getReview(data, monday)} />
      </div>
    </>
  );
}
