import type { AbstainHabit, DateKey } from '../../../domain/types';
import { useAppStore } from '../../../store/useAppStore';
import { CravingTimer } from './CravingTimer';
import { RelapseSheet } from './RelapseSheet';

/** Что открыто: тяга или срыв — и для какой привычки. */
export type AbstainDialog = { kind: 'craving' | 'relapse'; habit: AbstainHabit } | null;

interface AbstainDialogsProps {
  dialog: AbstainDialog;
  /** День по умолчанию для срыва. */
  date: DateKey;
  today: DateKey;
  onClose: () => void;
}

/**
 * «Тяга сейчас» и «Срыв» — общие для чек-ина и страницы привычки.
 * Записывают событие в стор и закрываются.
 */
export function AbstainDialogs({ dialog, date, today, onClose }: AbstainDialogsProps) {
  const addAbstainEvent = useAppStore((state) => state.addAbstainEvent);

  return (
    <>
      {dialog?.kind === 'craving' && (
        <CravingTimer
          habitName={dialog.habit.name}
          onClose={onClose}
          onResisted={(reason) => {
            addAbstainEvent(dialog.habit.id, today, 'craving', reason);
            onClose();
          }}
          onRelapsed={(reason) => {
            addAbstainEvent(dialog.habit.id, today, 'relapse', reason);
            onClose();
          }}
        />
      )}
      {dialog?.kind === 'relapse' && (
        <RelapseSheet
          open
          habit={dialog.habit}
          date={date}
          today={today}
          onClose={onClose}
          onSave={(relapseDate, reason) => {
            addAbstainEvent(dialog.habit.id, relapseDate, 'relapse', reason);
            onClose();
          }}
        />
      )}
    </>
  );
}
