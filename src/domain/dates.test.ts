import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysBetween,
  eachDay,
  formatDayMonth,
  formatRange,
  isDateKey,
  toDateKey,
  weekdayOf,
  weekStart,
} from './dates';

describe('даты', () => {
  it('Date → DateKey по местному времени', () => {
    expect(toDateKey(new Date(2026, 9, 1, 23, 59))).toBe('2026-10-01');
  });

  it('проверяет формат', () => {
    expect(isDateKey('2026-10-01')).toBe(true);
    expect(isDateKey('2026-13-01')).toBe(false);
    expect(isDateKey('1 октября')).toBe(false);
    expect(isDateKey('')).toBe(false);
  });

  it('прибавляет дни через границы месяцев и лет', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('считает календарные дни (переход на зимнее время не мешает)', () => {
    expect(daysBetween('2026-10-01', '2026-12-31')).toBe(91);
    expect(daysBetween('2026-10-20', '2026-10-30')).toBe(10);
    expect(daysBetween('2026-10-03', '2026-10-01')).toBe(-2);
  });

  it('день недели: 1 октября 2026 — четверг, 4-е — воскресенье', () => {
    expect(weekdayOf('2026-10-01')).toBe(4);
    expect(weekdayOf('2026-10-04')).toBe(7);
    expect(weekdayOf('2026-10-05')).toBe(1);
  });

  it('начало недели — понедельник', () => {
    expect(weekStart('2026-10-01')).toBe('2026-09-28');
    expect(weekStart('2026-10-05')).toBe('2026-10-05');
    expect(weekStart('2026-10-04')).toBe('2026-09-28');
  });

  it('перечисляет дни включительно', () => {
    expect(eachDay('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(eachDay('2026-10-02', '2026-10-01')).toEqual([]);
  });

  it('пишет даты по-русски', () => {
    expect(formatDayMonth('2026-10-01')).toBe('1 октября');
    expect(formatRange('2026-10-01', '2026-12-31')).toBe('1 окт. – 31 дек. 2026');
    expect(formatRange('2026-12-01', '2027-01-31')).toBe('1 дек. 2026 – 31 янв. 2027');
  });
});

describe('окружение тестов', () => {
  it('часовой пояс с переходом на зимнее время', () => {
    const summer = new Date(2026, 9, 24).getTimezoneOffset();
    const winterTime = new Date(2026, 9, 26).getTimezoneOffset();
    expect(summer).not.toBe(winterTime);
  });
});
