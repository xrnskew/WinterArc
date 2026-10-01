/** Есть ли в объекте ошибок формы хоть одна ошибка: {} → false, { name: '…' } → true. */
export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}
