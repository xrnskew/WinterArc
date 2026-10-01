import { useId, useState } from 'react';
import { daysBetween } from '../../../domain/dates';
import type { AbstainHabit, DateKey } from '../../../domain/types';
import { Button } from '../../../design/ui/Button';
import { DateInput, Field, TextArea } from '../../../design/ui/inputs';
import { Sheet } from '../../../design/ui/Sheet';

interface RelapseSheetProps {
  open: boolean;
  habit: AbstainHabit;
  /** День по умолчанию — тот, что открыт в чек-ине. */
  date: DateKey;
  today: DateKey;
  onClose: () => void;
  onSave: (date: DateKey, reason: string) => void;
}

/** Записать срыв: день и причина. Срыв обнуляет серию, но не общий счёт. */
export function RelapseSheet({ open, habit, date, today, onClose, onSave }: RelapseSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Срыв">
      <RelapseForm habit={habit} date={date} today={today} onCancel={onClose} onSave={onSave} />
    </Sheet>
  );
}

function RelapseForm({
  habit,
  date: initialDate,
  today,
  onCancel,
  onSave,
}: Omit<RelapseSheetProps, 'open' | 'onClose'> & { onCancel: () => void }) {
  const id = useId();
  const [date, setDate] = useState(initialDate);
  const [reason, setReason] = useState('');
  const dateValid = daysBetween(habit.startDate, date) >= 0 && daysBetween(date, today) >= 0;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (dateValid) onSave(date, reason);
      }}
      className="flex flex-col gap-5"
    >
      <p className="text-base text-text">
        Это не конец. Общий счёт чистых дней останется, серия начнётся заново.
      </p>
      <Field
        id={`${id}-date`}
        label="Когда"
        error={dateValid ? undefined : 'Выбери день от начала отсчёта до сегодня.'}
      >
        <DateInput
          id={`${id}-date`}
          value={date}
          min={habit.startDate}
          max={today}
          onChange={(event) => setDate(event.target.value)}
          aria-invalid={!dateValid}
        />
      </Field>
      <Field
        id={`${id}-reason`}
        label="Что случилось"
        hint="Причины потом помогут увидеть, что тебя срывает."
      >
        <TextArea
          id={`${id}-reason`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          placeholder="Например: стресс на работе, компания"
        />
      </Field>
      <div className="flex flex-col gap-2">
        <Button type="submit" variant="danger" size="lg" disabled={!dateValid}>
          Записать срыв
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
