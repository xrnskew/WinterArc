/**
 * Скачать текст файлом: браузер сохранит его в «Загрузки»
 * (на телефоне — предложит, куда сохранить или кому отправить).
 */
export function downloadFile(name: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  // Ссылку на файл освобождаем чуть позже: некоторым браузерам нужно время, чтобы начать загрузку.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
