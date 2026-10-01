import { useId, useState, type FormEvent } from 'react';
import {
  HABIT_KIND_LABELS,
  validateHabitDraft,
  type HabitDraft,
} from '../../domain/habits';
import type { HabitKind, Schedule, Weekday } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { describedBy } from '../../design/ui/describedBy';
import { Field, NumberInput, TextInput } from '../../design/ui/inputs';
import { AccentPicker, IconPicker, WeekdayPicker } from '../../design/ui/pickers';
import { Segmented } from '../../design/ui/Segmented';
import { cx } from '../../lib/cx';
import { hasErrors } from '../../lib/hasErrors';

interface HabitFormProps {
  initial: HabitDraft;
  /** Текст главной кнопки: «Добавить привычку», «Сохранить». */
  submitLabel: string;
  currency: string;
  onSubmit: (draft: HabitDraft) => void;
  onCancel: () => void;
}

const KIND_HINTS: Record<HabitKind, string> = {
  check: 'сделал или нет',
  count: 'страницы, стаканы, подходы',
  time: 'минуты учёбы, спорта',
  abstain: 'серия чистых дней',
};

const KINDS = Object.keys(HABIT_KIND_LABELS) as HabitKind[];

type ScheduleType = Schedule['type'];

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'weekdays', label: 'По дням' },
  { value: 'timesPerWeek', label: 'Гибко' },
];

function buildSchedule(type: ScheduleType, weekdays: Weekday[], times: number): Schedule {
  if (type === 'weekdays') return { type, days: weekdays };
  if (type === 'timesPerWeek') return { type, times };
  return { type: 'daily' };
}

/** Пустое поле числа храним как NaN — проверка формы его поймает. */
const toNumber = (value: number | null) => value ?? NaN;
const fromNumber = (value: number) => (Number.isNaN(value) ? null : value);

/** Форма привычки всех четырёх типов. Ничего не сохраняет сама — отдаёт черновик наверх. */
export function HabitForm({ initial, submitLabel, currency, onSubmit, onCancel }: HabitFormProps) {
  const id = useId();
  const [draft, setDraft] = useState(initial);
  // Дни и «сколько раз» помним отдельно: при переключении расписания они не теряются.
  const [weekdays, setWeekdays] = useState<Weekday[]>(
    initial.schedule.type === 'weekdays' ? initial.schedule.days : [1, 2, 3, 4, 5],
  );
  const [times, setTimes] = useState(
    initial.schedule.type === 'timesPerWeek' ? initial.schedule.times : 3,
  );
  const [submitted, setSubmitted] = useState(false);

  const update = (patch: Partial<HabitDraft>) => setDraft((current) => ({ ...current, ...patch }));

  const schedule = buildSchedule(draft.schedule.type, weekdays, times);
  const result = { ...draft, schedule };
  const errors = submitted ? validateHabitDraft(result) : {};

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!hasErrors(validateHabitDraft(result))) onSubmit(result);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field id={`${id}-name`} label="Название" error={errors.name}>
        <TextInput
          id={`${id}-name`}
          value={draft.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder="Например: растяжка"
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy(`${id}-name`)}
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm text-text">Тип</legend>
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((kind) => (
            <label key={kind}>
              <input
                type="radio"
                name={`${id}-kind`}
                checked={draft.kind === kind}
                onChange={() => update({ kind })}
                className="peer sr-only"
              />
              <span
                className={cx(
                  'block h-full cursor-pointer rounded-md border px-3 py-2.5',
                  'transition-colors duration-(--wa-motion-fast)',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-number',
                  draft.kind === kind ? 'border-number bg-gray-800' : 'border-gray-700 hover:border-gray-500',
                )}
              >
                <span className="block text-sm text-text">{HABIT_KIND_LABELS[kind]}</span>
                <span className="block text-xs text-muted">{KIND_HINTS[kind]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {draft.kind === 'count' && (
        <div className="grid grid-cols-2 gap-3">
          <Field id={`${id}-target`} label="Цель на день" error={errors.target}>
            <NumberInput
              id={`${id}-target`}
              min={1}
              value={fromNumber(draft.dailyTarget)}
              onChange={(value) => update({ dailyTarget: toNumber(value) })}
              aria-invalid={Boolean(errors.target)}
              aria-describedby={describedBy(`${id}-target`)}
            />
          </Field>
          <Field id={`${id}-unit`} label="Что считаем">
            <TextInput
              id={`${id}-unit`}
              value={draft.unit}
              onChange={(event) => update({ unit: event.target.value })}
              placeholder="страниц"
              autoComplete="off"
            />
          </Field>
        </div>
      )}

      {draft.kind === 'time' && (
        <div className="flex flex-col gap-3">
          <Field id={`${id}-minutes`} label="Минут" error={errors.target}>
            <NumberInput
              id={`${id}-minutes`}
              min={1}
              step={5}
              value={fromNumber(draft.targetMinutes)}
              onChange={(value) => update({ targetMinutes: toNumber(value) })}
              aria-invalid={Boolean(errors.target)}
              aria-describedby={describedBy(`${id}-minutes`)}
            />
          </Field>
          <Segmented
            label="Цель по времени"
            value={draft.targetPeriod}
            onChange={(targetPeriod) => update({ targetPeriod })}
            options={[
              { value: 'day', label: 'В день' },
              { value: 'week', label: 'В неделю' },
            ]}
          />
        </div>
      )}

      {draft.kind === 'abstain' && (
        <Field
          id={`${id}-cost`}
          label={`Сколько тратил в день, ${currency}`}
          hint="Посчитаем, сколько сэкономишь. Можно оставить пустым."
          error={errors.cost}
        >
          <NumberInput
            id={`${id}-cost`}
            min={0}
            value={draft.costPerDay}
            onChange={(costPerDay) => update({ costPerDay })}
            aria-invalid={Boolean(errors.cost)}
            aria-describedby={describedBy(`${id}-cost`)}
          />
        </Field>
      )}

      {draft.kind === 'abstain' ? (
        <p className="text-sm text-muted">
          Отказ действует каждый день. День считается чистым, пока ты не отметишь срыв.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <span className="text-sm text-text">Расписание</span>
          <Segmented
            label="Расписание"
            value={draft.schedule.type}
            onChange={(type) => update({ schedule: buildSchedule(type, weekdays, times) })}
            options={SCHEDULE_OPTIONS}
          />
          {draft.schedule.type === 'weekdays' && (
            <WeekdayPicker value={weekdays} onChange={setWeekdays} invalid={Boolean(errors.schedule)} />
          )}
          {draft.schedule.type === 'timesPerWeek' && (
            <TimesPicker value={times} onChange={setTimes} />
          )}
          {errors.schedule && <p className="text-sm text-danger-text">{errors.schedule}</p>}
        </div>
      )}

      <IconPicker value={draft.icon} onChange={(icon) => update({ icon })} />
      <AccentPicker value={draft.accent} onChange={(accent) => update({ accent })} />

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" variant="primary" size="lg">
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

/** Сколько раз в неделю: от 1 до 7. */
function TimesPicker({ value, onChange }: { value: number; onChange: (times: number) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">Сколько раз в неделю</legend>
      <div className="grid grid-cols-7 gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((times) => (
          <label key={times}>
            <input
              type="radio"
              name={name}
              checked={times === value}
              onChange={() => onChange(times)}
              className="peer sr-only"
            />
            <span
              className={cx(
                'numeric flex h-10 cursor-pointer items-center justify-center rounded-md border text-sm',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-number',
                times === value
                  ? 'border-number bg-number text-night'
                  : 'border-gray-700 text-muted hover:text-text',
              )}
            >
              {times}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-sm text-muted">раз в неделю, в любые дни</p>
    </fieldset>
  );
}
