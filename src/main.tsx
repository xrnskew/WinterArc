import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './app/router';
import { applyTheme } from './design/applyTheme';
import './design/fonts';
import './design/global.css';
import { THEMES } from './design/themes';
import { useAppStore } from './store/useAppStore';

// Тема записывается в CSS-переменные до первого рендера — без мигания.
applyTheme(THEMES[useAppStore.getState().data.settings.themeId]);

const root = document.getElementById('root');
if (!root) throw new Error('В index.html нет элемента #root');

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
