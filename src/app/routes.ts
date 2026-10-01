import {
  Award,
  CalendarRange,
  ChartLine,
  Check,
  Ellipsis,
  Gauge,
  Repeat,
  SlidersHorizontal,
  Target,
  type LucideIcon,
} from 'lucide-react';

/** Адреса всех экранов — в одном месте, чтобы не путаться в строках. */
export const PATHS = {
  center: '/',
  checkin: '/checkin',
  habits: '/habits',
  goals: '/goals',
  more: '/more',
  analytics: '/analytics',
  review: '/review',
  achievements: '/achievements',
  settings: '/settings',
  kit: '/kit',
} as const;

/** Адрес страницы привычки. */
export const habitPath = (habitId: string) => `/habits/${habitId}`;

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Пояснение — для списка на экране «Ещё». */
  hint?: string;
}

const center: NavItem = { to: PATHS.center, label: 'Центр', icon: Gauge };
const checkin: NavItem = { to: PATHS.checkin, label: 'Чек-ин', icon: Check };
const habits: NavItem = { to: PATHS.habits, label: 'Привычки', icon: Repeat };
const goals: NavItem = { to: PATHS.goals, label: 'Цели', icon: Target };
const more: NavItem = { to: PATHS.more, label: 'Ещё', icon: Ellipsis };

/** Экраны, которые на телефоне спрятаны во «Ещё». */
export const MORE_ITEMS: NavItem[] = [
  {
    to: PATHS.analytics,
    label: 'Аналитика',
    icon: ChartLine,
    hint: 'Графики, календарь арки, корреляции',
  },
  { to: PATHS.review, label: 'Обзор недели', icon: CalendarRange, hint: 'Итоги и фокус на неделю' },
  { to: PATHS.achievements, label: 'Достижения', icon: Award, hint: 'Ледяные жетоны за серии' },
  {
    to: PATHS.settings,
    label: 'Настройки',
    icon: SlidersHorizontal,
    hint: 'Метель, арка, экспорт данных',
  },
];

/** Нижний бар на телефоне: чек-ин в центре. */
export const MOBILE_BAR = { left: [center, habits], checkin, right: [goals, more] };

/** Боковая панель на десктопе: всё сразу, без «Ещё». */
export const DESKTOP_RAIL: NavItem[] = [center, checkin, habits, goals, ...MORE_ITEMS];
