import { GlassCard } from '../design/ui/GlassCard';

interface StagePlaceholderProps {
  /** Что будет на экране — одной-двумя фразами. */
  children: string;
  /** Буква этапа из docs/PLAN.md. */
  stage: string;
}

/** Временная заглушка экрана, который ещё не собран. Исчезнет к этапу «з». */
export function StagePlaceholder({ children, stage }: StagePlaceholderProps) {
  return (
    <GlassCard className="p-5">
      <p className="text-base text-text">{children}</p>
      <p className="mt-2 text-sm text-muted">Экран собирается на этапе «{stage}».</p>
    </GlassCard>
  );
}
