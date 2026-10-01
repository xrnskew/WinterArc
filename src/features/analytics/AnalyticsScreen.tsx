import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { StagePlaceholder } from '../StagePlaceholder';

export function AnalyticsScreen() {
  return (
    <>
      <ScreenHeader title="Аналитика" />
      <StagePlaceholder stage="е">
        Графики привычек и оценок, календарь арки, тепловые карты и простые выводы: в какие дни тебе
        лучше.
      </StagePlaceholder>
    </>
  );
}
