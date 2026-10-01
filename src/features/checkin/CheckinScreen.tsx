import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { StagePlaceholder } from '../StagePlaceholder';

export function CheckinScreen() {
  return (
    <>
      <ScreenHeader title="Чек-ин" />
      <StagePlaceholder stage="в">
        Все привычки и оценки дня на одном экране. Заполняется за 30 секунд.
      </StagePlaceholder>
    </>
  );
}
