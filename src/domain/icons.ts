/**
 * Иконки для привычек и шкал. В данных хранится только название (ключ),
 * картинку подбирает интерфейс (design/ui/HabitIcon.tsx).
 * Ключи нельзя переименовывать: они уже лежат в сохранённых данных.
 */
export const ICON_NAMES = [
  // тело и спорт
  'dumbbell',
  'bike',
  'footprints',
  'activity',
  'heart-pulse',
  'mountain',
  // сон и режим
  'moon',
  'bed',
  'sun',
  'clock',
  'hourglass',
  // ум и работа
  'book-open',
  'graduation-cap',
  'brain',
  'pen-line',
  'notebook-pen',
  'code',
  'languages',
  'briefcase',
  'target',
  // творчество
  'music',
  'palette',
  // еда и вода
  'glass-water',
  'droplets',
  'apple',
  'salad',
  'utensils',
  'coffee',
  // отказы
  'cigarette',
  'wine',
  'beer',
  'candy',
  'smartphone',
  'gamepad',
  'tv',
  'ban',
  // прочее
  'shower-head',
  'snowflake',
  'leaf',
  'wind',
  'flame',
  'zap',
  'piggy-bank',
  'users',
  'house',
  'smile',
  'focus',
  'battery',
] as const;

export type IconName = (typeof ICON_NAMES)[number];
