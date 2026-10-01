import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: string;
  /** Одна строка пояснения под заголовком. */
  description?: ReactNode;
  /** Кнопка справа от заголовка. */
  action?: ReactNode;
}

/** Заголовок экрана: сжатый шрифт, заглавные — единственное место, где они есть. */
export function ScreenHeader({ title, description, action }: ScreenHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="screen-title on-snow text-3xl text-number">{title}</h1>
        {description && <p className="on-snow mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </header>
  );
}
