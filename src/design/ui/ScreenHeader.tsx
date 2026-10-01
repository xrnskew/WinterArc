import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: string;
  /** Одна строка пояснения под заголовком. */
  description?: ReactNode;
}

/** Заголовок экрана: сжатый шрифт, заглавные — единственное место, где они есть. */
export function ScreenHeader({ title, description }: ScreenHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="screen-title on-snow text-3xl text-number">{title}</h1>
      {description && <p className="on-snow mt-1 text-sm text-muted">{description}</p>}
    </header>
  );
}
