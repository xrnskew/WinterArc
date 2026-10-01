import { Target } from 'lucide-react';
import type { IconName } from '../../domain/types';
import { HABIT_ICONS } from './habitIcons';

interface HabitIconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function HabitIcon({ name, size = 22, className }: HabitIconProps) {
  const Icon = HABIT_ICONS[name] ?? Target;
  return <Icon size={size} strokeWidth={1.5} className={className} aria-hidden="true" />;
}
