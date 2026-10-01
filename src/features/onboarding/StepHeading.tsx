import { useEffect, useRef, type ReactNode } from 'react';

interface StepHeadingProps {
  title: string;
  children: ReactNode;
}

/**
 * Заголовок шага. При смене шага на него переводится фокус —
 * скринридер сразу прочитает, где ты оказался.
 */
export function StepHeading({ title, children }: StepHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <header>
      <h1
        ref={ref}
        tabIndex={-1}
        className="screen-title on-snow text-3xl text-number outline-none"
      >
        {title}
      </h1>
      <p className="on-snow mt-2 text-base text-muted">{children}</p>
    </header>
  );
}
