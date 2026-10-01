import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { arcHabits } from './habits';
import { addDays, daysBetween, eachDay, fromDateKey, weekStart, weekdayOf } from './dates';
import { arcHabitsAll, dayScore, toIndex, weekScore } from './discipline';
import { averageRating, ratingSeries } from './days';
import { getLog, isDayDone, isWeekDone, weekProgress } from './progress';
import { dayRequirement, habitStartDate, isHabitActiveOn, isWeeklyHabit } from './schedule';
import type { AppData, Arc, DateKey, Habit, Id, RatingScale } from './types';

/**
 * Аналитика арки: недели и дни по индексу, календарь, оценки,
 * связи «привычка или слово в заметке → оценка дня».
 * Всё считается из фактов, ничего не хранится.
 */

/** Последний день арки, который уже наступил (сегодня или конец арки). */
function lastArcDay(arc: Arc, today: DateKey): DateKey {
  return daysBetween(today, arc.endDate) < 0 ? arc.endDate : today;
}

/** Вчерашний и более ранние дни арки — уже закончились. Сегодня ещё идёт. */
function finishedArcDays(arc: Arc, today: DateKey): DateKey[] {
  const yesterday = addDays(today, -1);
  const last = daysBetween(yesterday, arc.endDate) < 0 ? arc.endDate : yesterday;
  return eachDay(arc.startDate, last);
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// ── Недели арки ──────────────────────────────────────────

export interface ArcWeek {
  monday: DateKey;
  status: 'past' | 'current' | 'future';
  /** Индекс недели 0–100; null — неделя впереди или нечего было делать. */
  index: number | null;
}

/** Все недели арки с индексом дисциплины. Текущая — по прошедшим дням. */
export function arcWeeks(data: AppData, arc: Arc, today: DateKey): ArcWeek[] {
  const habits = arcHabitsAll(data, arc);
  const weeks: ArcWeek[] = [];
  for (let monday = weekStart(arc.startDate); daysBetween(monday, arc.endDate) >= 0;) {
    const sunday = addDays(monday, 6);
    const until = daysBetween(sunday, arc.endDate) < 0 ? arc.endDate : sunday;
    let status: ArcWeek['status'] = 'past';
    if (daysBetween(today, monday) > 0) status = 'future';
    else if (daysBetween(today, until) >= 0) status = 'current';

    const index =
      status === 'future'
        ? null
        : toIndex(weekScore(habits, data, monday, status === 'current' ? today : until, today));
    weeks.push({ monday, status, index });
    monday = addDays(monday, 7);
  }
  return weeks;
}

export interface ArcSummary {
  /** Средний индекс по неделям, где он есть. */
  averageIndex: number | null;
  /** Лучшая неделя; при равенстве — более ранняя. */
  bestWeek: ArcWeek | null;
  /** Дней с индексом 100 (сегодня — если уже 100). */
  perfectDays: number;
  /** Сколько раз за арку что-то отмечено (день × привычка). */
  marks: number;
}

export function arcSummary(data: AppData, arc: Arc, today: DateKey): ArcSummary {
  const weeks = arcWeeks(data, arc, today).filter((week) => week.index !== null);
  const habits = arcHabitsAll(data, arc);
  const days = eachDay(arc.startDate, lastArcDay(arc, today));

  const best = weeks.reduce<ArcWeek | null>(
    (top, week) => (top === null || week.index! > top.index! ? week : top),
    null,
  );
  const average = mean(weeks.map((week) => week.index!));

  return {
    averageIndex: average === null ? null : Math.round(average),
    bestWeek: best,
    perfectDays: days.filter((day) => dayScore(habits, data, day) === 1).length,
    marks: days.reduce(
      (count, day) =>
        count + habits.filter((habit) => getLog(data.habitLogs, habit.id, day) > 0).length,
      0,
    ),
  };
}

// ── Календарь арки ───────────────────────────────────────

export interface CalendarDay {
  date: DateKey;
  /** Число месяца. */
  day: number;
  inArc: boolean;
  status: 'past' | 'today' | 'future';
  /** Индекс дня 0…1; null — вне арки, впереди или ничего не запланировано. */
  score: number | null;
}

export interface CalendarMonth {
  /** "Октябрь 2026" */
  title: string;
  /** Недели с понедельника; null — день другого месяца. */
  weeks: (CalendarDay | null)[][];
}

/** Месяцы арки сеткой «неделя × день недели», каждый день — с индексом. */
export function arcCalendar(data: AppData, arc: Arc, today: DateKey): CalendarMonth[] {
  const habits = arcHabitsAll(data, arc);
  const months: CalendarMonth[] = [];
  const inArc = (date: DateKey) =>
    daysBetween(arc.startDate, date) >= 0 && daysBetween(date, arc.endDate) >= 0;

  let first = `${arc.startDate.slice(0, 7)}-01`;
  while (daysBetween(first, arc.endDate) >= 0) {
    const start = fromDateKey(first);
    const next = format(new Date(start.getFullYear(), start.getMonth() + 1, 1), 'yyyy-MM-dd');
    const month = first.slice(0, 7);
    const weeks: (CalendarDay | null)[][] = [];

    for (
      let monday = weekStart(first);
      daysBetween(monday, next) > 0;
      monday = addDays(monday, 7)
    ) {
      weeks.push(
        eachDay(monday, addDays(monday, 6)).map((date) => {
          if (!date.startsWith(month)) return null;
          const diff = daysBetween(today, date);
          const status = diff < 0 ? 'past' : diff === 0 ? 'today' : 'future';
          const counted = inArc(date) && status !== 'future';
          return {
            date,
            day: Number(date.slice(8)),
            inArc: inArc(date),
            status,
            score: counted ? dayScore(habits, data, date) : null,
          };
        }),
      );
    }

    const title = format(start, 'LLLL yyyy', { locale: ru });
    months.push({ title: title[0].toUpperCase() + title.slice(1), weeks });
    first = next;
  }
  return months;
}

// ── Привычки ─────────────────────────────────────────────

export interface HabitRate {
  done: number;
  total: number;
  /** Считаем дни (дневные привычки) или недели (гибкие). */
  unit: 'day' | 'week';
}

/**
 * Как часто цель привычки выполнялась за арку.
 * Дневные: дни по плану, когда цель выполнена. Сегодня считается, только если уже выполнено.
 * Гибкие: недели, когда недельная цель выполнена. Текущая и первая неполная
 * неделя считаются, только если цель уже выполнена.
 */
export function habitArcRate(habit: Habit, data: AppData, arc: Arc, today: DateKey): HabitRate {
  const start =
    daysBetween(habitStartDate(habit), arc.startDate) >= 0 ? arc.startDate : habitStartDate(habit);
  const end = lastArcDay(arc, today);

  if (isWeeklyHabit(habit)) {
    let done = 0;
    let total = 0;
    for (
      let monday = weekStart(start);
      daysBetween(monday, end) >= 0;
      monday = addDays(monday, 7)
    ) {
      const sunday = addDays(monday, 6);
      const met = isWeekDone(weekProgress(habit, data.habitLogs, monday, sunday));
      // Неделя целиком внутри арки и уже закончилась — считается в любом случае.
      const whole = daysBetween(start, monday) >= 0 && daysBetween(sunday, end) > 0;
      if (met) done += 1;
      if (met || whole) total += 1;
    }
    return { done, total, unit: 'week' };
  }

  let done = 0;
  let total = 0;
  for (const day of eachDay(start, end)) {
    if (!isHabitActiveOn(habit, day) || dayRequirement(habit, day) !== 'required') continue;
    const met = isDayDone(habit, data.habitLogs, day);
    if (met) done += 1;
    if (met || day !== today) total += 1;
  }
  return { done, total, unit: 'day' };
}

// ── Оценки ───────────────────────────────────────────────

export interface RatingWeek {
  monday: DateKey;
  /** Среднее за неделю; null — оценок не было. */
  average: number | null;
}

/** Средняя оценка по неделям арки до текущей включительно. */
export function ratingWeeks(data: AppData, scaleId: Id, arc: Arc, today: DateKey): RatingWeek[] {
  const end = lastArcDay(arc, today);
  return arcWeeks(data, arc, today)
    .filter((week) => week.status !== 'future')
    .map(({ monday }) => {
      const sunday = addDays(monday, 6);
      const from = daysBetween(monday, arc.startDate) > 0 ? arc.startDate : monday;
      const to = daysBetween(sunday, end) < 0 ? end : sunday;
      return { monday, average: averageRating(ratingSeries(data, scaleId, eachDay(from, to))) };
    });
}

/** Средняя оценка за арку до сегодня. */
export function arcRatingAverage(
  data: AppData,
  scaleId: Id,
  arc: Arc,
  today: DateKey,
): number | null {
  return averageRating(ratingSeries(data, scaleId, eachDay(arc.startDate, lastArcDay(arc, today))));
}

export const WEEKDAY_NAMES = [
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
  'воскресенье',
];

export interface WeekdayAverage {
  /** 1 = понедельник … 7 = воскресенье. */
  weekday: number;
  average: number;
  days: number;
}

/** Нужно хотя бы столько оценок в один день недели, чтобы его сравнивать. */
export const MIN_WEEKDAY_DAYS = 3;

/** Лучший и худший день недели по средней оценке. null — данных мало. */
export function weekdayExtremes(
  data: AppData,
  scaleId: Id,
  arc: Arc,
  today: DateKey,
): { best: WeekdayAverage; worst: WeekdayAverage } | null {
  const points = ratingSeries(data, scaleId, eachDay(arc.startDate, lastArcDay(arc, today)));
  const byWeekday: WeekdayAverage[] = [];
  for (let weekday = 1; weekday <= 7; weekday++) {
    const values = points
      .filter((point) => point.value !== null && weekdayOf(point.date) === weekday)
      .map((point) => point.value!);
    if (values.length >= MIN_WEEKDAY_DAYS) {
      byWeekday.push({ weekday, average: mean(values)!, days: values.length });
    }
  }
  if (byWeekday.length < 2) return null;
  const sorted = [...byWeekday].sort((a, b) => b.average - a.average);
  const best = sorted[0];
  const worst = sorted.at(-1)!;
  return best.average === worst.average ? null : { best, worst };
}

// ── Связи с оценками ─────────────────────────────────────

/** В каждой группе («было» и «не было») — хотя бы столько дней. */
export const MIN_GROUP_DAYS = 4;
/** Разница меньше полбалла — шум, не показываем. */
export const MIN_DIFFERENCE = 0.5;

export type LinkSubject =
  | { kind: 'habit'; habit: Habit }
  /** Слова, которые встречаются ровно в одни и те же дни, — одна связь. */
  | { kind: 'word'; words: string[] };

export interface RatingLink {
  subject: LinkSubject;
  scale: RatingScale;
  /** Средняя оценка в дни, когда «было», и когда «не было». */
  withAverage: number;
  withoutAverage: number;
  /** withAverage − withoutAverage. */
  difference: number;
  withDays: number;
  withoutDays: number;
}

/**
 * Сравнивает среднюю оценку в дни, когда что-то было (has), и когда не было.
 * null — мало дней в одной из групп или разница меньше полбалла.
 */
function compare(
  subject: LinkSubject,
  scale: RatingScale,
  days: DateKey[],
  has: (day: DateKey) => boolean,
  data: AppData,
): RatingLink | null {
  const withValues: number[] = [];
  const withoutValues: number[] = [];
  for (const day of days) {
    const rating = data.days[day]?.ratings[scale.id];
    if (rating === undefined) continue;
    (has(day) ? withValues : withoutValues).push(rating);
  }
  if (withValues.length < MIN_GROUP_DAYS || withoutValues.length < MIN_GROUP_DAYS) return null;
  const withAverage = mean(withValues)!;
  const withoutAverage = mean(withoutValues)!;
  const difference = withAverage - withoutAverage;
  if (Math.abs(difference) < MIN_DIFFERENCE) return null;
  return {
    subject,
    scale,
    withAverage,
    withoutAverage,
    difference,
    withDays: withValues.length,
    withoutDays: withoutValues.length,
  };
}

/** Сначала самые сильные связи. */
const byStrength = (a: RatingLink, b: RatingLink) =>
  Math.abs(b.difference) - Math.abs(a.difference);

/**
 * Привычки и оценки: «в дни, когда привычка выполнена, энергия выше на 1,2».
 * Сравниваем только закончившиеся дни, когда привычка стояла в плане
 * (у гибких — любой день недели).
 */
export function habitLinks(data: AppData, arc: Arc, today: DateKey): RatingLink[] {
  const days = finishedArcDays(arc, today);
  const habits = arcHabits(data, arc);
  const scales = data.ratingScales.filter((scale) => scale.archivedAt === null);

  return habits
    .flatMap((habit) => {
      const habitDays = days.filter(
        (day) => isHabitActiveOn(habit, day) && dayRequirement(habit, day) !== 'off',
      );
      // «Сделано» у гибкой привычки — в этот день что-то отмечено.
      const done = (day: DateKey) =>
        isWeeklyHabit(habit)
          ? getLog(data.habitLogs, habit.id, day) > 0
          : isDayDone(habit, data.habitLogs, day);
      return scales.map((scale) => compare({ kind: 'habit', habit }, scale, habitDays, done, data));
    })
    .filter((link): link is RatingLink => link !== null)
    .sort(byStrength);
}

/** Короткие слова, которые ничего не говорят о дне. */
const STOP_WORDS = new Set(
  (
    'и а но да не ни в во на с со к ко по о об от до из за для при про без над под ' +
    'я ты он она оно мы вы они мне меня мой моя моё мои себя себе ' +
    'это эта этот эти то та тот те что как так там тут где когда чем если уже ещё еще ' +
    'был была было были быть есть буду будет весь вся всё все очень чуть просто потом ' +
    'день дня днём днем сегодня вчера завтра утром вечером только тоже даже после перед почти ' +
    'the and was'
  ).split(' '),
);

/** Длина основы: «тренировка», «тренировки», «тренировку» → «трени». */
const STEM_LENGTH = 5;

/** Слова заметки без повторов: строчными, ё → е, без коротких и служебных. */
export function noteWords(note: string): Map<string, string> {
  const words = new Map<string, string>(); // основа → слово, как оно написано
  for (const raw of note.toLowerCase().split(/[^a-zа-яё-]+/)) {
    const word = raw.replace(/^-+|-+$/g, '');
    // Сравниваем без «ё»: «лёг» и «лег» — одно слово. Показываем как написано.
    const plain = word.replaceAll('ё', 'е');
    if (plain.length < 3 || STOP_WORDS.has(plain)) continue;
    const stem = plain.slice(0, STEM_LENGTH);
    if (!words.has(stem)) words.set(stem, word);
  }
  return words;
}
/**
 * Слова в заметках и оценки: «в дни, когда в заметке есть „устал“, настроение
 * ниже на 1,8». Сравниваем только закончившиеся дни, где есть заметка:
 * дни без заметки ничего не говорят о словах.
 * Слова с одинаковым началом (5 букв) считаются одним словом.
 */
export function wordLinks(data: AppData, arc: Arc, today: DateKey): RatingLink[] {
  const days = finishedArcDays(arc, today).filter((day) => data.days[day]?.note.trim());
  const scales = data.ratingScales.filter((scale) => scale.archivedAt === null);

  // Для каждой основы — дни, где она есть, и самое частое написание.
  const stems = new Map<string, { days: Set<DateKey>; forms: Map<string, number> }>();
  for (const day of days) {
    for (const [stem, word] of noteWords(data.days[day].note)) {
      const entry = stems.get(stem) ?? { days: new Set(), forms: new Map() };
      entry.days.add(day);
      entry.forms.set(word, (entry.forms.get(word) ?? 0) + 1);
      stems.set(stem, entry);
    }
  }

  // Слова из одних и тех же дней («прогулка с друзьями») объединяем: это одно наблюдение.
  const groups = new Map<string, { days: Set<DateKey>; words: string[] }>();
  for (const { days: withWord, forms } of stems.values()) {
    if (withWord.size < MIN_GROUP_DAYS) continue;
    const word = [...forms].sort((a, b) => b[1] - a[1])[0][0];
    const key = [...withWord].sort().join(' ');
    const group = groups.get(key) ?? { days: withWord, words: [] };
    group.words.push(word);
    groups.set(key, group);
  }

  const links: RatingLink[] = [];
  for (const { days: withWords, words } of groups.values()) {
    for (const scale of scales) {
      const has = (day: DateKey) => withWords.has(day);
      const link = compare({ kind: 'word', words }, scale, days, has, data);
      if (link) links.push(link);
    }
  }
  return links.sort(byStrength);
}
