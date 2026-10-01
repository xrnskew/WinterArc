import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { StagePlaceholder } from '../StagePlaceholder';

export function GoalsScreen() {
  return (
    <>
      <ScreenHeader title="Цели" />
      <StagePlaceholder stage="д">
        Цели с шагами, числовые цели с прогнозом и задачи с дедлайнами.
      </StagePlaceholder>
    </>
  );
}
