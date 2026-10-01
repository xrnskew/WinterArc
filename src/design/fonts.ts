/**
 * Шрифты лежат в node_modules (@fontsource) и попадают в сборку —
 * интернет не нужен, приложение работает офлайн.
 * Подключаем только кириллицу и латиницу и только нужные начертания.
 */

// Oswald — заголовки экранов
import '@fontsource/oswald/cyrillic-500.css';
import '@fontsource/oswald/latin-500.css';

// Golos Text — основной текст
import '@fontsource/golos-text/cyrillic-400.css';
import '@fontsource/golos-text/latin-400.css';
import '@fontsource/golos-text/cyrillic-500.css';
import '@fontsource/golos-text/latin-500.css';

// JetBrains Mono — цифры (только латиница: в ней все цифры и знаки)
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
