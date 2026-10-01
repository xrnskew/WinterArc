/**
 * id подсказки или ошибки под полем — для aria-describedby.
 * Скринридер прочитает её вместе с подписью поля.
 */
export const describedBy = (id: string) => `${id}-note`;
