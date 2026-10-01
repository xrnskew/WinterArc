import { ArrowDown, ArrowUp } from 'lucide-react';
import { habitLinks, MIN_GROUP_DAYS, wordLinks, type RatingLink } from '../../domain/analytics';
import type { AppData, Arc, DateKey } from '../../domain/types';
import { GlassCard } from '../../design/ui/GlassCard';
import { formatNumber } from '../../lib/formatNumber';
import { plural } from '../../lib/plural';

interface LinksTabProps {
  data: AppData;
  arc: Arc;
  today: DateKey;
}

/** Сколько связей показывать в каждом списке. */
const SHOWN = 8;

/** "«прогулка», «друзьями» и «отличное»" — не больше трёх слов. */
function quoteWords(words: string[]): string {
  const quoted = words.slice(0, 3).map((word) => `«${word}»`);
  return quoted.length === 1 ? quoted[0] : `${quoted.slice(0, -1).join(', ')} и ${quoted.at(-1)}`;
}

/** "В дни с выполненной привычкой «Тренировка» энергия выше на 1,3". */
function linkSentence(link: RatingLink): string {
  const when =
    link.subject.kind === 'habit'
      ? `В дни с выполненной привычкой «${link.subject.habit.name}»`
      : `В дни, когда в заметке есть ${quoteWords(link.subject.words)},`;
  const direction = link.difference > 0 ? 'выше' : 'ниже';
  return `${when} ${link.scale.name.toLowerCase()} ${direction} на ${formatNumber(Math.abs(link.difference), 1)}`;
}

/**
 * Связи: как привычки и слова в заметках связаны с оценками дня.
 * Это сравнение средних, а не причина — так и пишем.
 */
export function LinksTab({ data, arc, today }: LinksTabProps) {
  const habits = habitLinks(data, arc, today).slice(0, SHOWN);
  const words = wordLinks(data, arc, today).slice(0, SHOWN);

  return (
    // Десктоп — привычки и слова рядом.
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <p className="on-snow max-w-prose text-sm text-muted lg:col-span-2">
        Сравниваем среднюю оценку в дни, когда что-то было, и в дни, когда не было. Это связь, а не
        причина. Показываем разницу от 0,5 балла, если в каждой группе хотя бы {MIN_GROUP_DAYS}{' '}
        {plural(MIN_GROUP_DAYS, 'день', 'дня', 'дней')}.
      </p>

      <GlassCard as="section" aria-labelledby="links-habits" className="p-4">
        <h2 id="links-habits" className="text-base text-text">
          Привычки и оценки
        </h2>
        {habits.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Связей пока не видно. Нужно больше дней с оценками — и с привычкой, и без неё.
          </p>
        ) : (
          <LinkList links={habits} />
        )}
      </GlassCard>

      <GlassCard as="section" aria-labelledby="links-words" className="p-4">
        <h2 id="links-words" className="text-base text-text">
          Слова в заметках
        </h2>
        {words.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Пиши пару слов о дне в чек-ине — здесь появятся слова, которые связаны с оценками.
          </p>
        ) : (
          <LinkList links={words} />
        )}
      </GlassCard>
    </div>
  );
}

function LinkList({ links }: { links: RatingLink[] }) {
  return (
    <ul className="mt-2 divide-y divide-gray-800">
      {links.map((link) => {
        const Icon = link.difference > 0 ? ArrowUp : ArrowDown;
        const key = `${link.subject.kind === 'habit' ? link.subject.habit.id : link.subject.words.join()}-${link.scale.id}`;
        return (
          <li key={key} className="flex gap-3 py-3">
            <Icon
              size={18}
              strokeWidth={1.5}
              className="mt-0.5 shrink-0 text-number"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-base text-text">{linkSentence(link)}</span>
              <span className="mt-0.5 block text-sm text-muted">
                <span className="numeric">{formatNumber(link.withAverage, 1)}</span> против{' '}
                <span className="numeric">{formatNumber(link.withoutAverage, 1)}</span>, дней:{' '}
                <span className="numeric">{link.withDays}</span> и{' '}
                <span className="numeric">{link.withoutDays}</span>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
