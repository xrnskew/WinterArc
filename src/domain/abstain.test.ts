import { describe, expect, it } from 'vitest';
import {
  addAbstainEvent,
  cleanDaysBetween,
  cleanStreak,
  cravingsResisted,
  habitEvents,
  isCleanDay,
  moneySaved,
  removeAbstainEvent,
} from './abstain';
import { makeData, makeHabit } from './testData';
import type { AbstainEvent, AbstainHabit, AppData } from './types';

const smoking = makeHabit('smoking', { kind: 'abstain', costPerDay: 300 }) as AbstainHabit;

function event(id: string, date: string, type: AbstainEvent['type']): AbstainEvent {
  return { id, habitId: 'smoking', date, type, reason: '', createdAt: `${date}T20:00:00.000Z` };
}

function withEvents(events: AbstainEvent[]): AppData {
  return events.reduce(addAbstainEvent, makeData([smoking]));
}

describe('отказ', () => {
  it('без срывов каждый день чистый, включая сегодня', () => {
    const data = withEvents([]);
    expect(isCleanDay(smoking, data, '2026-10-05')).toBe(true);
    expect(cleanStreak(smoking, data, '2026-10-05')).toEqual({ current: 5, best: 5 });
  });

  it('до начала отсчёта дни не чистые', () => {
    expect(isCleanDay(smoking, withEvents([]), '2026-09-30')).toBe(false);
  });

  it('срыв обнуляет серию, но не общий счёт', () => {
    const data = withEvents([event('e1', '2026-10-04', 'relapse')]);
    expect(cleanStreak(smoking, data, '2026-10-07')).toEqual({ current: 3, best: 3 });
    expect(cleanDaysBetween(smoking, data, '2026-10-01', '2026-10-07')).toBe(6);
  });

  it('срыв сегодня — серия 0', () => {
    const data = withEvents([event('e1', '2026-10-07', 'relapse')]);
    expect(cleanStreak(smoking, data, '2026-10-07').current).toBe(0);
  });

  it('два события в один день — один грязный день', () => {
    const data = withEvents([
      event('e1', '2026-10-04', 'relapse'),
      event('e2', '2026-10-04', 'relapse'),
    ]);
    expect(cleanDaysBetween(smoking, data, '2026-10-01', '2026-10-07')).toBe(6);
  });

  it('деньги: чистые дни × стоимость', () => {
    expect(moneySaved(smoking, 6)).toBe(1800);
    expect(moneySaved({ ...smoking, costPerDay: null }, 6)).toBeNull();
  });

  it('тяга не портит день и считается отдельно', () => {
    const data = withEvents([
      event('e1', '2026-10-03', 'craving'),
      event('e2', '2026-10-05', 'craving'),
    ]);
    expect(isCleanDay(smoking, data, '2026-10-03')).toBe(true);
    expect(cravingsResisted(data, 'smoking', '2026-10-01', '2026-10-04')).toBe(1);
  });

  it('события новые сверху, удаление по id', () => {
    const data = withEvents([
      event('e1', '2026-10-02', 'craving'),
      event('e2', '2026-10-05', 'relapse'),
    ]);
    expect(habitEvents(data, 'smoking').map((e) => e.id)).toEqual(['e2', 'e1']);
    expect(habitEvents(removeAbstainEvent(data, 'e2'), 'smoking').map((e) => e.id)).toEqual(['e1']);
  });
});
