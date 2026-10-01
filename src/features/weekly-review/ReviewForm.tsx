import { Check } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { EMPTY_ANSWERS, type ReviewAnswers } from '../../domain/weeklyReview';
import type { DateKey, WeeklyReview } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { GlassCard } from '../../design/ui/GlassCard';
import { Field, TextArea } from '../../design/ui/inputs';
import { useAppStore } from '../../store/useAppStore';

interface ReviewFormProps {
  monday: DateKey;
  review: WeeklyReview | undefined;
}

const QUESTIONS: { key: keyof ReviewAnswers; label: string; placeholder: string }[] = [
  {
    key: 'wins',
    label: 'Что получилось',
    placeholder: 'Например: ни одной пропущенной тренировки',
  },
  {
    key: 'misses',
    label: 'Что не получилось',
    placeholder: 'Например: три раза лёг после полуночи',
  },
  {
    key: 'nextFocus',
    label: 'Фокус на следующую неделю',
    placeholder: 'Одна вещь, на которой сосредоточиться',
  },
];

/** Три вопроса недели. Сохраняется кнопкой; пустые ответы обзор удаляют. */
export function ReviewForm({ monday, review }: ReviewFormProps) {
  const id = useId();
  const saveWeeklyReview = useAppStore((state) => state.saveWeeklyReview);
  const [answers, setAnswers] = useState<ReviewAnswers>(() =>
    review
      ? { wins: review.wins, misses: review.misses, nextFocus: review.nextFocus }
      : EMPTY_ANSWERS,
  );
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveWeeklyReview(monday, answers);
    setSaved(true);
  };

  return (
    <GlassCard as="section" aria-labelledby={`${id}-title`} className="p-5">
      <h2 id={`${id}-title`} className="text-base text-text">
        Три вопроса
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
        {QUESTIONS.map((question) => (
          <Field key={question.key} id={`${id}-${question.key}`} label={question.label}>
            <TextArea
              id={`${id}-${question.key}`}
              value={answers[question.key]}
              maxLength={600}
              placeholder={question.placeholder}
              className="min-h-24"
              onChange={(event) => {
                setAnswers({ ...answers, [question.key]: event.target.value });
                setSaved(false);
              }}
            />
          </Field>
        ))}
        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" size="lg">
            Сохранить
          </Button>
          <p aria-live="polite" className="flex items-center gap-1.5 text-sm text-text">
            {saved && (
              <>
                <Check size={16} strokeWidth={2} aria-hidden="true" />
                Сохранено
              </>
            )}
          </p>
        </div>
      </form>
    </GlassCard>
  );
}
