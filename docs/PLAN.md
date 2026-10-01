# WINTER ARC — план

Утверждённый план проекта: структура, модель данных, дизайн-система и принятые
решения. ТЗ — в [BRIEF.md](BRIEF.md). Этот файл обновляется после каждого этапа.

## Этапы

| Этап | Что входит | Статус |
| --- | --- | --- |
| а | Каркас, навигация, дизайн-система, шейдер-фон | готово |
| б | Модель данных, хранение и миграции, арка, онбординг | |
| в | Привычки всех 4 типов + чек-ин | |
| г | Командный центр с виджетами | |
| д | Цели и задачи | |
| е | Аналитика, графики, тепловые карты | |
| ж | Обзор недели + достижения | |
| з | PWA, настройки, экспорт/импорт, полировка | |

## 1. Структура папок

Главное правило: `domain/` — чистая логика на TypeScript без React, её можно
читать и тестировать отдельно. Экраны только показывают данные и вызывают действия.

```
src/
├─ main.tsx                 точка входа: тема → шрифты → роутер
├─ app/                     оболочка приложения
│  ├─ router.tsx            все маршруты в одном месте
│  ├─ routes.ts             адреса экранов и пункты навигации
│  ├─ AppShell.tsx          фон-метель + навигация + контент экрана
│  └─ Navigation.tsx        нижний бар (телефон) / боковая панель (десктоп)
├─ design/                  дизайн-система
│  ├─ tokens.ts             ★ из чего состоит тема (типы)
│  ├─ themes/winter.ts      ★ тема «Суровая зима» — все значения здесь
│  ├─ themes/index.ts       список тем
│  ├─ applyTheme.ts         токены → CSS-переменные --wa-*
│  ├─ color.ts              разбор цветов и контраст WCAG
│  ├─ themeContrast.test.ts тест: текст читается (AA) на любом фоне
│  ├─ fonts.ts              локальные шрифты (@fontsource)
│  ├─ global.css            Tailwind + связь токенов с классами + стекло, шум, вспышка
│  └─ ui/                   примитивы: GlassCard, Button, BigNumber, ProgressBar,
│                           Segmented, StepSlider, ScreenHeader, EmptyState,
│                           tally/ (зарубки); дальше — Ring, Sheet, Input, IceToken, Toast…
├─ background/              фон-метель
│  ├─ SnowBackground.tsx    выбирает: шейдер / CSS-снег / ничего
│  ├─ ShaderSnow.tsx        холст; вся логика — в snowScene.ts
│  ├─ snowScene.ts          WebGL, время, ветер, цикл отрисовки
│  ├─ snowShader.ts         GLSL-шейдеры (строками, с комментариями)
│  ├─ snowPresets.ts        параметры ступеней: лёгкий снег / метель / буран
│  ├─ webgl.ts              контекст, компиляция, полноэкранный треугольник
│  ├─ renderLoop.ts         лимит FPS, пауза во фоне, замер «тянет ли устройство»
│  ├─ wind.ts               ветерок + редкие порывы
│  ├─ deviceTier.ts         слабое ли устройство
│  └─ CssSnow.tsx           запасной вариант: редкие CSS-снежинки
├─ domain/                  ★ бизнес-логика, без React
│  ├─ types.ts              модель данных (ниже)
│  ├─ dates.ts, arc.ts, schedule.ts, habits.ts, discipline.ts, goals.ts,
│  │  analytics.ts, achievements.ts, weeklyReview.ts, templates.ts
│  └─ *.test.ts             тесты Vitest рядом с логикой
├─ storage/                 schema.ts, migrations.ts, localStore.ts, backup.ts
├─ store/useAppStore.ts     Zustand: состояние и действия
├─ features/                экраны, у каждой фичи своя папка
│  ├─ command-center/ checkin/ habits/ goals/ analytics/
│  ├─ weekly-review/ achievements/ settings/ more/ onboarding/
│  └─ kit/                  витрина дизайн-системы (только npm run dev)
├─ hooks/                   useCountUp, useReducedMotion, useElementWidth, useToday
└─ lib/                     plural, cx, random и другие мелочи
```

Зависимости: react-router, zustand, date-fns (ru), recharts, lucide-react,
@fontsource (шрифты офлайн), vite-plugin-pwa, vitest. Шейдер — чистый WebGL
без three.js.

## 2. Модель данных

Принцип: храним только факты, всё остальное вычисляем. Серии, индекс, прогнозы
и итоги считаются в `domain/`, поэтому рассинхрона не будет.

```ts
// ── Базовые типы ─────────────────────────────────────────
type Id = string;        // crypto.randomUUID()
type DateKey = string;   // "2026-10-01" — локальная дата без времени
type Timestamp = string; // "2026-10-01T21:15:00.000Z" — момент времени
type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = понедельник

// ── Корень: ровно это лежит в localStorage ───────────────
interface AppData {
  version: number;                 // версия схемы → миграции
  settings: Settings;
  activeArcId: Id | null;          // null → показываем онбординг
  arcs: Arc[];
  habits: Habit[];
  habitLogs: HabitLogs;
  abstainEvents: AbstainEvent[];
  ratingScales: RatingScale[];
  days: Record<DateKey, DayEntry>; // оценки и заметка дня
  goals: Goal[];
  tasks: Task[];
  weeklyReviews: Record<DateKey, WeeklyReview>; // ключ = понедельник недели
  achievements: UnlockedAchievement[];
  dashboard: WidgetInstance[];     // порядок массива = порядок на экране
}

// ── Арка ─────────────────────────────────────────────────
interface Arc {
  id: Id;
  name: string;         // "Winter Arc 2026"
  why: string;          // зачем я это делаю
  startDate: DateKey;   // по умолчанию 1 окт
  endDate: DateKey;     // по умолчанию 31 дек
  habitIds: Id[];       // привычки этой арки, в порядке показа
  createdAt: Timestamp;
  archivedAt: Timestamp | null;
}

// ── Привычки ─────────────────────────────────────────────
type Schedule =
  | { type: 'daily' }
  | { type: 'weekdays'; days: Weekday[] }
  | { type: 'timesPerWeek'; times: number };

type AccentKey = 'snow' | 'frost' | 'silver' | 'steel' | 'ash' | 'smoke';

interface HabitBase {
  id: Id;
  name: string;
  icon: IconName;      // ключ из набора ~40 иконок
  accent: AccentKey;   // ключ, а не цвет: тема решает, как он выглядит
  schedule: Schedule;
  createdAt: Timestamp;
  archivedAt: Timestamp | null;
}
interface CheckHabit extends HabitBase { kind: 'check' }
interface CountHabit extends HabitBase { kind: 'count'; unit: string; dailyTarget: number }
interface TimeHabit extends HabitBase { kind: 'time'; targetMinutes: number; targetPeriod: 'day' | 'week' }
interface AbstainHabit extends HabitBase { kind: 'abstain'; startDate: DateKey; costPerDay: number | null }
type Habit = CheckHabit | CountHabit | TimeHabit | AbstainHabit;

// habitLogs[habitId][date] = значение за день. Нет записи — значит 0.
// check → 1, count → штуки, time → минуты. Для abstain не используется.
type HabitLogs = Record<Id, Record<DateKey, number>>;

interface AbstainEvent {
  id: Id;
  habitId: Id;
  date: DateKey;                 // можно отметить задним числом
  type: 'relapse' | 'craving';   // срыв / пережитая тяга (после «ТЯГА СЕЙЧАС»)
  reason: string;
  createdAt: Timestamp;
}

// ── Оценки дня ───────────────────────────────────────────
interface RatingScale { id: Id; name: string; icon: IconName; archivedAt: Timestamp | null }
interface DayEntry {
  ratings: Record<Id, number>;   // ratings[scaleId] = 1..10
  note: string;
}

// ── Цели и задачи ────────────────────────────────────────
interface GoalBase {
  id: Id;
  title: string;
  deadline: DateKey | null;
  arcId: Id | null;              // цель может жить и вне арки
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  archivedAt: Timestamp | null;
}
interface StepsGoal extends GoalBase {
  kind: 'steps';
  steps: { id: Id; title: string; doneAt: Timestamp | null }[];
}
interface NumericGoal extends GoalBase {
  kind: 'numeric';
  unit: string;                  // "₽", "кг", "км"
  startValue: number;
  targetValue: number;           // может быть меньше старта (вес вниз)
  entryMode: 'add' | 'set';      // add — пополнения (₽, км), set — замеры (вес)
  entries: { id: Id; date: DateKey; value: number; note: string }[];
}
type Goal = StepsGoal | NumericGoal;

interface Task {
  id: Id;
  title: string;
  goalId: Id | null;
  priority: 'low' | 'medium' | 'high';
  deadline: DateKey | null;
  doneAt: Timestamp | null;
  createdAt: Timestamp;
}

// ── Обзор недели, достижения, виджеты, настройки ─────────
interface WeeklyReview { wins: string; misses: string; nextFocus: string; updatedAt: Timestamp }
interface UnlockedAchievement { id: string; unlockedAt: Timestamp } // id: "streak-30:<habitId>"

type WidgetType =
  | 'countdown' | 'arcProgress' | 'discipline' | 'today' | 'streak'
  | 'moneySaved' | 'goal' | 'ratingTrend' | 'heatmap' | 'tasks' | 'why' | 'week';

interface WidgetInstance {
  id: Id;
  type: WidgetType;
  size: 'half' | 'full';
  habitId?: Id; goalId?: Id; scaleId?: Id; // настройка конкретного виджета
}

interface Settings {
  themeId: 'winter';
  snow: 'off' | 'light' | 'snow' | 'blizzard'; // выкл / лёгкий снег / метель / буран
  performance: 'auto' | 'full' | 'lite';        // auto = определить по устройству
  currency: string;                             // "₽"
}
```

**Миграции.** В `migrations.ts` лежит объект `{ 2: (v1) => v2, 3: (v2) => v3 }`,
и `migrate()` проходит по шагам до `CURRENT_VERSION`. Перед миграцией сырые данные
копируются в отдельный ключ `winterarc:backup:v{N}`. Если данные новее приложения,
мы их не трогаем и показываем предупреждение. Импорт JSON проходит через тот же
`migrate()`, поэтому старый бэкап откроется в любой новой версии.

## 3. Дизайн-система

Все значения — в `src/design/themes/winter.ts`. `applyTheme()` пишет их
в CSS-переменные `--wa-*`, `global.css` связывает переменные с классами Tailwind
(`bg-night`, `text-muted`, `border-gray-700`…). Стандартные палитры Tailwind
отключены: в разметке доступны только цвета темы. Шейдер и графики берут те же
значения из TS. Новая тема — новый файл в `themes/`.

### Цвета

| Токен | Значение | Где |
| --- | --- | --- |
| night | #0a0a0a | фон, ночь |
| graphite | #1a1a1a | основа панелей |
| gray-800…300 | #2a2a2a #3a3a3a #4d4d4d #666 #808080 #9a9a9a | рамки, черты, графики |
| text | #e8e8e8 | основной текст |
| text-muted | #9a9a9a | подписи — самый тёмный допустимый для текста |
| number | #ffffff | цифры-табло |
| danger | #bc5050 | срывы и просрочка: черты, рамки, иконки |
| danger-text | #d07a7a | срывы и просрочка: текст |
| danger-soft | danger 15% | подложка |
| glass | rgba(16,16,16,.66) + blur(16px) + граница rgba(255,255,255,.08) | карточки |
| glass-lite | rgba(22,22,22,.94) без blur | карточки на слабых устройствах |

**Контраст (WCAG AA).** Текст пишем только цветами `text`, `text-muted`, `number`,
`danger-text`: они дают ≥ 4,5:1 даже в худшем случае, когда за стеклом проплывает
размытая снежинка. `#808080` и темнее — только рамки и графика (≥ 3:1 для черт
и иконок). Правило проверяет `themeContrast.test.ts`: тема, нарушающая его,
не пройдёт тесты. Исходный красный `#9e3b3b` давал 2,96:1 и не годился даже для
черт — поэтому красный разделён на `danger` и `danger-text`.

Акценты привычек (вместо цветов — 6 оттенков): снег #fff, иней #dcdcdc,
серебро #bdbdbd, сталь #9e9e9e, пепел #8a8a8a, дым #757575. В данных хранится
ключ, будущая цветная тема сможет дать им настоящие цвета. На графиках привычки
различаются оттенком и пунктиром.

### Шрифты

- **Oswald 500** — заголовки экранов, заглавными, разрядка 0.04em
  (Bebas Neue не поддерживает кириллицу)
- **Golos Text 400/500** — основной текст (сделан для русских интерфейсов)
- **JetBrains Mono** — только цифры, `tabular-nums`, чтобы не прыгали при пересчёте

Шкала размеров: 12 · 14 · 16 · 18 · 21 · 24 · 36 · 48 · 72 · 96 px.
Радиусы: 2 / 4 / 8 px. Анимации: 120 / 220 / 600 мс, пересчёт цифр 900 мс
(ease-out-expo).

### Принятые правила (по методичке плагина frontend-design)

1. Заглавные — только в крупных заголовках экранов. Подписи — обычным регистром,
   без разрядки.
2. Моноширинный шрифт — только для цифр, не для подписей.
3. Основной текст — Golos Text вместо Inter.
4. Не всё — карточки: отсчёт в командном центре стоит прямо на метели, стекло —
   только для групп (виджеты, чек-ин).
5. Фирменный элемент — «зарубки»: вся арка лентой, один день = одна черта.
6. Анимации: метель — фон; пересчёт цифр — только когда число изменилось
   от действия (и один раз при первом открытии за день); карточки не «выплывают»;
   вспышка при отметке — ответ на действие.
7. Тексты: кнопка говорит, что сделает («Сохранить»), уведомление повторяет то же
   слово («Сохранено»); пустой экран подсказывает следующий шаг; ошибки без
   извинений; без «→» на кнопках и строк вида «A · B · C».

### Зарубки (design/ui/tally)

- Прошедший день светлеет от `gray-600` до белого по индексу дисциплины, срыв —
  `danger`, сегодня — выше остальных и со свечением, будущие — короткие риски
  `gray-700`.
- Дни сгруппированы по календарным неделям, между неделями — зазор.
- Если на одну строку место под день меньше 4px, лента переносится на 2–4 строки
  по целым неделям, и дни недели стоят столбцами (понедельники друг под другом).
- Телефон 360–390px: арка 92 дня → 2 строки по 7 недель, черта 3px, зазор 3px.
  В одну строку черта была бы 1,5px — проверено скриншотами, слишком мелко.
- Подпись «День N из M»: в одну строку — прямо под сегодняшней чертой,
  в несколько строк — слева под лентой.

### Метель

- 3 / 5 / 7 слоёв (лёгкий снег / метель / буран). Ближние хлопья крупные, чёткие,
  быстрые, их сильнее сносит; дальние — мелкие, размытые, медленные, тусклые.
- Ветер (`wind.ts`): ровный ветерок + порывы раз в 5–14 с (нарастание, пик,
  затихание). Шейдеру передаётся накопленный снос, поэтому смена скорости
  не даёт рывков. В порыв ближние хлопья смазываются вдоль полёта.
- Позёмка: вытянутый шум в нижних 15% экрана, непрозрачность 2,5–6,5%.
- Производительность: рендер в 0,6–0,75 от размера экрана, лимит 30 FPS,
  анимация по времени, пауза при скрытой вкладке.
- «Уменьшить движение» в системе → один застывший кадр (и у CSS-снега тоже).
- Слабое устройство (нет WebGL, ≤ 2 ядер, ≤ 2 ГБ памяти, экономия трафика) или
  меньше 20 FPS в первые 3 с (в режиме «Авто») → CSS-снежинки, стекло без размытия.
  Порог — 50 мс на кадр, а не 40: на экранах 75 Гц честные 30 FPS дают ровно 40 мс.

### Навигация

Телефон — нижний бар: Центр · Привычки · Чек-ин (крупная приподнятая кнопка) ·
Цели · Ещё. Во «Ещё» — аналитика, обзор недели, достижения, настройки.
Десктоп (от 768px) — узкая боковая панель со всеми экранами.

### Привычки-отказы, арки, индекс дисциплины

- Каждый день отказа считается чистым автоматически, пока не отмечен срыв.
  Пережитая тяга тоже сохраняется событием — материал для достижений.
- Привычки живут между арками: при создании новой арки выбираешь, какие взять
  с собой. История привязана к датам.
- Индекс дисциплины 0–100: каждая привычка даёт за день оценку 0…1 (да/нет → 0
  или 1; количество и время → min(факт / цель, 1); отказ → 1, если день чистый).
  Индекс дня — среднее по привычкам, запланированным на этот день. Гибкие привычки
  («N раз в неделю», недельная цель по времени) идут только в индекс недели
  как min(сделано / цель, 1).
