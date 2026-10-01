import { X } from 'lucide-react';
import { habitEvents } from '../../domain/abstain';
import { formatDayMonth, formatFullDate, todayKey } from '../../domain/dates';
import type { AppData, Id } from '../../domain/types';
import { GlassCard } from '../../design/ui/GlassCard';
import { cx } from '../../lib/cx';
import { useAppStore } from '../../store/useAppStore';

/** История отказа: срывы с причинами и пережитые тяги. Новые сверху. */
export function AbstainHistory({ data, habitId }: { data: AppData; habitId: Id }) {
  const removeAbstainEvent = useAppStore((state) => state.removeAbstainEvent);
  const events = habitEvents(data, habitId);
  const thisYear = todayKey().slice(0, 4);
  const eventDate = (date: string) =>
    date.startsWith(thisYear) ? formatDayMonth(date) : formatFullDate(date);

  return (
    <GlassCard as="section" className="p-5">
      <h2 className="text-base text-text">История</h2>
      {events.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          Пока пусто. Здесь будут срывы с причинами и каждая тяга, перед которой ты устоял.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-800">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3 py-2.5">
              <span
                aria-hidden="true"
                className={cx(
                  'mt-2 size-2 shrink-0 rounded-full',
                  event.type === 'relapse' ? 'bg-danger' : 'bg-number',
                )}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cx(
                    'text-sm',
                    event.type === 'relapse' ? 'text-danger-text' : 'text-text',
                  )}
                >
                  {event.type === 'relapse' ? 'Срыв' : 'Устоял перед тягой'}
                  <span className="text-muted">, {eventDate(event.date)}</span>
                </p>
                {event.reason && <p className="text-sm text-muted">{event.reason}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeAbstainEvent(event.id)}
                aria-label="Удалить запись"
                className="-my-1 flex size-9 shrink-0 items-center justify-center rounded-md text-muted hover:text-text"
              >
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
