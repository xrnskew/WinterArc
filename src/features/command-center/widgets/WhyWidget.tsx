import { Link } from 'react-router';
import { PATHS } from '../../../app/routes';
import type { WidgetProps } from './WidgetFrame';

/** «Зачем»: слова, которые держат в трудные дни. */
export function WhyWidget({ arc }: WidgetProps) {
  if (!arc.why) {
    return (
      <p className="text-sm text-muted">
        Ты ещё не написал, зачем тебе эта арка.{' '}
        <Link to={PATHS.settings} className="text-text underline underline-offset-4">
          Написать в настройках
        </Link>
      </p>
    );
  }
  return <p className="text-base whitespace-pre-line text-text">{arc.why}</p>;
}
