import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { StagePlaceholder } from '../StagePlaceholder';

export function CommandCenterScreen() {
  return (
    <>
      <ScreenHeader title="Центр" />
      <StagePlaceholder stage="г">
        Отсчёт до конца арки, зарубки дней, индекс дисциплины недели и виджеты, которые ты
        выберешь сам.
      </StagePlaceholder>
    </>
  );
}
