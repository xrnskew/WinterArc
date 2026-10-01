import type { ReactNode } from 'react';
import { GlassCard } from './GlassCard';

interface EmptyStateProps {
  title: string;
  text: ReactNode;
  /** Кнопка-приглашение к действию. */
  action?: ReactNode;
}

/** Пустой экран — не тупик, а подсказка, что сделать дальше. */
export function EmptyState({ title, text, action }: EmptyStateProps) {
  return (
    <GlassCard className="p-5">
      <h2 className="text-base font-medium text-text">{title}</h2>
      <p className="mt-1 text-sm text-muted">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </GlassCard>
  );
}
