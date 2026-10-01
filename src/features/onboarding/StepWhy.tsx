import { GlassCard } from '../../design/ui/GlassCard';
import { TextArea } from '../../design/ui/inputs';
import { StepHeading } from './StepHeading';

interface StepWhyProps {
  why: string;
  onChange: (why: string) => void;
}

/** Шаг 2: зачем. Необязательно, но именно это держит в плохие дни. */
export function StepWhy({ why, onChange }: StepWhyProps) {
  return (
    <>
      <StepHeading title="Зачем">
        Напиши, ради чего ты начинаешь. Эти слова будут на главном экране в дни, когда захочется
        бросить.
      </StepHeading>

      <GlassCard className="mt-8 p-5">
        <TextArea
          value={why}
          onChange={(event) => onChange(event.target.value)}
          rows={6}
          aria-label="Зачем ты начинаешь арку"
          placeholder="Например: к январю пробежать 10 км без остановки и перестать откладывать важное."
        />
        <p className="mt-2 text-sm text-muted">Можно оставить пустым и вернуться к этому позже.</p>
      </GlassCard>
    </>
  );
}
