import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { StagePlaceholder } from '../StagePlaceholder';

export function WeeklyReviewScreen() {
  return (
    <>
      <ScreenHeader title="Обзор недели" />
      <StagePlaceholder stage="ж">
        Итоги недели и три вопроса: что получилось, что нет, на чём фокус дальше.
      </StagePlaceholder>
    </>
  );
}
