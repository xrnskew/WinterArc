import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article';
}

/** Карточка из тёмного матового стекла: снег мягко просвечивает сквозь неё. */
export function GlassCard({ as: Tag = 'div', className, ...rest }: GlassCardProps) {
  return <Tag className={cx('glass rounded-lg p-4', className)} {...rest} />;
}
