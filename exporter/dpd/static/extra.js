//история перестала добавляться на лету и теперь требует перезагрузки страницы. 

window.isRu = window.location.pathname.startsWith('/ru');

// theme from GET ?theme=dark|light
(function () {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get('theme');

  if (theme === 'dark' || theme === 'light') {
    document.body.classList.remove('dark-mode', 'light-mode');
    document.body.classList.add(theme + '-mode');
    localStorage.setItem('theme', theme);

    if (window.themeToggle) {
      themeToggle.checked = theme === 'dark';
    }
  }
})();

// Проверяем, есть ли параметр source=pwa в URL
const urlParams = new URLSearchParams(window.location.search);
const isPWA = urlParams.get('source') === 'pwa';

// Если это PWA и нужно принудительно задать язык
if (isPWA) {
    // Удаляем параметр source=pwa (чтобы он не дублировался после редиректа)
    urlParams.delete('source');

    // Сохраняем оставшиеся параметры в строку (если они есть)
    const remainingQuery = urlParams.toString();
    const queryString = remainingQuery ? `?${remainingQuery}` : '';

    // Проверяем язык в localStorage или определяем его
    let siteLanguage = localStorage.getItem('siteLanguage');

    if (!siteLanguage) {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/ru/')) {
            siteLanguage = 'ru';
        } else if (currentPath.includes('/th/')) {
            siteLanguage = 'th';
        } else {
            const browserLang = navigator.language || navigator.userLanguage;
            siteLanguage = browserLang.startsWith('ru') ? 'ru' : 
                          browserLang.startsWith('th') ? 'th' : 'en';
        }
        localStorage.setItem('siteLanguage', siteLanguage);
    }

    // Получаем текущий путь и хэш
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;

    // Делаем редирект с сохранением всех параметров (кроме source=pwa) и хэша
    if (siteLanguage === 'ru' && !currentPath.includes('/ru/')) {
        window.location.href = `/ru/${queryString}${currentHash}`;
    } else if (siteLanguage === 'th' && !currentPath.includes('/th/')) {
        window.location.href = `/th/${queryString}${currentHash}`;
    } else if (siteLanguage === 'en' && currentPath !== '/') {
        window.location.href = `/${queryString}${currentHash}`;
    }
}
// ======== Конфигурация ========
const LANGUAGE_PREFIX = '/ru'; // Префикс для русского языка
const DEFAULT_LANG = 'en';     // Язык по умолчанию

// ======== Основной код ========
// Обработка горячих клавиш Alt+H (История) и Alt+S (Настройки) независимо от раскладки
document.addEventListener('keydown', function(event) {
    if (event.altKey) {
        if (event.code === 'KeyH') {
            event.preventDefault();
            if (window.innerWidth >= 769) {
                if (typeof toggleDesktopHistoryBtn === 'function') {
                    toggleDesktopHistoryBtn();
                }
            } else {
                if (typeof toggleHistory === 'function') {
                    toggleHistory();
                }
            }
        } else if (event.code === 'KeyS') {
            event.preventDefault();
            if (window.innerWidth >= 769) {
                if (typeof toggleDesktopSettingsBtn === 'function') {
                    toggleDesktopSettingsBtn();
                }
            } else {
                if (typeof toggleSettings === 'function') {
                    toggleSettings();
                }
            }
        }
    }
});


document.addEventListener('keydown', function(event) {
  const isCtrl3 = event.ctrlKey && event.code === 'Digit3';
  const isAlt3 = event.altKey && event.code === 'Digit3';

  if (isCtrl3 || isAlt3) {
    event.preventDefault();

    const currentUrl = window.location.href;
    const currentParams = window.location.search; // включает ? и все параметры

    let targetUrl;

    if (
      currentUrl.includes('/ru') ||
      currentUrl.includes('/r') ||
      currentUrl.includes('/ml')
    ) {
      targetUrl = 'https://dhamma.gift/ru/';
    } else {
      targetUrl = 'https://dhamma.gift/';
    }

    // Добавляем параметры, если есть
    if (currentParams) {
      targetUrl += currentParams;
    }

    window.location.href = targetUrl;
  }
});


document.addEventListener('keydown', function(event) {
  const isCtrl2 = event.ctrlKey && event.code === 'Digit2';
  const isAlt2 = event.altKey && event.code === 'Digit2';

  if (isCtrl2 || isAlt2) {
    event.preventDefault();

    const currentUrl = window.location.href;
    let targetUrl;

    if (
      currentUrl.includes('/ru') ||
      currentUrl.includes('/r') ||
      currentUrl.includes('/ml')
    ) {
      targetUrl = 'https://dhamma.gift/ru/read.php';
    } else {
      targetUrl = 'https://dhamma.gift/read.php';
    }

    window.location.href = targetUrl;
  }
});


document.addEventListener("keydown", handleLanguageShortcut);

// Применяем сохраненный язык при загрузке
/* function applySavedLanguage() {
    const savedLang = localStorage.getItem("preferredLanguage");
    const currentPath = window.location.pathname;
    
    // Если язык не совпадает с сохраненным
    if (savedLang === 'ru' && !currentPath.startsWith(LANGUAGE_PREFIX)) {
        redirectWithLanguage(LANGUAGE_PREFIX + currentPath);
    } else if (savedLang !== 'ru' && currentPath.startsWith(LANGUAGE_PREFIX)) {
        redirectWithLanguage(currentPath.slice(LANGUAGE_PREFIX.length));
    }
}*/

// Обработка горячих клавиш
function handleLanguageShortcut(event) {
    if ((event.altKey || event.ctrlKey) && event.code === "Digit1") {
        event.preventDefault();
        toggleLanguage();
    }
}

// Переключение языка
function toggleLanguage() {
    const currentPath = window.location.pathname;
    let newPath, newLang;
    
    if (currentPath.startsWith(LANGUAGE_PREFIX)) {
        newPath = currentPath.slice(LANGUAGE_PREFIX.length) || '/';
        newLang = DEFAULT_LANG;
    } else {
        newPath = LANGUAGE_PREFIX + (currentPath === '/' ? '' : currentPath);
        newLang = 'ru';
    }
    
    localStorage.setItem("preferredLanguage", newLang);
    redirectWithLanguage(newPath);
}

// Безопасный редирект         newUrl.protocol = 'https:'; 

function redirectWithLanguage(newPath) {
    // Проверяем, не пытаемся ли перейти на тот же URL
    if (window.location.pathname !== newPath) {
        const newUrl = new URL(window.location.href);
        newUrl.pathname = newPath;
        window.location.href = newUrl.toString();
    }
}


// Add this with other hotkey listeners
document.addEventListener('keydown', function(event) {
  if (event.altKey && event.code === 'KeyT') {
    event.preventDefault();
    toggleThemeProgrammatically();
  }
});

// Add this function to programmatically toggle the theme
function toggleThemeProgrammatically() {
  themeToggle.checked = !themeToggle.checked;
  const event = new Event('change');
  themeToggle.dispatchEvent(event);
}

document.addEventListener('keydown', (event) => {
  if (event.altKey && (event.code === 'Period' || event.code === 'KeyQ')) {
    event.preventDefault();

openDictionaries(event);
  }
});

//установка фокуса в инпуте по нажатию / 
document.addEventListener('keydown', function(event) {
    // Проверяем именно символ / (код 191 или Slash)
    if (event.key === '/' || event.code === 'Slash') {
        // Ищем все возможные инпуты
        const inputs = document.querySelectorAll(
            '#search-box[type="search"], #paliauto[type="text"], .dtsb-value.dtsb-input'
        );
		        
        // Если нет ни одного подходящего инпута - выходим
        if (inputs.length === 0) return;
        
        // Берем первый подходящий инпут (или можно реализовать более сложную логику выбора)
        const input = inputs[0];
        
        // Предотвращаем действие по умолчанию только если нашли инпут
        event.preventDefault();
        
        // Фокусируемся и перемещаем курсор в конец
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }
});

// Отключаем перехват / когда фокус уже в инпуте
const handleInputKeydown = (event) => {
    if (event.key === '/' || event.code === 'Slash') {
        event.stopPropagation();
    }
};

// Вешаем обработчики на все существующие и будущие инпуты
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keydown', handleInputKeydown);
});

// Наблюдатель для динамически добавляемых инпутов
new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'INPUT') {
                node.addEventListener('keydown', handleInputKeydown);
            } else if (node.querySelectorAll) {
                node.querySelectorAll('input').forEach(input => {
                    input.addEventListener('keydown', handleInputKeydown);
                });
            }
        });
    });
}).observe(document.body, { childList: true, subtree: true });

//конец фокуса в инпуте по нажатию / 


let startMessage;

function initStartMessage(lang) {
    
    // === НОВОЕ: Обработка silent режима ===
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('silent')) {
        // Используем lang (аргумент) или language (глобальную переменную)
        // Оборачиваем в HTML, чтобы сохранились отступы и стили
        if (lang === 'ru' || (typeof language !== 'undefined' && language === 'ru')) {
            startMessage = `
            <div class="message-container">
                <p class="message" style="text-align: center; margin-top: 20px;">
                    Ждём ответ от DPD...
                </p>
            </div>`;
        } else {
            startMessage = `
            <div class="message-container">
                <p class="message" style="text-align: center; margin-top: 20px;">
                    Waiting for a response from DPD...
                </p>
            </div>`;
        }
        return; // Важно: выходим, чтобы не перезаписать переменную длинным текстом ниже
    }
    if (language === 'en') {
        startMessage = `
<div class="message-container">
  <div class="messages-content">
    <p class="message">Search in Pāḷi using <b>Autocomplete</b> or <b>Velthuis</b>, or use English.</p>
    <p class="message">For <b>Pali Lookup on any sites</b>: <a title='Chrome, Opera, Brave, Edge or Yandex Browser. Also available in Firefox Add-ons' target="_blank" href='https://chromewebstore.google.com/detail/dhammagift-search-and-wor/dnnogjdcmhbiobpnkhdbfnfjnjlikabd?authuser=1&hl=en'>Browser Extention</a>, <a href='#' title='Chrome Android menu → "Add to Home screen"' id='installLink'>Web</a> or <a target="" href="https://github.com/dhammagift/dpd-twa/releases" title="Latest APK file for Dict.Dhamma.Gift TWA">Android</a> App. Then: select the word → in OS "share" menu choose Dict.DG.</p>
	    <p class="message"><b>Grammar Dictionary table</b> is sortable.</p>

  </div>

  <input type="checkbox" id="toggle-messages" class="toggle-checkbox">
  
  <div class="collapsible">
    <p class="message">
    
    </p>
    <p class="message">
  <b>Available Hotkeys:</b> press <strong>/</strong> to activate the search bar<br>
  <strong>Ctrl+1</strong> or <strong>Alt+1</strong> — Toggle English/Russian<br>
  <strong>Ctrl+2</strong> or <strong>Alt+2</strong> — Open <em>Dhamma.Gift Read</em><br>
  <strong>Ctrl+3</strong> or <strong>Alt+3</strong> — Open <em>Dhamma.Gift Search</em><br>
  <strong>Alt+Q</strong> — Look up word in multiple dictionaries<br>
  <strong>Alt+T</strong> — Toggle Theme
</p>
    <p class="message"><b>Footer links</b>: Dict - to search the word in other dicts, DG - with Dhamma.Gift, DPD - in Dpdict.net</p>
    <p class="message">Adjust <b>Settings</b> as needed including changing language. <b>Refresh</b> page if issues occur.</p>
    <p class="message"><b>Double-click</b> any word to search. e.g.: kāmarāgapariyuṭṭhitena peace kar gacchatīti Root✓</p>
 <p class="message">
<strong>Autosuggestions</strong>: from the Four Nikāyas (DN, MN, SN, AN), parts of the KN (Dhp, Iti, Ud, Snp), and all sections of the Vinaya, Mahāsaṅgīti edition; exc variants readings .<br>
<strong>Match count</strong> (e.g., mettā 27) shows how many times the word appears in these texts.
</p>


  </div>
  
  <div class="toggle-button-container">
    <label for="toggle-messages" class="toggle-button">
      <span class="more-text">More</span>
      <span class="hide-text">Hide</span>
    </label>
  </div>
</div>
`;
    } else if (language === 'ru') {
        startMessage = `
        <div class="message-container">
  <div class="messages-content">
<p class="message">Ищите на пали с <b>Автоподсказками</b> или <b>Velthuis</b>, или русском .</p>
<p class="message">Для <b>словаря на любом сайте</b> есть: <a target='_blank' title='Chrome, Opera, Brave, Edge или Yandex Browser. Также есть в Fierfox Add-ons' href='https://chromewebstore.google.com/detail/dhammagift-search-and-wor/dnnogjdcmhbiobpnkhdbfnfjnjlikabd?authuser=1&hl=ru'>Расширение</a>, и <a title='также через Меню Chrome Android → "Добавить на главную" → Установить' href='#' id='installLink'>Web</a> или <a target="" href="https://github.com/dhammagift/dpd-twa/releases" title="Последнее оновление APK для Dict.Dhamma.Gift TWA">Android</a> приложения. 
Затем: выделите слово → в ОС меню "поделиться" выберите Dict.DG.</p>
<p class="message"><b>Таблицу в Словаре Грамматики</b> можно сортировать.</p>

  </div>
  <input type="checkbox" id="toggle-messages" class="toggle-checkbox">
  
  <div class="collapsible">
<p class="message"><b>Горячие Клавиши</b>: нажмите <strong>/</strong> чтобы активировать строку поиска<br>
<strong>Ctrl+1</strong> или <strong>Alt+1</strong> переключить Рус/Англ<br>
<strong>Ctrl+2</strong> или <strong>Alt+2</strong> открыть Dhamma.Gift Read<br>
<strong>Ctrl+3</strong> или <strong>Alt+3</strong> открыть Dhamma.Gift Search<br>
<strong>Alt+Q</strong> открыть слово в нескольких словарях<br>
<strong>Alt+T</strong> переключить тему

</p>
<p class="message"><b>Ссылки в футере</b> Dict - поиск слова в разных словарях, DG - через Dhamma.Gift, DPD - на Dpdict.net</p>
<p class="message">Попробуйте разные <b>Настройки</b>, включая смену языка. При возникновении проблем <b>Обновите</b> страницу.</p>
<p class="message"><b>Двойной клик</b> по любому слову для поиска. К примеру: kāmarāgapariyuṭṭhitena мир kar gacchatīti Root✓</p>
  
<p class="message">
<strong>Автоподсказки</strong>: слова из Четырёх Никай (DN, MN, SN, AN), части KN (Dhp, Iti, Ud, Snp) и всех разделов Винаи, редакции Mahasangiti, варианты не выводятся.<br>
<strong>Кол-во совпадений</strong> (например, mettā 27) показывает, сколько раз слово встречается в этих текстах.
</p>
  </div>
  
  <div class="toggle-button-container">
    <label for="toggle-messages" class="toggle-button">
      <span class="more-text">Ещё</span>
      <span class="hide-text">Скрыть</span>
    </label>
  </div>
</div>

`;
    }
}

  // Модифицированная функция changeLanguage   url.protocol = 'https:'; 
function changeLanguage(lang) {
  if (typeof showSpinner === 'function') {
      showSpinner();
  }

  const currentPath = window.location.pathname;
  if (currentPath.includes('search_html')) {
      const container = document.getElementById('dpdResults');
      
      if (container) {
          container.insertAdjacentHTML('beforeend', `
            <div class="spinner-container transparent-spinner">
                <img src="static/circle-notch.svg" class="loading-spinner">
            </div>
        `);
      }
  }

  const url = new URL(window.location.href);
  let path = url.pathname; 
  let siteLanguage = '';
  
  path = path.replace(/^\/ru/, '');

  if (lang === 'ru') {
    path = '/ru' + path;
    siteLanguage = 'ru'; 
  } else {
    siteLanguage = 'en';
  }

  url.pathname = path;

  localStorage.setItem('siteLanguage', siteLanguage);

  const payload = { 
      action: 'dg_language_changed', 
      lang: siteLanguage 
  };

  window.postMessage(payload, '*');

  if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
  }

  if (window.opener && window.opener !== window) {
      window.opener.postMessage(payload, '*');
  }

  window.location.href = url.toString();
}

//ссылки в футере
const searchBoxForFooter = document.getElementById('search-box');

// Функция для обновления конкретной ссылки
function updateLink(el, baseUrl) {
  // берём значение из инпута
  let query = searchBoxForFooter?.value?.trim() || '';

  // если инпут пуст — берём из URL
  if (!query) {
    const params = new URLSearchParams(window.location.search);
    query = params.get('q') || '';
  }

  // если вообще нечего подставлять — выходим
 // if (!query) return;

  const url = new URL(baseUrl);
  url.searchParams.set('q', query);

  // обновляем href ТОЛЬКО ПЕРЕД ПЕРЕХОДОМ
  el.href = url.toString();
}

async function handleClientSearch(rawQuery) {
    const query = cleanQueryParam(rawQuery);
    if (!query) return;

    const searchBox = document.getElementById('search-box');
    if (searchBox && searchBox.value !== query) {
        searchBox.value = query;
    }

    if (typeof addToHistory === 'function') {
        addToHistory(query);
    } else {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('q', query);
        window.history.pushState({}, '', newUrl);
    }
    
    if (typeof populateHistoryBody === 'function') {
        populateHistoryBody();
    }

    const resultsContainer = document.getElementById('dpd-results');
    const summaryContainer = document.getElementById('summary-results');

    if (summaryContainer) {
        summaryContainer.innerHTML = '';
    }

    if (resultsContainer) {
        const loadingText = window.isRu ? 'Ждём ответ от DPD...' : 'Waiting for a response from DPD...';
        resultsContainer.innerHTML = `
            <div class="message-container" style="text-align: center; margin-top: 40px;">
                <div class="spinner-container transparent-spinner" style="margin-bottom: 15px;">
                    <img src="static/circle-notch.svg" class="loading-spinner" alt="Loading">
                </div>
                <p class="message">${loadingText}</p>
            </div>
        `;
        resultsContainer.dataset.stale = 'true';
    }

    // Вызов единого централизованного менеджера словарей
    loadExternalDictionaries(query);

    try {
        const currentLang = window.isRu ? 'ru' : 'en';
        const data = await fetchFromBackend(query, currentLang);

        if (resultsContainer) {
            resultsContainer.innerHTML = data.dpd_html || '<div class="message">Ничего не найдено</div>';
            resultsContainer.dataset.stale = 'false';
        }

        if (summaryContainer && data.summary_html) {
            summaryContainer.innerHTML = data.summary_html;
        }

        const togglesToUpdate = [
            'summary-toggle', 
            'grammar-toggle', 
            'example-toggle', 
            'sanskrit-toggle'
        ];
        
        togglesToUpdate.forEach(toggleId => {
            const toggleElement = document.getElementById(toggleId);
            if (toggleElement) {
                const event = new Event('change', { bubbles: true });
                toggleElement.dispatchEvent(event);
            }
        });

        // Надежный маркер успешного ответа — наличие блока с кратким значением или кнопок
        const firstHeading = resultsContainer ? resultsContainer.querySelector('h3.dpd') : null;
        const hasRealEntry = resultsContainer ? resultsContainer.querySelector('.dpd.summary, .button-box') !== null : false;
        
        const gandhariSlot = document.getElementById('ext-slot-gandhari');
        const ptsSlot = document.getElementById('ext-slot-pts');
        
        if (firstHeading && hasRealEntry) {
            const normalizedQuery = firstHeading.textContent.replace(/[\d\s]+$/, '').trim();
            if (gandhariSlot) gandhariSlot.style.display = 'block';
            if (ptsSlot) ptsSlot.style.display = 'block';
            
            appendGandhari(normalizedQuery);
            appendPts(normalizedQuery);
        } else {
            if (gandhariSlot) {
                gandhariSlot.style.display = 'none';
                gandhariSlot.innerHTML = '';
            }
            if (ptsSlot) {
                ptsSlot.style.display = 'none';
                ptsSlot.innerHTML = '';
            }
        }

    } catch (error) {
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="color: #c08552; padding: 20px; text-align: center;">
                    Ошибка загрузки словаря: ${error.message}.<br>Проверьте соединение или CORS.
                </div>
            `;
        }
    }
}

// Инициализация ссылок при загрузке
//  updateLink('fdg-link', window.location.href.includes('/ru') ? 'https://dhamma.gift/ru/?p=-kn' : 'https://dhamma.gift?p=-kn');
// updateLink('dpd-link', window.location.href.includes('/ru') ? 'https://ru.dpdict.net' : 'https://dpdict.net');

//и обновление при клике
document.addEventListener('click', (e) => {
  const dg = e.target.closest('.dg-link');
  const dpd = e.target.closest('.dpd-link');

  if (dg) {
    updateLink(
      dg,
      window.location.pathname.startsWith('/ru')
        ? 'https://f.dhamma.gift/ru/?p=-kn'
        : 'https://dhamma.gift?p=-kn'
    );
    return;
  }

  if (dpd) {
    updateLink(
      dpd,
      window.location.pathname.startsWith('/ru')
        ? 'https://ru.dpdict.net'
        : 'https://dpdict.net'
    );
  }
});

//ссылки в футере конец

// Функции переключения с сохранением состояния
function toggleDesktopHistoryBtn() {
    const historyPane = document.getElementById('history-pane');
    if (historyPane) {
        const isHidden = historyPane.classList.toggle('desktop-hidden');
        localStorage.setItem('desktopHistoryHidden', isHidden);
    }
}

function toggleDesktopSettingsBtn() {
    const settingsPane = document.querySelector('.settings-pane');
    if (settingsPane) {
        const isHidden = settingsPane.classList.toggle('desktop-hidden');
        localStorage.setItem('desktopSettingsHidden', isHidden);
    }
}

// Восстановление состояния при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const historyHidden = localStorage.getItem('desktopHistoryHidden');
    const settingsHidden = localStorage.getItem('desktopSettingsHidden');
    
    // Если в памяти записано 'true', скрываем панель
    if (historyHidden === 'true') {
        const historyPane = document.getElementById('history-pane');
        if (historyPane) historyPane.classList.add('desktop-hidden');
    }
    
    if (settingsHidden === 'true') {
        const settingsPane = document.querySelector('.settings-pane');
        if (settingsPane) settingsPane.classList.add('desktop-hidden');
    }
});


function toggleSettings() {
  const settingsContent = document.getElementById('settings-content');
  
  // Проверяем, является ли устройство мобильным (ширина экрана меньше 769px)
  if (window.innerWidth < 769) {
    // Переключаем видимость панели
    if (settingsContent.style.display === 'none' || !settingsContent.style.display) {
      settingsContent.style.display = 'block';
    } else {
      settingsContent.style.display = 'none';
    }
  }
}


function toggleHistory() {
  const historyContent = document.getElementById('history-content');
  
  // Проверяем, является ли устройство мобильным (ширина экрана меньше 769px)
  if (window.innerWidth < 769) {
    // Переключаем видимость панели
    if (historyContent.style.display === 'none' || !historyContent.style.display) {
      historyContent.style.display = 'block';
    } else {
      historyContent.style.display = 'none';
    }
  }
}

// Переменная для хранения ширины окна
let lastWidth = window.innerWidth;

window.addEventListener('resize', function() {
  const currentWidth = window.innerWidth;
  const settingsContent = document.getElementById('settings-content');
  const historyContent = document.getElementById('history-content');

  // Если ширина НЕ изменилась (например, изменилась только высота из-за скролла), ничего не делаем
  if (currentWidth === lastWidth) return;
  
  // Обновляем значение ширины для следующей проверки
  lastWidth = currentWidth;

  // Логика переключения отображения только при реальном изменении ширины (поворот экрана или ресайз окна)
  if (currentWidth >= 769) {
    if (settingsContent) settingsContent.style.display = 'block';
    if (historyContent) historyContent.style.display = 'block';
  } else {
    if (settingsContent) settingsContent.style.display = 'none';
    if (historyContent) historyContent.style.display = 'none';
  }
});

function setOneButtonToggleDefault() {
    const toggleId = "one-button-toggle";
    const savedState = localStorage.getItem(toggleId);
    
    if (savedState === null) {
        const toggleElement = document.getElementById(toggleId);
        if (toggleElement) {
            toggleElement.checked = true;
            // Опционально: сохраняем в localStorage, чтобы при следующей загрузке
            // поведение было согласованным
            localStorage.setItem(toggleId, 'true');
        }
    }
}



document.addEventListener('DOMContentLoaded', function() {
   
setOneButtonToggleDefault();

    const button = document.getElementById('search-button');
    if (!button) return;

    const originalHTML = button.innerHTML; // Сохраняем исходное содержимое
    const icon = document.createElement('img');
    icon.src = 'static/magnifying-glass.svg';
    icon.alt = 'Search';
    icon.style.cssText = `
        width: 16px !important;
        height: 16px !important;
        vertical-align: middle;
    `;

// Инициализация - устанавливаем начальное значение из URL
  const urlParams = new URLSearchParams(window.location.search);
  searchBoxForFooter.value = urlParams.get('q') || '';


/*
// Обнуляем существующую функцию changeLanguage
if (typeof changeLanguage === 'function') {
  changeLanguage = function() {}; // Заменяем на пустую функцию
}
*/ 

const tabsToggle = document.getElementById("tabs-toggle");
const tabContainer = document.getElementById("tab-container");

// Проверяем, существуют ли элементы
if (!tabsToggle || !tabContainer) {
    return;
}


// Функция для обновления видимости табов
function updateTabVisibility() {
    const tabsHidden = localStorage.getItem("tabsHidden");

    // Если состояние "true" — скрываем. 
    // Если "false" или null (еще не задано) — показываем по умолчанию.
    if (tabsHidden === "true") {
        tabContainer.style.display = 'none';     // Скрываем табы
        tabsToggle.checked = false;              // Переключатель ВЫКЛЮЧЕН
    } else {
        tabContainer.style.display = 'flex';     // Показываем табы
        tabsToggle.checked = true;               // Переключатель ВКЛЮЧЁН (show)
    }
}

// Применяем начальное состояние
updateTabVisibility();

// Обработчик изменения переключателя
tabsToggle.addEventListener("change", function () {
    const isShown = this.checked;

    if (isShown) {
        tabContainer.style.display = 'flex';          // show
        localStorage.setItem("tabsHidden", "false");
    } else {
        tabContainer.style.display = 'none';          // hide
        localStorage.setItem("tabsHidden", "true");
    }
});

//PWA installation
let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e; // Сохраняем событие для будущей установки
  });

const installLink = document.getElementById('installLink');

if (installLink) {
  document.getElementById('installLink').addEventListener('click', async (e) => {
    e.preventDefault();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      deferredPrompt = null;
    } 
  });
}

});


 function showSpinner() {
    const currentPath = window.location.pathname;
    const isRootPath = currentPath === '/' || currentPath === '/ru/' || currentPath === '/ru';
    
    if (isRootPath) {
        // Создаем полупрозрачный спиннер
        dpdResults.insertAdjacentHTML('beforeend', `
            <div class="spinner-container transparent-spinner">
                <img src="static/circle-notch.svg" class="loading-spinner">
            </div>
        `);
        //<div class="loading-text">${language === 'en' ? "Loading..." : "Загрузка..."}</div>
    }
}



// tab replacement woth links 
  // 1. Define Helper function to determine Base URL
  function getBaseUrl() {
    return window.isRu ? 'https://ru.dpdict.net' : 'https://dpdict.net';
  }

  // 2. Define the function that updates the links
  function updateExternalLinks() {
    const searchBox = document.getElementById('search-box');
    const bdLink = document.getElementById('bold-def-link');
    const trLink = document.getElementById('translations-link');
    
    // Get the value directly from the input box, not just the URL
    const q = searchBox.value.trim();
    const base = getBaseUrl();

    if (q) {
      const encoded = encodeURIComponent(q);

      // Update Bold Definitions Link
      bdLink.href = `${base}/?tab=bd&q1=${encoded}&q2=&option=regex`;

      // Update Translations Link
      trLink.href = `${base}/?tab=tt&q=${encoded}&book=all`;
    } else {
      // Fallback links if search is empty
      bdLink.href = `${base}/?tab=bd`;
      trLink.href = `${base}/?tab=tt`;
    }
  }

  // 3. Attach Event Listeners
  const searchInput = document.getElementById('search-box');
  
  // Update links whenever the user types
  searchInput.addEventListener('input', updateExternalLinks);
  
  // Update links if the user pastes text
  searchInput.addEventListener('change', updateExternalLinks);

  // 4. Run once on page load to handle any pre-filled values (e.g. from {{ search }})
  document.addEventListener('DOMContentLoaded', updateExternalLinks);


  
document.addEventListener('click', function(event) {
    const pane = event.target.closest('#dpd-pane');
    if (!pane) return;

    let suttaCode = '';
    let sParam = '';
    // Список книг: включено iti, поддержка сложных индексов типа thag1.9
    const regex = /^(mn|dn|sn|an|dhp|snp|ud|iti|thag|thig)\s?(\d+([.\d-]+)?)$/i;

    const suttaElement = event.target.closest('.sutta');
    
    if (suttaElement) {
        // Логика для специальных блоков .sutta
        const match = suttaElement.innerText.match(/(mn|dn|sn|an|dhp|snp|ud|iti|vv|pv|thag|thig)\s?\d+([.\d-]+)?/i);
        if (match) suttaCode = match[0];
    } else {
        // Логика для обычного текста: точное слово под курсором
        let wordUnderCursor = "";
        
        if (document.caretRangeFromPoint) {
            const range = document.caretRangeFromPoint(event.clientX, event.clientY);
            if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
                const text = range.startContainer.textContent;
                const offset = range.startOffset;
                
                const start = text.lastIndexOf(' ', offset) + 1;
                let end = text.indexOf(' ', offset);
                if (end === -1) end = text.length;
                
                // Очистка от знаков препинания вокруг индекса
                wordUnderCursor = text.substring(start, end)
                    .replace(/[()\[\];,]/g, "")
                    .replace(/\.$/, "")
                    .trim();
            }
        }
        
        const match = wordUnderCursor.match(regex);
        if (match) suttaCode = match[0];
    }

    if (!suttaCode) return;

    suttaCode = suttaCode.toLowerCase().replace(/\s+/g, '');

    // ЛОГИКА S-ПАРАМЕТРА: только если клик внутри примера
    const exampleDiv = event.target.closest('[name="example-div"]');
    if (exampleDiv) {
        const boldElement = exampleDiv.querySelector('b');
        if (boldElement) {
            sParam = boldElement.textContent.trim()
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
                .replace(/ṃ/g, "ṁ") //
                .replace(/'/g, "");
        }
    }

    // Формирование URL с учетом языка
    const baseUrl = window.isRu ? 'https://dhamma.gift/ru/' : 'https://dhamma.gift/';
    
    // Если sParam пустой (не из примера), он не добавится в URL
    let finalUrl = `${baseUrl}?q=${suttaCode}`;
    if (sParam) {
        finalUrl += `&s=${encodeURIComponent(sParam)}`;
    }

    window.location.href = finalUrl;
});



// Используем анонимную функцию для изоляции области видимости
(function() {
    // Проверяем наличие необходимых элементов, чтобы не вызвать ошибку
    const hp = document.getElementById('history-pane') || (typeof historyPane !== 'undefined' ? historyPane : null);
    const sb = document.getElementById('search-box') || (typeof searchBox !== 'undefined' ? searchBox : null);

    if (hp && sb) {
        hp.addEventListener("click", function(event) {
            let target = event.target;
            // Проверяем, что кликнули именно по элементу списка (слову в истории)
            if (target.tagName.toLowerCase() === 'li') {
                const text = target.textContent.trim();
                if (text !== "") {
                    sb.value = text;
                    // handleFormSubmit должна быть глобально доступна из предыдущих файлов
                    if (typeof handleFormSubmit === 'function') {
                        handleFormSubmit(); 
                    }
                }
            }
        });
    }
})();

// Функция для обновления заголовка вкладки
function updateDocumentTitle(query) {
  const baseTitle = "DG Digital Pali Dictionary";
  
  if (query && query.trim() !== "") {
    document.title = query.trim() + " — DG DPD";
  } else {
    document.title = baseTitle;
  }
}

// Отдельный слушатель для инициализации заголовка страницы
document.addEventListener('DOMContentLoaded', function() {
  // 1. Проверяем URL на наличие параметра q при загрузке
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q');
  
  if (initialQuery) {
    updateDocumentTitle(initialQuery);
  }

  // 2. Вешаем обработчик на инпут для изменения на лету
  const searchBoxInput = document.getElementById('search-box');
  if (searchBoxInput) {
    searchBoxInput.addEventListener('input', function(event) {
      updateDocumentTitle(event.target.value);
    });
  }
});

// extra.js — Чистый скрипт для вашей HTML разметки (Блок Санскрита)

let lastSanskritQuery = '';
let waitingForFallback = null; 
let draggedDict = null; 

document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-box');
    const sanskritToggle = document.getElementById('sanskrit-toggle');

    if (sanskritToggle) {
        const savedState = localStorage.getItem('sanskritToggleState');
        if (savedState !== null) {
            sanskritToggle.checked = savedState === 'true';
        }
        
        sanskritToggle.addEventListener('change', () => {
            localStorage.setItem('sanskritToggleState', sanskritToggle.checked);
            const container = document.getElementById('sanskrit-results');
            
            if (sanskritToggle.checked) {
                if (container) container.style.display = 'block';
                lastSanskritQuery = ''; 
                runSanskritSearch();
            } else {
                if (container) container.style.display = 'none';
            }
        });
    }

    if (searchInput && searchInput.value.trim()) {
        runSanskritSearch();
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            setTimeout(runSanskritSearch, 200);
        });
    }

    document.addEventListener('click', (e) => {
        const moveBtn = e.target.closest('.dict-move-up, .dict-move-down');
        if (moveBtn) {
            e.stopPropagation(); 
            const wrapper = e.target.closest('.sanskrit-dict-wrapper');
            const parent = wrapper.parentNode;
            const isUp = moveBtn.classList.contains('dict-move-up');

            if (isUp && wrapper.previousElementSibling && wrapper.previousElementSibling.classList.contains('sanskrit-dict-wrapper')) {
                parent.insertBefore(wrapper, wrapper.previousElementSibling);
            } else if (!isUp && wrapper.nextElementSibling && wrapper.nextElementSibling.classList.contains('sanskrit-dict-wrapper')) {
                parent.insertBefore(wrapper.nextElementSibling, wrapper);
            }
            
            saveDictOrder(parent);
            return;
        }

        const dictHeader = e.target.closest('.sanskrit-dict-header');
        if (dictHeader) {
            const code = dictHeader.dataset.dictcode;
            const content = document.getElementById(`sanskrit-content-${code}`);
            const icon = dictHeader.querySelector('.dict-icon');
            
            if (content && icon) {
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
                icon.textContent = isHidden ? '▼' : '▶';
                
                let states = JSON.parse(localStorage.getItem('sanskritDictStates') || '{}');
                states[code] = !isHidden; 
                localStorage.setItem('sanskritDictStates', JSON.stringify(states));
            }
            return;
        }

        const toggleAllBtn = e.target.closest('#sanskrit-toggle-all');
        if (toggleAllBtn) {
            let states = JSON.parse(localStorage.getItem('sanskritDictStates') || '{}');
            const headers = document.querySelectorAll('.sanskrit-dict-header');
            
            let anyOpen = false;
            headers.forEach(h => {
                const code = h.dataset.dictcode;
                const content = document.getElementById(`sanskrit-content-${code}`);
                if (content && content.style.display !== 'none') anyOpen = true;
            });

            headers.forEach(h => {
                const code = h.dataset.dictcode;
                const content = document.getElementById(`sanskrit-content-${code}`);
                const icon = h.querySelector('.dict-icon');
                
                if (content && icon) {
                    if (anyOpen) {
                        content.style.display = 'none';
                        icon.textContent = '▶';
                        states[code] = true;
                    } else {
                        content.style.display = 'block';
                        icon.textContent = '▼';
                        states[code] = false;
                    }
                }
            });
            localStorage.setItem('sanskritDictStates', JSON.stringify(states));
            return;
        }

        if (e.target.closest('#dpd-pane') || e.target.closest('#history-pane')) {
            if (!e.target.closest('#sanskrit-results')) {
                setTimeout(runSanskritSearch, 300);
            }
        }
    });

    // --- Логика перетаскивания строго за ползунок ---
    
    // Включаем перетаскивание при нажатии на ползунок
    document.addEventListener('mousedown', (e) => {
        const handle = e.target.closest('.dict-drag-handle');
        if (handle) {
            const wrapper = handle.closest('.sanskrit-dict-wrapper');
            if (wrapper) wrapper.setAttribute('draggable', 'true');
        }
    });

    document.addEventListener('touchstart', (e) => {
        const handle = e.target.closest('.dict-drag-handle');
        if (handle) {
            const wrapper = handle.closest('.sanskrit-dict-wrapper');
            if (wrapper) wrapper.setAttribute('draggable', 'true');
        }
    }, { passive: true });

    // Отключаем перетаскивание при отпускании, чтобы снова работал текст
    const removeDraggable = () => {
        document.querySelectorAll('.sanskrit-dict-wrapper').forEach(w => w.removeAttribute('draggable'));
    };
    document.addEventListener('mouseup', removeDraggable);
    document.addEventListener('touchend', removeDraggable);

    document.addEventListener('dragstart', (e) => {
        const wrapper = e.target.closest('.sanskrit-dict-wrapper');
        // Проверяем, что атрибут был установлен именно нашим ползунком
        if (wrapper && wrapper.getAttribute('draggable') === 'true') {
            draggedDict = wrapper;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => wrapper.style.opacity = '0.4', 0);
        } else {
            e.preventDefault(); // Блокируем случайные срабатывания
        }
    });

    document.addEventListener('dragover', (e) => {
        if (!draggedDict) return;
        e.preventDefault(); 
        const overWrapper = e.target.closest('.sanskrit-dict-wrapper');
        
        if (overWrapper && overWrapper !== draggedDict) {
            const parent = overWrapper.parentNode;
            const rect = overWrapper.getBoundingClientRect();
            const insertAfter = (e.clientY - rect.top) > (rect.height / 2);
            
            if (insertAfter) {
                parent.insertBefore(draggedDict, overWrapper.nextSibling);
            } else {
                parent.insertBefore(draggedDict, overWrapper);
            }
        }
    });

    document.addEventListener('dragend', (e) => {
        if (draggedDict) {
            draggedDict.style.opacity = '1';
            draggedDict.removeAttribute('draggable');
            const parent = draggedDict.parentNode;
            draggedDict = null;
            if (parent) saveDictOrder(parent);
        }
        removeDraggable();
    });

    const dpdPane = document.getElementById('dpd-pane');
    if (dpdPane) {
        const observer = new MutationObserver(() => {
            const dpdResults = document.getElementById('dpd-results');
            if (dpdResults && dpdResults.dataset.stale === 'true') {
                dpdResults.dataset.stale = 'false';
            }
            
            if (waitingForFallback) {
                const query = waitingForFallback;
                waitingForFallback = null;
                const fallbackWord = getDpdSanskritFallback();
                
                if (fallbackWord && fallbackWord.toLowerCase() !== query.toLowerCase()) {
                    fetchSanskrit(fallbackWord, true);
                } else {
                    const container = document.getElementById('sanskrit-results');
                    if (container) showEmptyMessage(container, window.isRu, query, renderSanskritHeader(window.isRu, query, false));
                }
            }
        });
        observer.observe(dpdPane, { childList: true, subtree: true });
    }
});


function saveDictOrder(parentElement) {
    const wrappers = parentElement.querySelectorAll('.sanskrit-dict-wrapper');
    const newOrder = Array.from(wrappers).map(w => w.dataset.dictcode);
    let saved = JSON.parse(localStorage.getItem('sanskritDictOrder') || '[]');
    const updatedOrder = [...new Set([...newOrder, ...saved])];
    localStorage.setItem('sanskritDictOrder', JSON.stringify(updatedOrder));
}

function runSanskritSearch() {
    const searchInput = document.getElementById('search-box');
    const query = searchInput ? searchInput.value.trim() : '';

    if (query && query !== lastSanskritQuery) {
        lastSanskritQuery = query;
        waitingForFallback = null;
        
        const dpdResults = document.getElementById('dpd-results');
        if (dpdResults) dpdResults.dataset.stale = 'true';
        
        fetchSanskrit(query);
    } else if (!query && lastSanskritQuery !== '') {
        lastSanskritQuery = '';
        waitingForFallback = null;
        const container = document.getElementById('sanskrit-results');
        if (container) container.innerHTML = '';
    }
}

function highlightQuery(html, query) {
    if (!query) return html;
    
    const div = document.createElement('div');
    div.innerHTML = html;
    
    const chars = query.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // В регулярное выражение добавлены короткое тире (–), длинное тире (—) и горизонтальный штрих (―)
    const regex = new RegExp(`(${chars.join('[\\-\\.\\–\\—\\―\\~\\s]*')})`, 'gi');
    
    function traverse(node) {
        if (node.nodeType === 3) {
            const val = node.nodeValue;
            if (regex.test(val)) {
                const span = document.createElement('span');
                span.innerHTML = val.replace(regex, '<b style="color: #d35400;">$1</b>');
                node.parentNode.replaceChild(span, node);
            }
        } else if (node.nodeType === 1) {
            if (node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
                Array.from(node.childNodes).forEach(traverse);
            }
        }
    }
    
    Array.from(div.childNodes).forEach(traverse);
    return div.innerHTML;
}


function getDpdSanskritFallback() {
    const thElements = document.querySelectorAll('#dpd-results th');
    for (let th of thElements) {
        const headerText = th.textContent.trim().toLowerCase();
        
        if (headerText === 'sanskrit' || headerText === 'санскрит' || headerText === 'sanskrit root') {
            const td = th.nextElementSibling;
            if (td && td.tagName.toLowerCase() === 'td') {
                let text = td.innerText || td.textContent;
                text = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim(); 
                
                const words = text.split(/[\s,;+\/\-]+/);
                for (let word of words) {
                    const cleanWord = word.replace(/[^a-zA-ZāīūñṭḍṇṃṁḷśṣḥṛṝḷḹĀĪŪÑṬḌṆṂṀḶŚṢḤṚṜḶḸ√]/g, '');
                    const finalWord = cleanWord.replace('√', '');
                    if (finalWord.length > 0) return finalWord;
                }
            }
        }
    }
    return null;
}

// ===== FIX: Sanskrit header/collapse (override old broken functions) =====
function renderSanskritHeader(isRu, query, isFallback) {
    let headerText = isRu ? 'Санскрит' : 'Sanskrit';
    if (isFallback) {
        const fallbackNotice = isRu ? `слово: <b>${query}</b>` : `слово: <b>${query}</b>`;
        headerText += ` <span style="font-size: 0.8em; font-weight: normal; color: #666;">(${fallbackNotice})</span>`;
    }
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.2em; margin-bottom: 10px; color: #1a8bdb; border-bottom: 1px solid rgba(26, 139, 219, 0.3); padding-bottom: 5px;">
            <span style="font-weight: bold;">${headerText}</span>
            <button id="sanskrit-toggle-all" style="background:none; border:none; color:#999; font-size: 1.1em; font-weight:bold; cursor:pointer;" title="Toggle All">
                +/-
            </button>
        </div>`;
}

function showEmptyMessage(container, isRu, query, headerObj) {
    const msgEmpty = isRu
        ? `Санскритские параллели для «${query}» не найдены.`
        : `No Sanskrit parallels found for "${query}".`;

    container.innerHTML = `
        ${headerObj.headerHtml}
        <div class="ext-dict-content" style="display:${headerObj.displayStyle}; padding:10px; border:2px solid #1a8bdb; border-radius:8px; background:rgba(26,139,219,0.05);">
            <div style="opacity:.7;">${msgEmpty}</div>
        </div>
    `;
}

async function fetchSanskrit(query, isFallback = false) {
    const toggle = document.getElementById('sanskrit-toggle');
    let container = document.getElementById('sanskrit-results');

    if (!container) {
        const slot = document.getElementById('ext-slot-sanskrit');
        if (!slot) return;

        container = document.createElement('div');
        container.id = 'sanskrit-results';
        slot.appendChild(container);
    }

    if (toggle && !toggle.checked) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    container.style.marginTop = '0';
    container.style.marginBottom = '15px';
    container.style.padding = '0';
    container.style.border = 'none';
    container.style.borderRadius = '0';
    container.style.backgroundColor = 'transparent';
    container.style.color = 'inherit';

    const isRu = window.isRu;
    const headerObj = renderSanskritHeader(isRu, query, isFallback);

    const contentStyle = `display:${headerObj.displayStyle}; max-height:600px; overflow:auto; padding:10px; border:2px solid #1a8bdb; border-radius:8px; background:rgba(26,139,219,0.05);`;

    const msgLoading = isRu
        ? 'Загрузка словарей... <span style="filter: grayscale(100%); opacity: 0.8;">⏳</span>'
        : 'Loading dictionaries... <span style="filter: grayscale(100%); opacity: 0.8;">⏳</span>';

    if (!isFallback) {
        container.innerHTML = `
            ${headerObj.headerHtml}
            <div class="ext-dict-content" style="${contentStyle}">
                <div style="color:#666;">${msgLoading}</div>
            </div>
        `;
    }

    try {
        const cacheKey = query.trim().toLowerCase();
        let data;

        if (sanskritApiCache.has(cacheKey)) {
            data = sanskritApiCache.get(cacheKey);
        } else {
            const url = `https://www.sanskrit-lexicon.uni-koeln.de/scans/awork/apidev/api1/salt_multidict.php?key=${encodeURIComponent(query)}&input=roman&output=roman`;
            const response = await fetch(url);

            if (!response.ok) {
                const msgError = isRu
                    ? 'Произошла ошибка при обращении к словарю.'
                    : 'An error occurred while accessing the dictionary.';

                container.innerHTML = `
                    ${headerObj.headerHtml}
                    <div class="ext-dict-content" style="${contentStyle}">
                        <div style="color:#c08552; padding:10px; background:rgba(192,133,82,0.1); border-radius:5px;">
                            ⚠️ ${msgError} <span style="color:#999; font-size:0.9em;">(HTTP ${response.status})</span>
                        </div>
                    </div>
                `;
                return;
            }

            data = await response.json();
            sanskritApiCache.set(cacheKey, data);
        }

        let hasResults = false;
        let innerHtml = '';
        const dictStates = JSON.parse(localStorage.getItem('sanskritDictStates') || '{}');

        if (data.dicts && Object.keys(data.dicts).length > 0) {
            const availableCodes = Object.keys(data.dicts);
            const savedOrder = JSON.parse(localStorage.getItem('sanskritDictOrder') || '[]');
            const nameCounts = {};

            availableCodes.forEach(code => {
                if (!data.dicts[code] || data.dicts[code].length === 0) return;

                const name = (data.dictmeta && data.dictmeta[code] && data.dictmeta[code].name)
                    ? data.dictmeta[code].name
                    : code.toUpperCase();

                nameCounts[name] = (nameCounts[name] || 0) + 1;
            });

            const prefixes = ['mw', 'shs', 'ap', 'md'];
            const defaultOrder = [];

            prefixes.forEach(prefix => {
                const matches = availableCodes.filter(code => code.startsWith(prefix)).sort();
                defaultOrder.push(...matches);
            });

            const remainingCodes = availableCodes.filter(code => !defaultOrder.includes(code)).sort();
            const baseOrder = [...defaultOrder, ...remainingCodes];
            const finalOrder = savedOrder.filter(code => availableCodes.includes(code));

            baseOrder.forEach(code => {
                if (!finalOrder.includes(code) && availableCodes.includes(code)) {
                    finalOrder.push(code);
                }
            });

            finalOrder.forEach(dictCode => {
                const entries = data.dicts[dictCode];
                if (!entries || entries.length === 0) return;

                hasResults = true;

                let dictName = (data.dictmeta && data.dictmeta[dictCode] && data.dictmeta[dictCode].name)
                    ? data.dictmeta[dictCode].name
                    : dictCode.toUpperCase();

                if (nameCounts[dictName] > 1) {
                    const year = (data.dictmeta && data.dictmeta[dictCode] && data.dictmeta[dictCode].year)
                        ? data.dictmeta[dictCode].year + ', '
                        : '';

                    dictName += ` <span style="font-weight:normal; font-size:0.9em; color:#888;">(${year}${dictCode})</span>`;
                }

                const isCollapsed = dictStates[dictCode] === true;
                const icon = isCollapsed ? '▶' : '▼';
                const displayStyle = isCollapsed ? 'none' : 'block';

                innerHtml += `
                    <div class="sanskrit-dict-wrapper" data-dictcode="${dictCode}" style="margin-bottom:5px;">
                        <div class="sanskrit-dict-header" data-dictcode="${dictCode}" style="display:flex; justify-content:space-between; font-weight:bold; margin-top:10px; margin-bottom:5px; color:#1a8bdb; cursor:pointer; user-select:none;">
                            <div>
                                <span class="dict-icon" style="display:inline-block; width:18px;">${icon}</span> ${dictName}:
                            </div>
                            <div style="min-width:75px; text-align:right; color:#999; display:flex; justify-content:flex-end; align-items:center;">
                                <button type="button" class="dict-move-up" style="background:none; border:none; cursor:pointer; color:#999; padding:0 3px;" title="Up">↑</button>
                                <button type="button" class="dict-move-down" style="background:none; border:none; cursor:pointer; color:#999; padding:0 3px;" title="Down">↓</button>
                                <span class="dict-drag-handle" style="cursor:grab; margin-left:8px; color:#999; font-size:1.1em; touch-action:none;" title="Drag to reorder" onclick="event.stopPropagation();">☰</span>
                            </div>
                        </div>
                        <div class="sanskrit-dict-content" id="sanskrit-content-${dictCode}" style="display:${displayStyle};">
                `;

                entries.forEach(entry => {
                    if (entry.csl && entry.csl.html) {
                        const highlightedHtml = highlightQuery(entry.csl.html, query);
                        innerHtml += `<div style="margin-bottom:8px; padding-left:8px; border-left:3px solid #1a8bdb;">${highlightedHtml}</div>`;
                    }
                });

                innerHtml += `</div></div>`;
            });
        }

        if (!hasResults) {
            if (!isFallback) {
                const dpdResults = document.getElementById('dpd-results');
                const isStale = dpdResults ? dpdResults.dataset.stale === 'true' : false;

                if (isStale) {
                    waitingForFallback = query;
                    return;
                }

                const fallbackWord = getDpdSanskritFallback();
                if (fallbackWord && fallbackWord.toLowerCase() !== query.toLowerCase()) {
                    return fetchSanskrit(fallbackWord, true);
                }
            }

            showEmptyMessage(container, isRu, query, headerObj);
            return;
        }

        container.innerHTML = `
            ${headerObj.headerHtml}
            <div class="ext-dict-content" style="${contentStyle}">
                ${innerHtml}
            </div>
        `;
    } catch (error) {
        console.error('Ошибка санскрита:', error);

        const msgNetworkError = isRu
            ? 'Не удалось загрузить данные санскрита из-за ошибки сети.'
            : 'Failed to load Sanskrit data due to a network error.';

        container.innerHTML = `
            ${headerObj.headerHtml}
            <div class="ext-dict-content" style="${contentStyle}">
                <div style="color:#c08552; padding:10px; background:rgba(192,133,82,0.1); border-radius:5px;">
                    ⚠️ ${msgNetworkError} <span style="color:#999; font-size:0.9em;">(${error.message})</span>
                </div>
            </div>
        `;
    }
}

// Отдельный обработчик для кнопки +/- внутри заголовка санскрита.
// Используется capture-фаза, чтобы клик по +/- не сворачивал весь блок санскрита.
document.addEventListener('click', function(e) {
    const toggleAllBtn = e.target.closest('#sanskrit-toggle-all');
    if (!toggleAllBtn) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    let states = JSON.parse(localStorage.getItem('sanskritDictStates') || '{}');
    const headers = document.querySelectorAll('.sanskrit-dict-header');

    let anyOpen = false;

    headers.forEach(h => {
        const code = h.dataset.dictcode;
        const content = document.getElementById(`sanskrit-content-${code}`);
        if (content && content.style.display !== 'none') {
            anyOpen = true;
        }
    });

    headers.forEach(h => {
        const code = h.dataset.dictcode;
        const content = document.getElementById(`sanskrit-content-${code}`);
        const icon = h.querySelector('.dict-icon');

        if (content && icon) {
            if (anyOpen) {
                content.style.display = 'none';
                icon.textContent = '▶';
                states[code] = true;
            } else {
                content.style.display = 'block';
                icon.textContent = '▼';
                states[code] = false;
            }
        }
    });

    localStorage.setItem('sanskritDictStates', JSON.stringify(states));
}, true);

function showEmptyMessage(container, isRu, query, headerHtml) {
    const msgEmpty = isRu ? `Санскритские параллели для «${query}» не найдены.` : `No Sanskrit parallels found for "${query}".`;
    container.innerHTML = headerHtml + `<div class="ext-dict-content"><div style="opacity: 0.7; padding: 5px;">${msgEmpty}</div></div>`;
}

async function fetchSanskrit(query, isFallback = false) {
    const slot = document.getElementById('ext-slot-sanskrit');
    const toggle = document.getElementById('sanskrit-toggle');
    
    if (!slot) return;

    if (toggle && !toggle.checked) {
        slot.style.display = 'none';
        return; 
    }

    slot.style.display = 'block';
    slot.style.marginBottom = '15px';

    // Внутренний контейнер для санскрита, если его еще нет в слоте
    let container = document.getElementById('sanskrit-results');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sanskrit-results';
        slot.appendChild(container);
    }

    const isRu = window.isRu;
    const headerHtml = renderSanskritHeader(isRu, query, isFallback);
    const msgLoading = isRu ? 'Загрузка словарей... <span style="filter: grayscale(100%); opacity: 0.8;">⏳</span>' : 'Loading dictionaries... <span style="filter: grayscale(100%); opacity: 0.8;">⏳</span>';
    
    if (!isFallback) {
        container.innerHTML = headerHtml + `<div class="ext-dict-content"><div style="color: #666; padding: 5px;">${msgLoading}</div></div>`;
    }

    try {
        const cacheKey = query.trim().toLowerCase();
        let data;

        if (sanskritApiCache.has(cacheKey)) {
            data = sanskritApiCache.get(cacheKey);
        } else {
            const url = `https://www.sanskrit-lexicon.uni-koeln.de/scans/awork/apidev/api1/salt_multidict.php?key=${encodeURIComponent(query)}&input=roman&output=roman`;
            const response = await fetch(url);
            
            if (!response.ok) {
                const msgError = isRu ? 'Произошла ошибка при обращении к словарю.' : 'An error occurred while accessing the dictionary.';
                container.innerHTML = headerHtml + `
                <div class="ext-dict-content">
                    <div style="color: #c08552; padding: 10px; background: rgba(192, 133, 82, 0.1); border-radius: 5px;">
                        ⚠️ ${msgError} <span style="color: #999; font-size: 0.9em;">(HTTP ${response.status})</span>
                    </div>
                </div>`;
                return;
            }

            data = await response.json();
            sanskritApiCache.set(cacheKey, data);
        }

        let htmlContent = headerHtml + '<div class="ext-dict-content" style="padding: 5px 0;">';
        let hasResults = false;
        
        const dictStates = JSON.parse(localStorage.getItem('sanskritDictStates') || '{}');
        
        if (data.dicts && Object.keys(data.dicts).length > 0) {
            const availableCodes = Object.keys(data.dicts);
            let savedOrder = JSON.parse(localStorage.getItem('sanskritDictOrder') || '[]');
            
            const nameCounts = {};
            availableCodes.forEach(code => {
                if (!data.dicts[code] || data.dicts[code].length === 0) return;
                const name = (data.dictmeta && data.dictmeta[code] && data.dictmeta[code].name) ? data.dictmeta[code].name : code.toUpperCase();
                nameCounts[name] = (nameCounts[name] || 0) + 1;
            });

            const prefixes = ['mw', 'shs', 'ap', 'md'];
            let defaultOrder = [];
            
            prefixes.forEach(prefix => {
                const matches = availableCodes.filter(code => code.startsWith(prefix)).sort();
                defaultOrder.push(...matches);
            });

            const remainingCodes = availableCodes.filter(code => !defaultOrder.includes(code)).sort();
            const baseOrder = [...defaultOrder, ...remainingCodes];

            let finalOrder = savedOrder.filter(code => availableCodes.includes(code));
            baseOrder.forEach(code => {
                if (!finalOrder.includes(code) && availableCodes.includes(code)) {
                    finalOrder.push(code);
                }
            });

            finalOrder.forEach(dictCode => {
                const entries = data.dicts[dictCode];
                if (!entries || entries.length === 0) return;

                hasResults = true;
                let dictName = (data.dictmeta && data.dictmeta[dictCode] && data.dictmeta[dictCode].name) 
                    ? data.dictmeta[dictCode].name 
                    : dictCode.toUpperCase();
                
                if (nameCounts[dictName] > 1) {
                    const year = (data.dictmeta && data.dictmeta[dictCode] && data.dictmeta[dictCode].year) ? data.dictmeta[dictCode].year + ', ' : '';
                    dictName += ` <span style="font-weight: normal; font-size: 0.9em; color: #888;">(${year}${dictCode})</span>`;
                }
                
                const isCollapsed = dictStates[dictCode] === true;
                const icon = isCollapsed ? '▶' : '▼';
                const displayStyle = isCollapsed ? 'none' : 'block';

                htmlContent += `
                    <div class="sanskrit-dict-wrapper" data-dictcode="${dictCode}" style="margin-bottom: 5px;">
                        <div class="sanskrit-dict-header" data-dictcode="${dictCode}" style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; margin-bottom: 5px; color: #1a8bdb; cursor: pointer; user-select: none;">
                            <div>
                                <span class="dict-icon" style="display:inline-block; width:18px;">${icon}</span> ${dictName}:
                            </div>
                            <div style="min-width: 75px; text-align: right; color: #999; display: flex; justify-content: flex-end; align-items: center;" onclick="event.stopPropagation();">
                                <button class="dict-move-up" style="background:none; border:none; cursor:pointer; color:#999; padding: 0 3px;" title="Up">↑</button>
                                <button class="dict-move-down" style="background:none; border:none; cursor:pointer; color:#999; padding: 0 3px;" title="Down">↓</button>
                                <span class="dict-drag-handle" style="cursor: grab; margin-left: 8px; color: #999; font-size: 1.1em; touch-action: none;" title="Drag to reorder">☰</span>
                            </div>
                        </div>
                        <div class="sanskrit-dict-content" id="sanskrit-content-${dictCode}" style="display: ${displayStyle};">`;
                
                entries.forEach(entry => {
                    if (entry.csl && entry.csl.html) {
                        const highlightedHtml = highlightQuery(entry.csl.html, query);
                        htmlContent += `<div style="margin-bottom: 8px; padding-left: 8px; border-left: 3px solid #1a8bdb;">${highlightedHtml}</div>`;
                    }
                });
                
                htmlContent += `</div></div>`;
            });
        }

        if (!hasResults) {
            if (!isFallback) {
                const dpdResults = document.getElementById('dpd-results');
                const isStale = dpdResults ? dpdResults.dataset.stale === 'true' : false;
                
                if (isStale) {
                    waitingForFallback = query;
                    return;
                } else {
                    const fallbackWord = getDpdSanskritFallback();
                    if (fallbackWord && fallbackWord.toLowerCase() !== query.toLowerCase()) {
                        return fetchSanskrit(fallbackWord, true);
                    }
                }
            }
            
            showEmptyMessage(container, isRu, query, headerHtml);
        } else {
            htmlContent += '</div>';
            container.innerHTML = htmlContent;
        }

    } catch (error) {
        console.error("Ошибка санскрита:", error);
        const msgNetworkError = isRu ? 'Не удалось загрузить данные санскрита из-за ошибки сети.' : 'Failed to load Sanskrit data due to a network error.';
        container.innerHTML = headerHtml + `
        <div class="ext-dict-content">
            <div style="color: #c08552; padding: 10px; background: rgba(192, 133, 82, 0.1); border-radius: 5px;">
                ⚠️ ${msgNetworkError} <span style="color: #999; font-size: 0.9em;">(${error.message})</span>
            </div>
        </div>`;
    }
}

function showEmptyMessage(container, isRu, query, headerHtml) {
    const msgEmpty = isRu ? `Санскритские параллели для «${query}» не найдены.` : `No Sanskrit parallels found for "${query}".`;
    container.innerHTML = headerHtml + `<div class="ext-dict-content"><div style="opacity: 0.7;">${msgEmpty}</div></div>`;
}

async function fetchSanskrit(query, isFallback = false) {
    const container = document.getElementById('sanskrit-results');
    const toggle = document.getElementById('sanskrit-toggle');
    
    if (!container) return;

    if (toggle && !toggle.checked) {
        container.style.display = 'none';
        return; 
    }

    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    container.style.marginTop = '15px';
    container.style.padding = '12px';
    container.style.border = '2px solid #1a8bdb';
    container.style.borderRadius = '8px';
    container.style.backgroundColor = 'rgba(26, 139, 219, 0.05)';
    container.style.color = 'inherit';

    const isRu = window.isRu;
    const headerHtml = renderSanskritHeader(isRu, query, isFallback);
    
    const msgLoading = isRu ? 'Загрузка словарей... <span style="filter: grayscale(100%); opacity: 0.8;">⏳</span>' : 'Loading dictionaries... <span style="filter: grayscale(100%); opacity: 0.8;">⏳</span>';
    
    if (!isFallback) {
        container.innerHTML = headerHtml + `<div class="ext-dict-content"><div style="color: #666;">${msgLoading}</div></div>`;
    }

    try {
        const cacheKey = query.trim().toLowerCase();
        let data;

        if (sanskritApiCache.has(cacheKey)) {
            data = sanskritApiCache.get(cacheKey);
        } else {
            const url = `https://www.sanskrit-lexicon.uni-koeln.de/scans/awork/apidev/api1/salt_multidict.php?key=${encodeURIComponent(query)}&input=roman&output=roman`;
            const response = await fetch(url);
            
            if (!response.ok) {
                const msgError = isRu ? 'Произошла ошибка при обращении к словарю.' : 'An error occurred while accessing the dictionary.';
                container.innerHTML = headerHtml + `
                <div class="ext-dict-content">
                    <div style="color: #c08552; padding: 10px; background: rgba(192, 133, 82, 0.1); border-radius: 5px;">
                        ⚠️ ${msgError} <span style="color: #999; font-size: 0.9em;">(HTTP ${response.status})</span>
                    </div>
                </div>`;
                return;
            }

            data = await response.json();
            sanskritApiCache.set(cacheKey, data);
        }

        let htmlContent = headerHtml + '<div class="ext-dict-content">';
        let hasResults = false;
        
        const dictStates = JSON.parse(localStorage.getItem('sanskritDictStates') || '{}');
        
        if (data.dicts && Object.keys(data.dicts).length > 0) {
            const availableCodes = Object.keys(data.dicts);
            let savedOrder = JSON.parse(localStorage.getItem('sanskritDictOrder') || '[]');
            
            const nameCounts = {};
            availableCodes.forEach(code => {
                if (!data.dicts[code] || data.dicts[code].length === 0) return;
                const name = (data.dictmeta && data.dictmeta[code] && data.dictmeta[code].name) ? data.dictmeta[code].name : code.toUpperCase();
                nameCounts[name] = (nameCounts[name] || 0) + 1;
            });

            const prefixes = ['mw', 'shs', 'ap', 'md'];
            let defaultOrder = [];
            
            prefixes.forEach(prefix => {
                const matches = availableCodes.filter(code => code.startsWith(prefix)).sort();
                defaultOrder.push(...matches);
            });

            const remainingCodes = availableCodes.filter(code => !defaultOrder.includes(code)).sort();
            const baseOrder = [...defaultOrder, ...remainingCodes];

            let finalOrder = savedOrder.filter(code => availableCodes.includes(code));
            baseOrder.forEach(code => {
                if (!finalOrder.includes(code) && availableCodes.includes(code)) {
                    finalOrder.push(code);
                }
            });

            finalOrder.forEach(dictCode => {
                const entries = data.dicts[dictCode];
                if (!entries || entries.length === 0) return;

                hasResults = true;
                let dictName = (data.dictmeta && data.dictmeta[dictCode] && data.dictmeta[dictCode].name) 
                    ? data.dictmeta[dictCode].name 
                    : dictCode.toUpperCase();
                
                if (nameCounts[dictName] > 1) {
                    const year = (data.dictmeta && data.dictmeta[dictCode] && data.dictmeta[dictCode].year) ? data.dictmeta[dictCode].year + ', ' : '';
                    dictName += ` <span style="font-weight: normal; font-size: 0.9em; color: #888;">(${year}${dictCode})</span>`;
                }
                
                const isCollapsed = dictStates[dictCode] === true;
                const icon = isCollapsed ? '▶' : '▼';
                const displayStyle = isCollapsed ? 'none' : 'block';

                htmlContent += `
                    <div class="sanskrit-dict-wrapper" data-dictcode="${dictCode}" style="margin-bottom: 5px;">
                        <div class="sanskrit-dict-header" data-dictcode="${dictCode}" style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; margin-bottom: 5px; color: #1a8bdb; cursor: pointer; user-select: none;">
                            <div>
                                <span class="dict-icon" style="display:inline-block; width:18px;">${icon}</span> ${dictName}:
                            </div>
                            <div style="min-width: 75px; text-align: right; color: #999; display: flex; justify-content: flex-end; align-items: center;" onclick="event.stopPropagation();">
                                <button class="dict-move-up" style="background:none; border:none; cursor:pointer; color:#999; padding: 0 3px;" title="Up">↑</button>
                                <button class="dict-move-down" style="background:none; border:none; cursor:pointer; color:#999; padding: 0 3px;" title="Down">↓</button>
                                <span class="dict-drag-handle" style="cursor: grab; margin-left: 8px; color: #999; font-size: 1.1em; touch-action: none;" title="Drag to reorder">☰</span>
                            </div>
                        </div>
                        <div class="sanskrit-dict-content" id="sanskrit-content-${dictCode}" style="display: ${displayStyle};">`;
                
                entries.forEach(entry => {
                    if (entry.csl && entry.csl.html) {
                        const highlightedHtml = highlightQuery(entry.csl.html, query);
                        htmlContent += `<div style="margin-bottom: 8px; padding-left: 8px; border-left: 3px solid #1a8bdb;">${highlightedHtml}</div>`;
                    }
                });
                
                htmlContent += `</div></div>`;
            });
        }

        if (!hasResults) {
            if (!isFallback) {
                const dpdResults = document.getElementById('dpd-results');
                const isStale = dpdResults ? dpdResults.dataset.stale === 'true' : false;
                
                if (isStale) {
                    waitingForFallback = query;
                    return;
                } else {
                    const fallbackWord = getDpdSanskritFallback();
                    if (fallbackWord && fallbackWord.toLowerCase() !== query.toLowerCase()) {
                        return fetchSanskrit(fallbackWord, true);
                    }
                }
            }
            
            showEmptyMessage(container, isRu, query, headerHtml);
        } else {
            htmlContent += '</div>';
            container.innerHTML = htmlContent;
        }

    } catch (error) {
        console.error("Ошибка санскрита:", error);
        const msgNetworkError = isRu ? 'Не удалось загрузить данные санскрита из-за ошибки сети.' : 'Failed to load Sanskrit data due to a network error.';
        container.innerHTML = headerHtml + `
        <div class="ext-dict-content">
            <div style="color: #c08552; padding: 10px; background: rgba(192, 133, 82, 0.1); border-radius: 5px;">
                ⚠️ ${msgNetworkError} <span style="color: #999; font-size: 0.9em;">(${error.message})</span>
            </div>
        </div>`;
    }
}

function showEmptyMessage(container, isRu, query, headerHtml) {
    const msgEmpty = isRu ? `Санскритские параллели для «${query}» не найдены.` : `No Sanskrit parallels found for "${query}".`;
    container.innerHTML = headerHtml + `<div style="opacity: 0.7;">${msgEmpty}</div>`;
}

const sanskritApiCache = new Map();

async function fetchSanskrit(query, isFallback = false) {
    const container = document.getElementById('sanskrit-results');
    const toggle = document.getElementById('sanskrit-toggle');
    
    if (!container) return;

    if (toggle && !toggle.checked) {
        container.style.display = 'none';
        return; 
    }

    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    container.style.marginTop = '15px';
    container.style.padding = '12px';
    container.style.border = '2px solid #1a8bdb';
    container.style.borderRadius = '8px';
    container.style.backgroundColor = 'rgba(26, 139, 219, 0.05)';
    container.style.color = 'inherit';

    const isRu = window.isRu;
    const headerHtml = renderSanskritHeader(isRu, query, isFallback);
    
    // Обернули эмодзи в span с фильтром обесцвечивания
    const msgLoading = isRu ? 'Загрузка словарей... <span style="filter: grayscale(100%); opacity: 0.8;">⏳</span>' : 'Loading dictionaries... <span style="filter: grayscale(100%); opacity: 0.8;">⏳</span>';
    
    if (!isFallback) {
        container.innerHTML = headerHtml + `<div style="color: #666;">${msgLoading}</div>`;
    }

    try {
        const cacheKey = query.trim().toLowerCase();
        let data;

        // Проверяем наличие ответа в кэше
        if (sanskritApiCache.has(cacheKey)) {
            data = sanskritApiCache.get(cacheKey);
        } else {
            const url = `https://www.sanskrit-lexicon.uni-koeln.de/scans/awork/apidev/api1/salt_multidict.php?key=${encodeURIComponent(query)}&input=roman&output=roman`;
            const response = await fetch(url);
            
            if (!response.ok) {
                const msgError = isRu ? 'Произошла ошибка при обращении к словарю.' : 'An error occurred while accessing the dictionary.';
                container.innerHTML = headerHtml + `
                <div style="color: #c08552; padding: 10px; background: rgba(192, 133, 82, 0.1); border-radius: 5px;">
                    ⚠️ ${msgError} <span style="color: #999; font-size: 0.9em;">(HTTP ${response.status})</span>
                </div>`;
                return;
            }

            data = await response.json();
            // Сохраняем успешный ответ в кэш
            sanskritApiCache.set(cacheKey, data);
        }

        let htmlContent = headerHtml;
        let hasResults = false;
        
        const dictStates = JSON.parse(localStorage.getItem('sanskritDictStates') || '{}');
        
        if (data.dicts && Object.keys(data.dicts).length > 0) {
            const availableCodes = Object.keys(data.dicts);
            let savedOrder = JSON.parse(localStorage.getItem('sanskritDictOrder') || '[]');
            
            const nameCounts = {};
            availableCodes.forEach(code => {
                if (!data.dicts[code] || data.dicts[code].length === 0) return;
                const name = (data.dictmeta && data.dictmeta[code] && data.dictmeta[code].name) ? data.dictmeta[code].name : code.toUpperCase();
                nameCounts[name] = (nameCounts[name] || 0) + 1;
            });

            const prefixes = ['mw', 'shs', 'ap', 'md'];
            let defaultOrder = [];
            
            prefixes.forEach(prefix => {
                const matches = availableCodes.filter(code => code.startsWith(prefix)).sort();
                defaultOrder.push(...matches);
            });

            const remainingCodes = availableCodes.filter(code => !defaultOrder.includes(code)).sort();
            const baseOrder = [...defaultOrder, ...remainingCodes];

            let finalOrder = savedOrder.filter(code => availableCodes.includes(code));
            baseOrder.forEach(code => {
                if (!finalOrder.includes(code) && availableCodes.includes(code)) {
                    finalOrder.push(code);
                }
            });

            finalOrder.forEach(dictCode => {
                const entries = data.dicts[dictCode];
                if (!entries || entries.length === 0) return;

                hasResults = true;
                let dictName = (data.dictmeta && data.dictmeta[dictCode] && data.dictmeta[dictCode].name) 
                    ? data.dictmeta[dictCode].name 
                    : dictCode.toUpperCase();
                
                if (nameCounts[dictName] > 1) {
                    const year = (data.dictmeta && data.dictmeta[dictCode] && data.dictmeta[dictCode].year) ? data.dictmeta[dictCode].year + ', ' : '';
                    dictName += ` <span style="font-weight: normal; font-size: 0.9em; color: #888;">(${year}${dictCode})</span>`;
                }
                
                const isCollapsed = dictStates[dictCode] === true;
                const icon = isCollapsed ? '▶' : '▼';
                const displayStyle = isCollapsed ? 'none' : 'block';

                htmlContent += `
                    <div class="sanskrit-dict-wrapper" data-dictcode="${dictCode}" style="margin-bottom: 5px;">
                        <div class="sanskrit-dict-header" data-dictcode="${dictCode}" style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; margin-bottom: 5px; color: #1a8bdb; cursor: pointer; user-select: none;">
                            <div>
                                <span class="dict-icon" style="display:inline-block; width:18px;">${icon}</span> ${dictName}:
                            </div>
                            <div style="min-width: 75px; text-align: right; color: #999; display: flex; justify-content: flex-end; align-items: center;">
                                <button class="dict-move-up" style="background:none; border:none; cursor:pointer; color:#999; padding: 0 3px;" title="Up">↑</button>
                                <button class="dict-move-down" style="background:none; border:none; cursor:pointer; color:#999; padding: 0 3px;" title="Down">↓</button>
                                <span class="dict-drag-handle" style="cursor: grab; margin-left: 8px; color: #999; font-size: 1.1em; touch-action: none;" title="Drag to reorder">☰</span>
                            </div>
                        </div>
                        <div class="sanskrit-dict-content" id="sanskrit-content-${dictCode}" style="display: ${displayStyle};">`;
                
                entries.forEach(entry => {
                    if (entry.csl && entry.csl.html) {
                        const highlightedHtml = highlightQuery(entry.csl.html, query);
                        htmlContent += `<div style="margin-bottom: 8px; padding-left: 8px; border-left: 3px solid #1a8bdb;">${highlightedHtml}</div>`;
                    }
                });
                
                htmlContent += `</div></div>`;
            });
        }

        if (!hasResults) {
            if (!isFallback) {
                const dpdResults = document.getElementById('dpd-results');
                const isStale = dpdResults ? dpdResults.dataset.stale === 'true' : false;
                
                if (isStale) {
                    waitingForFallback = query;
                    return;
                } else {
                    const fallbackWord = getDpdSanskritFallback();
                    if (fallbackWord && fallbackWord.toLowerCase() !== query.toLowerCase()) {
                        return fetchSanskrit(fallbackWord, true);
                    }
                }
            }
            
            showEmptyMessage(container, isRu, query, headerHtml);
        } else {
            container.innerHTML = htmlContent;
        }

    } catch (error) {
        console.error("Ошибка санскрита:", error);
        const msgNetworkError = isRu ? 'Не удалось загрузить данные санскрита из-за ошибки сети.' : 'Failed to load Sanskrit data due to a network error.';
        container.innerHTML = headerHtml + `
        <div style="color: #c08552; padding: 10px; background: rgba(192, 133, 82, 0.1); border-radius: 5px;">
            ⚠️ ${msgNetworkError} <span style="color: #999; font-size: 0.9em;">(${error.message})</span>
        </div>`;
    }
}

// ===== КЛИЕНТСКАЯ ЛОГИКА ПОИСКА (ЗАМЕНА MAIN.PY) =====

const ENDPOINTS = {
    en: { baseUrl: 'https://dpdict.net', searchPath: '/search_json' },
    ru: { baseUrl: 'https://ru.dpdict.net', searchPath: '/search_json' }
};

function cleanQueryParam(original) {
    let cleaned = original.replace(/https?:\/\/\S+/g, '');
    cleaned = cleaned.replace(/["'()[\]·]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.trim().toLowerCase();
    
    // Исправление неправильной раскладки для сутт (русские буквы + цифры)
    if (/[а-яё]/.test(cleaned) && /\d/.test(cleaned)) {
        const ruToEn = {
            'а': 'f', 'в': 'd', 'е': 't', 'к': 'r', 'м': 'v',
            'н': 'y', 'о': 'j', 'п': 'g', 'р': 'h', 'с': 'c',
            'т': 'n', 'у': 'e', 'х': '[', 'ъ': ']', 'ы': 's',
            'ь': 'm', 'э': "'", 'ё': '`', 'я': 'z', 'ж': ';',
            'з': 'p', 'и': 'b', 'й': 'q', 'л': 'k', 'д': 'l',
            'г': 'u', 'ф': 'a', 'ц': 'w', 'ч': 'x', 'ш': 'i',
            'щ': 'o', 'б': ',', 'ю': '.', ' ': ' '
        };
        let converted = '';
        for (let i = 0; i < cleaned.length; i++) {
            converted += ruToEn[cleaned[i]] || cleaned[i];
        }
        
        // Ограничиваем конвертацию только паттернами сутт
        if (/^(dn|mn|sn|an|dhp|snp|ud|iti|thag|thig|vv|pv)/.test(converted)) {
            cleaned = converted;
        }
    }
    
    // Нормализация пробелов и точек
    cleaned = cleaned.replace(/([a-z]+)\s+(\d+)\s+(\d+)/g, "$1$2.$3")
                     .replace(/([a-z]+)(\d+)\s+(\d+)/g, "$1$2.$3")
                     .replace(/([a-z]+)\s+(\d+)\.(\d+)/g, "$1$2.$3")
                     .replace(/([a-z]+)\s+(\d+)/g, "$1$2");

    return cleaned;
}

async function fetchFromBackend(query, currentLang, tryFallback = true) {
    let lang = currentLang;

    if (tryFallback && /[а-яА-ЯёЁ]/.test(query)) {
        lang = 'ru';
        tryFallback = false;
    }

    const config = ENDPOINTS[lang];
    const url = new URL(config.baseUrl + config.searchPath);
    url.searchParams.set('q', query);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (tryFallback && !data.dpd_html) {
        const fallbackLang = lang === 'en' ? 'ru' : 'en';
        const fallbackData = await fetchFromBackend(query, fallbackLang, false);
        if (fallbackData && fallbackData.dpd_html) {
            return fallbackData;
        }
    }
    return data;
}


document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchBox = document.getElementById('search-box');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (searchBox && searchBox.value) {
                handleClientSearch(searchBox.value);
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');
    if (initialQuery) {
        if (searchBox) searchBox.value = initialQuery;
        handleClientSearch(initialQuery);
    }
});

// ===== ПЕРЕХВАТ И ИСПРАВЛЕНИЕ ДВОЙНОГО КЛИКА ИЗ HOME.JS =====
document.addEventListener('DOMContentLoaded', () => {
    const dpdPane = document.getElementById("dpd-pane");
    const historyPane = document.getElementById("history-pane");

    // 1. Отписываемся от старых функций, если они существуют в глобальной области
    if (typeof processSelection === 'function') {
        if (dpdPane) dpdPane.removeEventListener("dblclick", processSelection);
        if (historyPane) historyPane.removeEventListener("dblclick", processSelection);
    }
    
    if (typeof handleTouchEnd === 'function') {
        if (dpdPane) dpdPane.removeEventListener("touchend", handleTouchEnd);
        if (historyPane) historyPane.removeEventListener("touchend", handleTouchEnd);
    }

    // 2. Новая функция для обработки выделения (с поддержкой санскрита)
    function executeSelectionSearch() {
        let selection = window.getSelection().toString().trim();
        
        // Очищаем от знаков препинания по краям, оставляя юникод-буквы, диакритику и корень
        selection = selection.replace(/^[^\p{L}\p{M}√]+|[^\p{L}\p{M}√]+$/gu, "");
        
        if (selection !== "") {
            const searchBox = document.getElementById('search-box');
            if (searchBox) searchBox.value = selection;
            
            // Вызываем нашу новую клиентскую логику
            if (typeof handleClientSearch === 'function') {
                handleClientSearch(selection);
                
                // Явно дёргаем поиск санскрита
                if (typeof runSanskritSearch === 'function') {
                    setTimeout(runSanskritSearch, 200);
                }
            }
        }
    }

    // 3. Новый обработчик для двойного тапа на мобильных
    let tapTime = 0;
    function newHandleTouchEnd(event) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - tapTime;

        if (tapLength < 300 && tapLength > 0) {
            event.preventDefault();
            executeSelectionSearch();
        }
        tapTime = currentTime;
    }

    // 4. Навешиваем новые правильные слушатели
    if (dpdPane) {
        dpdPane.addEventListener("dblclick", executeSelectionSearch);
        dpdPane.addEventListener("touchend", newHandleTouchEnd);
    }
    if (historyPane) {
        historyPane.addEventListener("dblclick", executeSelectionSearch);
        historyPane.addEventListener("touchend", newHandleTouchEnd);
    }

    // 5. Глушим старую логику отправки формы из home.js, чтобы избежать конфликтов и спиннера
    if (typeof handleFormSubmit === 'function') {
        const formObj = document.getElementById("search-form");
        const btnObj = document.getElementById("search-button");
        
        if (formObj) formObj.removeEventListener("submit", handleFormSubmit);
        if (btnObj) btnObj.removeEventListener("submit", handleFormSubmit);
        if (btnObj) btnObj.removeEventListener("click", handleFormSubmit);
        
        // Подменяем глобальную функцию для других скриптов, которые её вызывают
        window.handleFormSubmit = function(event) {
            if (event) event.preventDefault();
            const searchBox = document.getElementById('search-box');
            if (searchBox && searchBox.value) {
                handleClientSearch(searchBox.value);
                if (typeof runSanskritSearch === 'function') {
                    setTimeout(runSanskritSearch, 200);
                }
            }
        };
    }
});

// ======== КОНФИГУРАЦИЯ ВНЕШНИХ СЛОВАРЕЙ ========
// Порядок элементов в массиве определяет порядок отображения на странице.
const EXTERNAL_DICTS_ORDER = ['gandhari', 'pts', 'sanskrit'];

// Единый менеджер внешних словарей
function loadExternalDictionaries(query) {
    const dpdPane = document.getElementById('dpd-pane');
    if (!dpdPane) return;

    // Ищем или создаем единый контейнер
    let extContainer = document.getElementById('external-dicts-container');
    if (!extContainer) {
        extContainer = document.createElement('div');
        extContainer.id = 'external-dicts-container';
        dpdPane.appendChild(extContainer);
    }

    if (!query) {
        extContainer.style.display = 'none';
        extContainer.innerHTML = '';
        if (typeof lastSanskritQuery !== 'undefined') {
            lastSanskritQuery = '';
        }
        return;
    }

    // Подготовка контейнера к новому поиску
    extContainer.style.display = 'block';
    extContainer.innerHTML = '';

    // 1. Создаем слоты для словарей в заданном порядке
    EXTERNAL_DICTS_ORDER.forEach(dictName => {
        const slot = document.createElement('div');
        slot.id = `ext-slot-${dictName}`;
        extContainer.appendChild(slot);
    });

    // 2. Инициализация Санскрита в его выделенном слоте
    const sanskritSlot = document.getElementById('ext-slot-sanskrit');
    if (sanskritSlot) {
        let sanskritContainer = document.createElement('div');
        sanskritContainer.id = 'sanskrit-results';
        sanskritSlot.appendChild(sanskritContainer);

        if (typeof runSanskritSearch === 'function') {
            // Принудительно сбрасываем кэш последнего запроса для корректной отработки
            if (typeof lastSanskritQuery !== 'undefined') {
                lastSanskritQuery = ''; 
            }
            runSanskritSearch();
        }
    }
}
// Модуль словаря Gandhari
function appendGandhari(query) {
    const slot = document.getElementById('ext-slot-gandhari');
    if (!slot) return;

    const targetUrl = `https://gandhari.org/dictionary?section=dop&search=${encodeURIComponent(query)}`;
    const headerObj = renderExtDictHeader('gandhari', 'Gandhari Dictionary', targetUrl);
    
    slot.style.cssText = "margin-bottom: 15px; margin-top: 15px;";
    slot.innerHTML = `
        ${headerObj.headerHtml}
        <div class="ext-dict-content" style="max-height: 450px; overflow: auto; display: ${headerObj.displayStyle};">
            <iframe 
                src="${targetUrl}" 
                style="width: 100%; height: 450px; border: 2px solid #1a8bdb; border-radius: 8px; background-color: #fff;" 
                sandbox="allow-scripts allow-same-origin"
                title="Gandhari Dictionary">
            </iframe>
        </div>
    `;
}

// Модуль словаря PTS
function appendPts(query) {
    const slot = document.getElementById('ext-slot-pts');
    if (!slot) return;

    const targetUrl = `https://dsal.uchicago.edu/cgi-bin/app/pali_query.py?matchtype=default&qs=${encodeURIComponent(query)}`;
    const headerObj = renderExtDictHeader('pts', 'PTS Dictionary', targetUrl);
    
    slot.style.cssText = "margin-bottom: 15px;";
    slot.innerHTML = `
        ${headerObj.headerHtml}
        <div class="ext-dict-content" style="max-height: 450px; overflow: auto; display: ${headerObj.displayStyle};">
            <iframe 
                src="${targetUrl}" 
                style="width: 100%; height: 450px; border: 2px solid #1a8bdb; border-radius: 8px; background-color: #fff;" 
                sandbox="allow-scripts allow-same-origin"
                title="PTS Dictionary">
            </iframe>
        </div>
    `;
}

// Обработчик сворачивания целых блоков внешних словарей с сохранением состояния
document.addEventListener('click', (e) => {
    const header = e.target.closest('.ext-dict-header');
    if (header) {
        const dictCode = header.dataset.dictcode;
        const content = header.parentNode.querySelector('.ext-dict-content');
        const icon = header.querySelector('.ext-dict-toggle-icon');
        
        if (content && icon) {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            icon.textContent = isHidden ? '▼' : '▶';
            
            if (dictCode) {
                let states = JSON.parse(localStorage.getItem('extDictStates') || '{}');
                states[dictCode] = !isHidden; 
                localStorage.setItem('extDictStates', JSON.stringify(states));
            }
        }
    }
});


// ======== ЛОКАЛИЗАЦИЯ И ТЕКСТЫ ========
const UI_TEXTS = {
    ru: {
        openInNewTab: 'Открыть ↗',
        sanskrit: 'Санскрит'
    },
    en: {
        openInNewTab: 'Open ↗',
        sanskrit: 'Sanskrit'
    }
};

function getUiText(key) {
    const lang = window.isRu ? 'ru' : 'en';
    return UI_TEXTS[lang][key] || UI_TEXTS.en[key] || key;
}

// Универсальный генератор шапки для внешних словарей
function renderExtDictHeader(dictCode, title, targetUrl, extraRightHtml = '') {
    const openText = getUiText('openInNewTab');
    const linkHtml = targetUrl ? `<a href="${targetUrl}" target="_blank" style="font-size: 0.8em; color: #1a8bdb; text-decoration: none;" onclick="event.stopPropagation();">${openText}</a>` : '';
    
    const states = JSON.parse(localStorage.getItem('extDictStates') || '{}');
    const isCollapsed = states[dictCode] === true;
    const icon = isCollapsed ? '▶' : '▼';
    const displayStyle = isCollapsed ? 'none' : 'block';
    
    return {
        headerHtml: `
            <div class="ext-dict-header" data-dictcode="${dictCode}" style="display: flex; justify-content: space-between; align-items: center; font-size: 1.2em; margin-bottom: 10px; color: #1a8bdb; border-bottom: 1px solid rgba(26, 139, 219, 0.3); padding-bottom: 5px; cursor: pointer; user-select: none;">
                <div>
                    <span class="ext-dict-toggle-icon" style="display:inline-block; width:18px;">${icon}</span>
                    <span style="font-weight: bold;">${title}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;" onclick="event.stopPropagation();">
                    ${extraRightHtml}
                    ${linkHtml}
                </div>
            </div>`,
        displayStyle: displayStyle
    };
}
