import { describe, expect, it } from 'vitest';
import { layoutTally, MIN_UNIT_PX, weekIndexes } from './tallyLayout';

/** Дни недели для арки длиной `days`, начиная с `firstWeekday` (1 = пн). */
function arcWeekdays(days: number, firstWeekday: number): number[] {
  return Array.from({ length: days }, (_, i) => ((firstWeekday - 1 + i) % 7) + 1);
}

// 1 октября 2026 — четверг, арка до 31 декабря: 92 дня.
const winterArc = arcWeekdays(92, 4);

describe('weekIndexes', () => {
  it('новая неделя начинается с понедельника', () => {
    expect(weekIndexes([4, 5, 6, 7, 1, 2])).toEqual([0, 0, 0, 0, 1, 1]);
  });

  it('92 дня с четверга — это 14 календарных недель', () => {
    expect(weekIndexes(winterArc).at(-1)).toBe(13);
  });
});

describe('layoutTally', () => {
  it('на широком экране — одна строка', () => {
    const layout = layoutTally(winterArc, 900);
    expect(layout.rows).toBe(1);
    expect(layout.unit).toBeGreaterThanOrEqual(MIN_UNIT_PX);
  });

  it('на телефоне 360px (контент 328px) — две строки по 7 недель', () => {
    const layout = layoutTally(winterArc, 328);
    expect(layout.rows).toBe(2);
    expect(layout.unit).toBeGreaterThanOrEqual(MIN_UNIT_PX);
  });

  it('в несколько строк день недели — это столбец (понедельники друг под другом)', () => {
    const layout = layoutTally(winterArc, 328);
    const weekPitch = 8; // 7 дней + 1 зазор между неделями
    layout.positions.forEach(({ x }, i) => {
      const column = Math.round(x / layout.unit) % weekPitch;
      expect(column).toBe(winterArc[i] - 1);
    });
  });

  it('все черты помещаются в ширину', () => {
    for (const width of [280, 328, 358, 600, 900]) {
      const layout = layoutTally(winterArc, width);
      for (const { x } of layout.positions) {
        expect(x + layout.tickWidth).toBeLessThanOrEqual(width);
      }
    }
  });

  it('черты идут слева направо без наложений', () => {
    const layout = layoutTally(winterArc, 328);
    for (let i = 1; i < layout.positions.length; i++) {
      const prev = layout.positions[i - 1];
      const curr = layout.positions[i];
      if (curr.row === prev.row) expect(curr.x).toBeGreaterThan(prev.x + layout.tickWidth);
    }
  });

  it('длинная арка (год) переносится на несколько строк', () => {
    const layout = layoutTally(arcWeekdays(365, 1), 328);
    expect(layout.rows).toBeGreaterThan(2);
  });

  it('десктоп 1440px: одна строка во всю ширину, черта не толще заданной', () => {
    const layout = layoutTally(winterArc, 1104, MIN_UNIT_PX, 5);
    expect(layout.rows).toBe(1);
    expect(layout.tickWidth).toBe(5);
    const last = layout.positions.at(-1)!;
    expect(last.x + layout.tickWidth).toBeGreaterThan(1104 * 0.95);
  });
});
