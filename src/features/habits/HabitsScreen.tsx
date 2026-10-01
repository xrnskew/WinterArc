import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { StagePlaceholder } from '../StagePlaceholder';

export function HabitsScreen() {
  return (
    <>
      <ScreenHeader title="Привычки" />
      <StagePlaceholder stage="в">
        Список привычек. У каждой своя страница: серии, статистика, график.
      </StagePlaceholder>
    </>
  );
}
