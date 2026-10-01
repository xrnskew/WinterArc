/**
 * Раскладка «зарубок»: где стоит черта каждого дня арки.
 *
 * Дни сгруппированы по календарным неделям (пн–вс), между неделями —
 * промежуток шириной в один день. Если на одной строке черты выходят
 * тоньше MIN_UNIT_PX, лента переносится на 2, 3… строки по целым неделям,
 * и дни недели выстраиваются в столбцы (понедельники друг под другом).
 */

/** Минимальная ширина места под один день (черта + зазор), CSS px. */
export const MIN_UNIT_PX = 4;
/** Черта занимает половину места, вторая половина — зазор. */
const TICK_SHARE = 0.5;
/** Толще не делаем: на широком экране черты остаются тонкими зарубками. */
export const MAX_TICK_PX = 3;
/** Промежуток между неделями, в днях. */
const WEEK_GAP = 1;
const MAX_ROWS = 4;

export interface TallyPosition {
  x: number; // левый край черты, px
  row: number; // номер строки с нуля
}

export interface TallyLayout {
  rows: number;
  /** Место под один день, px. */
  unit: number;
  tickWidth: number;
  positions: TallyPosition[];
}

/** Номер недели для каждого дня: новая неделя начинается с понедельника. */
export function weekIndexes(weekdays: number[]): number[] {
  let week = 0;
  return weekdays.map((weekday, i) => {
    if (i > 0 && weekday === 1) week += 1;
    return week;
  });
}

function tickWidthFor(unit: number, maxTick: number): number {
  return Math.min(unit * TICK_SHARE, maxTick);
}

/**
 * @param weekdays день недели каждого дня арки: 1 = пн … 7 = вс
 * @param width ширина контейнера, px
 * @param maxTick самая толстая черта, px
 */
export function layoutTally(
  weekdays: number[],
  width: number,
  minUnit: number = MIN_UNIT_PX,
  maxTick: number = MAX_TICK_PX,
): TallyLayout {
  const weeks = weekIndexes(weekdays);
  const weekCount = (weeks.at(-1) ?? 0) + 1;

  // Одна строка: дни подряд, между неделями зазор.
  const singleRowUnits = weekdays.length + (weekCount - 1) * WEEK_GAP;
  const singleUnit = width / singleRowUnits;
  if (singleUnit >= minUnit) {
    return {
      rows: 1,
      unit: singleUnit,
      tickWidth: tickWidthFor(singleUnit, maxTick),
      positions: weeks.map((week, i) => ({ x: (i + week * WEEK_GAP) * singleUnit, row: 0 })),
    };
  }

  // Несколько строк: по целым неделям, день недели = столбец.
  let rows = 2;
  let weeksPerRow = Math.ceil(weekCount / rows);
  let unit = width / (weeksPerRow * 7 + (weeksPerRow - 1) * WEEK_GAP);
  while (unit < minUnit && rows < MAX_ROWS) {
    rows += 1;
    weeksPerRow = Math.ceil(weekCount / rows);
    unit = width / (weeksPerRow * 7 + (weeksPerRow - 1) * WEEK_GAP);
  }
  // Строк могло понадобиться меньше, чем rows (например, 3 недели на 4 строки).
  rows = Math.ceil(weekCount / weeksPerRow);

  return {
    rows,
    unit,
    tickWidth: tickWidthFor(unit, maxTick),
    positions: weeks.map((week, i) => {
      const weekInRow = week % weeksPerRow;
      const slot = weekInRow * (7 + WEEK_GAP) + (weekdays[i] - 1);
      return { x: slot * unit, row: Math.floor(week / weeksPerRow) };
    }),
  };
}
