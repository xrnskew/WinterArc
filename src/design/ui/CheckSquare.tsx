import { Check } from 'lucide-react';
import { useState } from 'react';
import { cx } from '../../lib/cx';

interface CheckSquareProps {
  checked: boolean;
  onToggle: () => void;
  /** Для скринридера: «Отметить: Зарядка». */
  label: string;
}

/**
 * Квадрат «сделано». При отметке — короткая белая вспышка,
 * как отблеск фонаря в метели. Снятие отметки — без вспышки.
 */
export function CheckSquare({ checked, onToggle, label }: CheckSquareProps) {
  // Каждая отметка увеличивает счётчик: новый key пересоздаёт слой вспышки, и она играет заново.
  const [flashes, setFlashes] = useState(0);

  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={label}
      onClick={() => {
        if (!checked) setFlashes((n) => n + 1);
        onToggle();
      }}
      className={cx(
        'relative flex size-11 shrink-0 items-center justify-center rounded-md border',
        'transition-colors duration-(--wa-motion-fast)',
        checked
          ? 'border-number bg-number text-night'
          : 'border-gray-500 text-transparent hover:border-gray-300',
      )}
    >
      <Check size={22} strokeWidth={2.5} aria-hidden="true" />
      {flashes > 0 && (
        <span key={flashes} className="flash absolute inset-0 rounded-md" aria-hidden="true" />
      )}
    </button>
  );
}
