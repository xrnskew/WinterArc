import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { StagePlaceholder } from '../StagePlaceholder';

export function AchievementsScreen() {
  return (
    <>
      <ScreenHeader title="Достижения" />
      <StagePlaceholder stage="ж">
        Ледяные жетоны за серии и рубежи: 7, 30, 60, 90 дней, первые 10 часов и другие.
      </StagePlaceholder>
    </>
  );
}
