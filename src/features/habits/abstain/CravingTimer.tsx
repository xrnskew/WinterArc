import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { breathingAt, CRAVING_SECONDS, formatClock } from '../../../domain/breathing';
import { Button } from '../../../design/ui/Button';
import { TextArea } from '../../../design/ui/inputs';

interface CravingTimerProps {
  habitName: string;
  onClose: () => void;
  /** Устоял: записываем пережитую тягу. */
  onResisted: (reason: string) => void;
  /** Сорвался: записываем срыв. */
  onRelapsed: (reason: string) => void;
}

/**
 * «Тяга сейчас»: 5 минут, квадрат дыхания 4-4-6 и таймер.
 * Время считается от момента открытия, поэтому таймер не сбивается,
 * если телефон ненадолго заблокировали.
 */
export function CravingTimer({ habitName, onClose, onResisted, onRelapsed }: CravingTimerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  // Нажали «Тяга прошла» раньше времени.
  const [passedEarly, setPassedEarly] = useState(false);
  const [reason, setReason] = useState('');

  const elapsed = (now - startedAt) / 1000;
  const remaining = CRAVING_SECONDS - elapsed;
  const breath = breathingAt(elapsed);
  // Два этапа: дышим, потом — что это было и чем закончилось.
  const stage = passedEarly || remaining <= 0 ? 'outcome' : 'breathing';

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  useEffect(() => {
    if (stage !== 'breathing') return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [stage]);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="craving-title" className="wa-fullscreen">
      <div className="mx-auto flex h-full max-w-xl flex-col px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 id="craving-title" className="screen-title text-3xl text-number">
              Тяга сейчас
            </h1>
            <p className="mt-1 text-sm text-muted">{habitName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть без записи"
            className="-mr-2 flex size-11 items-center justify-center rounded-md text-muted hover:text-text"
          >
            <X size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {stage === 'breathing' ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center gap-8">
              <div className="flex size-56 items-center justify-center">
                <div
                  className="wa-breathe size-full rounded-lg border-2 border-number bg-number/10 shadow-glow"
                  aria-hidden="true"
                />
              </div>
              <p className="text-center" aria-live="polite">
                <span className="block text-xl text-number">{breath.label}</span>
                <span className="numeric block text-base text-muted">{breath.secondsLeft}</span>
              </p>
            </div>

            <p
              className="numeric text-center text-5xl text-number"
              aria-label={`Осталось ${formatClock(remaining)}`}
            >
              {formatClock(remaining)}
            </p>
            <p className="mt-2 text-center text-sm text-muted">
              Тяга проходит за несколько минут. Дыши вместе с квадратом.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="mt-6"
              onClick={() => setPassedEarly(true)}
            >
              Тяга прошла
            </Button>
          </>
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-5">
            <p className="text-xl text-number">
              {remaining <= 0 ? 'Пять минут позади.' : 'Хорошо.'} Чем всё закончилось?
            </p>
            <TextArea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              aria-label="Что вызвало тягу"
              placeholder="Что вызвало тягу? Можно не писать."
            />
            <div className="flex flex-col gap-2">
              <Button variant="primary" size="lg" onClick={() => onResisted(reason)}>
                Устоял
              </Button>
              <Button variant="danger" size="lg" onClick={() => onRelapsed(reason)}>
                Сорвался
              </Button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
