import { Minus, Plus } from 'lucide-react';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  /** На сколько меняют кнопки − и +. */
  step: number;
  /** Что считаем — для скринридера: «Чтение, страниц». */
  label: string;
}

const BUTTON =
  'flex size-10 items-center justify-center text-muted transition-colors duration-(--wa-motion-fast) hover:text-number disabled:opacity-40';

/** − [число] +. Число можно ввести и руками. Меньше нуля не бывает. */
export function Stepper({ value, onChange, step, label }: StepperProps) {
  return (
    <div className="inline-flex shrink-0 items-center rounded-md border border-gray-700">
      <button
        type="button"
        className={BUTTON}
        onClick={() => onChange(Math.max(value - step, 0))}
        disabled={value <= 0}
        aria-label={`Уменьшить на ${step}`}
      >
        <Minus size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={(event) => onChange(Math.max(Number(event.target.value) || 0, 0))}
        aria-label={label}
        className="numeric h-10 w-12 bg-transparent text-center text-base text-number placeholder:text-muted focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={BUTTON}
        onClick={() => onChange(value + step)}
        aria-label={`Увеличить на ${step}`}
      >
        <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}
