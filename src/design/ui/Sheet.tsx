import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Шторка: на телефоне выезжает снизу, на десктопе — окно по центру.
 * Внутри — стандартный <dialog>: браузер сам держит фокус внутри,
 * закрывает по Esc и делает остальную страницу недоступной.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // Клик по затемнению вокруг шторки закрывает её.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="wa-sheet"
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-gray-800 px-5 py-4">
          <h2 id={titleId} className="text-lg text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-2 flex size-10 items-center justify-center rounded-md text-muted hover:text-text"
          >
            <X size={22} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {open && children}
        </div>
      </div>
    </dialog>
  );
}
