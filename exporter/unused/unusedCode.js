/*
// улучшенные функции двойных кликов и тапов.
// Конфигурация
const TAP_DELAY = 300; // Максимальный интервал между тапами
const SELECTION_CHECK_DELAY = 100; // Задержка проверки выделения

// Переменные состояния
let lastTapTime = 0;
let lastTapTarget = null;
let tapCount = 0;
let pendingSelectionCheck = null;

// Основной обработчик выделения
function processSelection(event) {
    if (event.target.closest('th')) return;
    
    const selection = getValidSelection();
    if (!selection) return;
    
    applySelection(selection, event);
}

// Фолбэк-обработчик тапов
function handleTapWithFallback(event) {
    const now = Date.now();
    const isSameTarget = event.target === lastTapTarget;
    const isDoubleTap = (now - lastTapTime < TAP_DELAY) && isSameTarget;

    // Обновляем состояние тапов
    if (isDoubleTap) {
        tapCount++;
    } else {
        tapCount = 1;
    }
    
    lastTapTime = now;
    lastTapTarget = event.target;

    // Пытаемся обработать как двойной тап
    if (tapCount === 2) {
        event.preventDefault();
        
        // 1. Пытаемся эмулировать dblclick
        try {
            const clickEvent = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: event.changedTouches?.[0]?.clientX,
                clientY: event.changedTouches?.[0]?.clientY
            });
            event.target.dispatchEvent(clickEvent);
        } catch (e) {
            console.log('Double click emulation failed', e);
        }

        // 2. Фолбэк: прямая обработка через задержку
        clearTimeout(pendingSelectionCheck);
        pendingSelectionCheck = setTimeout(() => {
            const selection = getValidSelection();
            if (selection && !event.defaultPrevented) {
                applySelection(selection, event);
            }
            tapCount = 0;
        }, SELECTION_CHECK_DELAY);
    }
}

// Вспомогательные функции
function getValidSelection() {
    const selection = window.getSelection().toString().trim();
    return selection && !selection.includes('\n') ? selection : null;
}

function applySelection(selection, event) {
    // Отменяем дальнейшую обработку
    if (event) event.preventDefault();
    
    // Применяем выделение
    searchBox.value = selection;
    handleFormSubmit();
    
    // Пытаемся обновить историю
    try {
        history.pushState({ selectedText: selection }, '', `#${encodeURIComponent(selection)}`);
    } catch (e) {
        console.log('History update failed', e);
    }
}

// Инициализация
function initSelectionHandlers() {
    // Стандартные обработчики
    dpdPane.addEventListener('dblclick', processSelection);
    historyPane.addEventListener('dblclick', processSelection);

    // Тач-обработчики с фолбэком
    const touchOptions = { passive: false };
    dpdPane.addEventListener('touchend', handleTapWithFallback, touchOptions);
    historyPane.addEventListener('touchend', handleTapWithFallback, touchOptions);

    // Предотвращаем масштабирование
    document.addEventListener('touchstart', e => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
}

// Запускаем с проверкой зависимостей
if (window.getSelection && searchBox && typeof handleFormSubmit === 'function') {
    try {
        initSelectionHandlers();
        console.log('Selection handlers initialized');
    } catch (e) {
        console.error('Initialization failed', e);
    }
} else {
    console.error('Required dependencies not found');
}

// NEW: handle browser back/forward
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.selectedText) {
        const selectedText = event.state.selectedText;
        searchBox.value = selectedText;
        handleFormSubmit();
    }
});
*/


/* первый вариант
//ссылки в футере
//const searchBoxForFooter = document.getElementById('search-box');

function updateFooterLinks(query) {
  // FDG
  const fdgUrl = `https://dhamma.gift?p=-kn&q=${encodeURIComponent(query)}`;
  document.getElementById('fdg-link').href = fdgUrl;

  // DPD
  const dpdUrl = new URL(window.location.href);
  dpdUrl.hostname = 'dpdict.net';
  dpdUrl.protocol = 'https:';
  dpdUrl.port = '';
  dpdUrl.searchParams.set('q', query);
  document.getElementById('dpd-link').href = dpdUrl.toString();
}

// обновляем при вводе текста
searchBoxForFooter.addEventListener('input', () => {
  const query = searchBoxForFooter.value;
  updateFooterLinks(query);
});

// при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  const initQuery = new URL(window.location.href).searchParams.get('q') || '';
  updateFooterLinks(initQuery);
});
//ссылки в футере конец
*/