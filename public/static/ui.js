// Redesign shell: screens, history rail / panels, favorites, word actions.
// Search, external dictionaries and settings persistence stay in extra.js / home.js.
(function () {
  const B = document.body;
  const isRu = document.documentElement.lang === 'ru';
  const T = isRu
    ? { fav: 'В избранное', unfav: 'Убрать из избранного', copied: 'Скопировано', linkCopied: 'Ссылка скопирована', noFav: 'пока пусто', noHist: 'пока пусто' }
    : { fav: 'Add to favorites', unfav: 'Remove from favorites', copied: 'Copied', linkCopied: 'Link copied', noFav: 'nothing yet', noHist: 'nothing yet' };
  const mobile = () => matchMedia('(max-width: 767.98px)').matches;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  const getHist = () => JSON.parse(localStorage.getItem('history-list') || '[]');
  const getFav = () => JSON.parse(localStorage.getItem('fav-list') || '[]');
  const setFav = (l) => localStorage.setItem('fav-list', JSON.stringify(l));
  const currentWord = () => ($('search-box')?.value || '').trim();
  const notify = (t) => typeof showBubbleNotification === 'function' && showBubbleNotification(t);

  // ---- rendering ---------------------------------------------------------
  function row(w, withStar) {
    const cur = w === currentWord() && B.dataset.screen === 'entry';
    const on = getFav().includes(w);
    const star = withStar
      ? `<button class="favmark" type="button" aria-pressed="${on}" title="${on ? T.unfav : T.fav}" data-fav="${esc(w)}"><i class="fa-${on ? 'solid' : 'regular'} fa-star"></i></button>`
      : '';
    return `<li><a href="#" data-word="${esc(w)}"${cur ? ' aria-current="true"' : ''}>${esc(w)}</a>${star}</li>`;
  }

  function paintHist() {
    const hist = getHist(), fav = getFav();
    const favHtml = fav.map((w) => row(w, true)).join('');
    const histHtml = hist.map((w) => row(w, true)).join('');
    for (const id of ['rail-fav', 'fav-list']) { const el = $(id); if (el) { el.innerHTML = favHtml; el.dataset.empty = T.noFav; } }
    for (const id of ['rail-list', 'hist-list']) { const el = $(id); if (el) { el.innerHTML = histHtml; el.dataset.empty = T.noHist; } }
    const chips = $('chips');
    if (chips) {
      chips.innerHTML = hist.slice(0, 14).map((w) => `<a href="#" data-word="${esc(w)}">${esc(w)}</a>`).join('');
      $('recents').hidden = hist.length === 0;
    }
    $('favbtn')?.setAttribute('aria-pressed', String(fav.includes(currentWord())));
  }
  window.paintHist = paintHist;

  function setWord(q) {
    const w = typeof cleanQueryParam === 'function' ? cleanQueryParam(q) : q;
    B.dataset.screen = 'entry';
    const h = $('whead-word'); if (h) h.textContent = w;
    updateDgStats(w);
  }

  // ---- Dhamma.Gift word stats (text/match count next to "Open on Dhamma.Gift") ----
  // Fetched from dg-node's cheap ?fast=1 search endpoint (grep-only counts, no per-sutta
  // file reads — same request the dhamma.gift search UI itself uses on every keystroke).
  // Fire-and-forget: never blocks rendering, a stale/slow response for a word the user has
  // since navigated away from is dropped via the token guard below.
  const dgStatsCache = new Map(); // word -> rendered stats text
  let dgStatsToken = 0;

  function dgStatsText(totalFiles, totalMatches) {
    if (isRu) {
      const f = totalFiles % 10 === 1 && totalFiles % 100 !== 11 ? 'текст' : (totalFiles % 10 >= 2 && totalFiles % 10 <= 4 && (totalFiles % 100 < 10 || totalFiles % 100 >= 20)) ? 'текста' : 'текстов';
      const m = totalMatches % 10 === 1 && totalMatches % 100 !== 11 ? 'совпадение' : (totalMatches % 10 >= 2 && totalMatches % 10 <= 4 && (totalMatches % 100 < 10 || totalMatches % 100 >= 20)) ? 'совпадения' : 'совпадений';
      return `${totalFiles} ${f} · ${totalMatches} ${m}`;
    }
    return `${totalFiles} text${totalFiles === 1 ? '' : 's'} · ${totalMatches} match${totalMatches === 1 ? '' : 'es'}`;
  }

  async function updateDgStats(word) {
    const el = $('dg-stats');
    if (!el) return;
    const token = ++dgStatsToken;

    if (!word) { el.textContent = ''; el.classList.remove('skel'); return; }

    const cached = dgStatsCache.get(word);
    if (cached) { el.textContent = cached; el.classList.remove('skel'); return; }

    el.textContent = '';
    el.classList.add('skel');

    try {
      const url = `https://dhamma.gift/search?q=${encodeURIComponent(word)}&scope=all&fast=1`;
      const res = await fetch(url);
      if (token !== dgStatsToken) return; // superseded by a newer word, drop this response
      if (!res.ok) throw new Error('dg-stats: bad response');
      const json = await res.json();
      const { totalFiles, totalMatches } = json.metadata || {};
      el.classList.remove('skel');
      if (!totalFiles) { el.textContent = ''; return; }
      const text = dgStatsText(totalFiles, totalMatches);
      dgStatsCache.set(word, text);
      el.textContent = text;
    } catch (e) {
      if (token !== dgStatsToken) return;
      el.classList.remove('skel');
      el.textContent = '';
    }
  }

  // Wrap the search entry point from extra.js: switch screen, set headword, repaint lists.
  const _search = window.handleClientSearch;
  window.handleClientSearch = async function (q) {
    setWord(q);
    const r = await _search.apply(this, arguments);
    paintHist();
    return r;
  };

  function pickWord(w) {
    const sb = $('search-box'); if (sb) sb.value = w;
    closePanels();
    window.handleClientSearch(w);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-word]');
    if (a) { e.preventDefault(); pickWord(a.dataset.word); return; }
    const f = e.target.closest('button[data-fav]');
    if (f) { e.preventDefault(); favSet(f.dataset.fav); }
  });

  // ---- favorites ---------------------------------------------------------
  function favSet(w) {
    const fav = getFav();
    setFav(fav.includes(w) ? fav.filter((x) => x !== w) : [w].concat(fav));
    paintHist();
  }
  window.favToggle = () => { const w = currentWord(); if (w) favSet(w); };

  // ---- word actions ------------------------------------------------------
  window.speakWord = () => { const w = currentWord(); if (w && typeof playAudio === 'function') playAudio(w); };
  window.copyWord = () => { const w = currentWord(); if (w) navigator.clipboard.writeText(w).then(() => notify(T.copied)); };
  window.copyLink = () => navigator.clipboard.writeText(location.href).then(() => notify(T.linkCopied));

  // ---- history rail / panels --------------------------------------------
  window.histToggle = function () {
    if (mobile()) { togglePanel('hist'); return; }
    const on = B.dataset.hist !== 'on';
    B.dataset.hist = on ? 'on' : 'off';
    localStorage.setItem('desktopHistoryHidden', String(!on));
    $('histbtn')?.setAttribute('aria-pressed', String(on));
  };
  // Alt+H / Alt+S in extra.js call these names
  window.toggleDesktopHistoryBtn = window.toggleHistory = window.histToggle;
  window.toggleDesktopSettingsBtn = window.toggleSettings = () => togglePanel('set');

  function openPanel(p) {
    closePanels();
    B.classList.add('pnopen');
    // history opens as a top dropdown (like the resources menu), no dark scrim
    B.classList.toggle('hist-open', p === 'hist');
    $('p-' + p).dataset.open = 'true';
  }
  function closePanels() {
    B.classList.remove('pnopen', 'hist-open');
    document.querySelectorAll('aside.panel').forEach((p) => (p.dataset.open = 'false'));
  }
  function togglePanel(p) { $('p-' + p).dataset.open === 'true' ? closePanels() : openPanel(p); }
  window.openPanel = openPanel; window.closePanels = closePanels;

  document.addEventListener('pointerdown', (e) => {
    if (B.classList.contains('pnopen') && !e.target.closest('.panel') && !e.target.closest('.hbtns')) closePanels();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanels(); });

  // ---- data --------------------------------------------------------------
  // clears both history and favorites (the settings row and any trash button)
  window.clearHistory = () => { localStorage.removeItem('history-list'); localStorage.removeItem('fav-list'); paintHist(); };
  window.resetSettings = () => {
    ['theme', 'fontSize', 'theme-toggle', 'sans-serif-toggle', 'niggahita-toggle', 'grammar-toggle', 'example-toggle',
      'one-button-toggle', 'summary-toggle', 'sandhi-toggle', 'audio-toggle', 'tabsHidden', 'desktopHistoryHidden',
      'extDictStates', 'extDictsOrder', 'sanskritDictStates', 'sanskritDictOrder'].forEach((k) => localStorage.removeItem(k));
    location.reload();
  };

  // ---- init ---------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    $('histbtn')?.setAttribute('aria-pressed', String(B.dataset.hist === 'on'));
    $('clear-history-button')?.addEventListener('click', clearHistory); // clears history + favorites, repaints
    const q = new URLSearchParams(location.search).get('q');
    if (q) { const h = $('whead-word'); if (h) h.textContent = q; updateDgStats(q); }
    paintHist();
    // shadow under the sticky bar once the page scrolls (no scroll listener)
    const s = document.createElement('div'); s.style.cssText = 'position:absolute;top:0;height:1px;width:1px';
    B.prepend(s);
    new IntersectionObserver(([en]) => B.classList.toggle('scrolled', !en.isIntersecting)).observe(s);

    // hide the search bar on scroll-down (more room), reveal on scroll-up or on focus (incl. the "/" shortcut)
    const tbar = document.querySelector('.tbar');
    if (tbar) {
      const setH = () => document.documentElement.style.setProperty('--tbar-h', tbar.offsetHeight + 'px');
      setH();
      addEventListener('resize', setH);
      const hideMinY = 320; // don't hide until scrolled this far down
      let lastY = scrollY, ticking = false;
      addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = scrollY, dy = y - lastY;
          if (y < hideMinY) B.classList.remove('tbar-hide');
          else if (dy > 8) B.classList.add('tbar-hide');
          else if (dy < -8) B.classList.remove('tbar-hide');
          lastY = y;
          ticking = false;
        });
      }, { passive: true });
      tbar.addEventListener('focusin', () => B.classList.remove('tbar-hide'));
    }
  });
})();
