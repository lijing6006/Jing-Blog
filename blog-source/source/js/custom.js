(() => {
  document.documentElement.classList.add('jing-blog-ready');

  const themeStorageKey = 'jing-theme';

  function getStoredTheme() {
    try {
      return localStorage.getItem(themeStorageKey);
    } catch {
      return '';
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch {}
  }

  function applyTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.jingTheme = nextTheme;
    const toggle = document.querySelector('.jing-theme-toggle');
    if (toggle) {
      const isDark = nextTheme === 'dark';
      toggle.setAttribute('aria-pressed', String(isDark));
      toggle.title = isDark ? '切换为白底黑字' : '切换为黑底白字';
      toggle.setAttribute('aria-label', toggle.title);
    }
  }

  applyTheme(getStoredTheme() || 'light');

  function initThemeToggle() {
    let toggle = document.querySelector('.jing-theme-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'jing-theme-toggle';
      document.body.append(toggle);
      toggle.addEventListener('click', () => {
        const nextTheme = document.documentElement.dataset.jingTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        setStoredTheme(nextTheme);
      });
    }
    applyTheme(document.documentElement.dataset.jingTheme || getStoredTheme() || 'light');
  }

  function updateDateCategories() {
    fetch('/date-categories.json', {cache: 'no-store'})
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.categories) || data.categories.length === 0) return;

        const categories = data.categories;
        const categoryCount = document.querySelector('.site-data a[href="/categories/"] .length-num');
        if (categoryCount) categoryCount.textContent = String(categories.length);

        const asideList = document.querySelector('#aside-cat-list');
        if (asideList) {
          asideList.innerHTML = '';
          for (const category of categories) {
            const item = document.createElement('li');
            item.className = `card-category-list-item ${category.count ? '' : 'is-empty'}`.trim();

            const link = document.createElement('a');
            link.className = 'card-category-list-link';
            link.href = category.count ? category.url : 'javascript:void(0)';
            if (!category.count) link.title = '暂无文章';

            const name = document.createElement('span');
            name.className = 'card-category-list-name';
            name.textContent = category.name;

            const count = document.createElement('span');
            count.className = 'card-category-list-count';
            count.textContent = String(category.count);

            link.append(name, count);
            item.append(link);
            asideList.append(item);
          }
        }

        const pageList = document.querySelector('.category-lists .category-list');
        if (pageList) {
          pageList.innerHTML = '';
          for (const category of categories) {
            const item = document.createElement('li');
            item.className = `category-list-item ${category.count ? '' : 'is-empty'}`.trim();

            const link = document.createElement('a');
            link.className = 'category-list-link';
            link.href = category.count ? category.url : 'javascript:void(0)';
            link.textContent = category.name;
            if (!category.count) link.title = '暂无文章';

            const count = document.createElement('span');
            count.className = 'category-list-count';
            count.textContent = String(category.count);

            item.append(link, count);
            pageList.append(item);
          }
        }
      })
      .catch(() => {});
  }

  function textFromXml(parent, selector) {
    const node = parent.querySelector(selector);
    return node ? node.textContent.trim() : '';
  }

  function decodeHtml(value) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value || '';
    return textarea.value;
  }

  function plainText(value) {
    return decodeHtml(value)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function fetchTextWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {cache: 'no-store', signal: controller.signal})
      .finally(() => window.clearTimeout(timer))
      .then((response) => {
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        return response.text();
      });
  }

  function countOccurrences(text, token) {
    if (!text || !token) return 0;
    let count = 0;
    let index = text.indexOf(token);
    while (index !== -1) {
      count += 1;
      index = text.indexOf(token, index + token.length);
    }
    return count;
  }

  function scoreSearchItem(item, tokens, query) {
    let score = 0;

    for (const token of tokens) {
      if (item.titleSearch === token) score += 200;
      else if (item.titleSearch.startsWith(token)) score += 120;
      else if (item.titleSearch.includes(token)) score += 90;

      if (item.tagsSearch.includes(token)) score += 45;
      if (item.categoriesSearch.includes(token)) score += 25;
      score += Math.min(countOccurrences(item.contentSearch, token), 8);
    }

    if (item.titleSearch === query) score += 300;
    else if (item.titleSearch.includes(query)) score += 150;
    if (item.contentSearch.includes(query)) score += 10;

    return score;
  }

  function createResultItem(item) {
    const result = document.createElement('article');
    result.className = 'jing-search-result';

    const title = document.createElement('a');
    title.className = 'jing-search-result-title';
    title.href = item.url || '#';
    title.textContent = item.title || '未命名文章';

    const summary = document.createElement('div');
    summary.className = 'jing-search-result-summary';
    summary.textContent = item.summary;

    const path = document.createElement('div');
    path.className = 'jing-search-result-path';
    path.textContent = item.url;

    result.append(title);
    if (item.summary) result.append(summary);
    if (item.url) result.append(path);
    return result;
  }

  function initArchiveSearch() {
    if (!/^\/archives\/?$/.test(window.location.pathname)) return;

    const archive = document.querySelector('#archive');
    if (!archive || document.querySelector('.jing-archive-search')) return;

    const panel = document.createElement('section');
    panel.className = 'jing-archive-search';

    const title = document.createElement('h2');
    title.className = 'jing-archive-search-title';
    title.textContent = '搜索';

    const row = document.createElement('div');
    row.className = 'jing-archive-search-row';

    const input = document.createElement('input');
    input.className = 'jing-archive-search-input';
    input.type = 'search';
    input.placeholder = '搜索文章、标签或关键词';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', '搜索文章');

    const meta = document.createElement('div');
    meta.className = 'jing-archive-search-meta';
    meta.textContent = '本地';

    const results = document.createElement('div');
    results.className = 'jing-archive-search-results';
    results.innerHTML = '<div class="jing-search-empty">输入关键词搜索全部文章</div>';

    row.append(input, meta);
    panel.append(title, row, results);

    const firstArchiveTitle = archive.querySelector('.article-sort-title');
    archive.insertBefore(panel, firstArchiveTitle || archive.firstChild);

    let searchIndexPromise;
    function loadSearchIndex() {
      if (!searchIndexPromise) {
        searchIndexPromise = fetchTextWithTimeout('/search.xml', 12000)
          .then((xml) => {
            const doc = new DOMParser().parseFromString(xml, 'application/xml');
            return [...doc.querySelectorAll('entry')].map((entry, index) => {
              const titleText = plainText(textFromXml(entry, 'title'));
              const contentText = plainText(textFromXml(entry, 'content'));
              const tags = [...entry.querySelectorAll('tags')].map((node) => plainText(node.textContent));
              const categories = [...entry.querySelectorAll('categories')].map((node) => plainText(node.textContent));
              const summary = contentText.slice(0, 120);
              const titleSearch = normalize(titleText);
              const contentSearch = normalize(contentText);
              const tagsSearch = normalize(tags.join(' '));
              const categoriesSearch = normalize(categories.join(' '));
              return {
                index,
                title: titleText,
                url: textFromXml(entry, 'url'),
                summary,
                titleSearch,
                contentSearch,
                tagsSearch,
                categoriesSearch,
                haystack: [titleSearch, contentSearch, tagsSearch, categoriesSearch].join(' '),
              };
            });
          });
      }
      return searchIndexPromise;
    }

    let searchTimer;
    input.addEventListener('input', () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        const query = normalize(input.value);
        if (!query) {
          meta.textContent = '本地';
          results.innerHTML = '<div class="jing-search-empty">输入关键词搜索全部文章</div>';
          return;
        }

        meta.textContent = '搜索中';
        loadSearchIndex()
          .then((items) => {
            const tokens = query.split(' ').filter(Boolean);
            const matched = items
              .filter((item) => tokens.every((token) => item.haystack.includes(token)))
              .map((item) => ({...item, score: scoreSearchItem(item, tokens, query)}))
              .sort((a, b) => b.score - a.score || a.index - b.index)
              .slice(0, 12);

            meta.textContent = `${matched.length} 篇`;
            results.innerHTML = '';
            if (matched.length === 0) {
              results.innerHTML = '<div class="jing-search-empty">没有匹配文章</div>';
              return;
            }

            for (const item of matched) {
              results.append(createResultItem(item));
            }
          })
          .catch(() => {
            meta.textContent = '不可用';
            results.innerHTML = '<div class="jing-search-empty">搜索索引加载失败</div>';
          });
      }, 120);
    });
  }

  function trackPostView() {
    const path = window.location.pathname;
    if (!path.startsWith('/posts/')) return;

    const payload = {
      path,
      title: document.title.replace(/\s*\|\s*.*$/, ''),
      referrer: document.referrer || '',
    };

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/track/view', new Blob([body], {type: 'application/json'}));
      return;
    }

    fetch('/track/view', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body,
      keepalive: true,
    }).catch(() => {});
  }

  function createSiteStatItem(label, valueId, containerId, unit) {
    const item = document.createElement('span');
    item.className = 'jing-site-stats-item';
    item.id = containerId;

    const labelNode = document.createElement('span');
    labelNode.textContent = label;

    const valueNode = document.createElement('strong');
    valueNode.id = valueId;
    valueNode.textContent = '--';

    const unitNode = document.createElement('span');
    unitNode.textContent = unit;

    item.append(labelNode, valueNode, unitNode);
    return item;
  }

  function loadBusuanzi() {
    const scriptUrl = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    const existing = document.querySelector('script[data-jing-busuanzi="true"], script[src*="busuanzi"]');
    if (existing) {
      if (window.bszCaller && window.bszTag) {
        window.bszCaller.fetch('//busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback', (data) => {
          window.bszTag.texts(data);
          window.bszTag.shows();
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.dataset.jingBusuanzi = 'true';
    script.src = scriptUrl;
    script.onerror = () => {
      document.querySelectorAll('.jing-site-stats').forEach((node) => {
        node.hidden = true;
      });
    };
    document.head.append(script);
  }

  function initSiteStats() {
    const footerWrap = document.querySelector('#footer-wrap');
    if (!footerWrap) return;

    let stats = footerWrap.querySelector('.jing-site-stats');
    if (!stats) {
      stats = document.createElement('div');
      stats.className = 'jing-site-stats';
      stats.hidden = true;
      footerWrap.append(stats);
    }

    stats.hidden = false;
    stats.innerHTML = '';

    const separator = document.createElement('span');
    separator.className = 'jing-site-stats-separator';
    separator.textContent = '|';

    const visitorItem = createSiteStatItem(
      '本站访客数',
      'busuanzi_value_site_uv',
      'busuanzi_container_site_uv',
      '人次',
    );
    const viewItem = createSiteStatItem(
      '本站总访问量',
      'busuanzi_value_site_pv',
      'busuanzi_container_site_pv',
      '次',
    );

    stats.append(visitorItem, separator, viewItem);
    loadBusuanzi();
  }

  function ensureGuestbookMenu() {
    const menuTargets = [
      document.querySelector('#menus .menus_items'),
      document.querySelector('#sidebar-menus .menus_items'),
    ];

    for (const root of menuTargets) {
      if (!root || root.querySelector('a[href="/messages/"]')) continue;

      const item = document.createElement('div');
      item.className = 'menus_item';

      const link = document.createElement('a');
      link.className = 'site-page';
      link.href = '/messages/';

      const icon = document.createElement('i');
      icon.className = 'fa-fw fas fa-message';

      const text = document.createElement('span');
      text.textContent = ' \u7559\u8a00';

      link.append(icon, text);
      item.append(link);

      const aboutItem = [...root.querySelectorAll('.menus_item')].find((node) => {
        const aboutLink = node.querySelector('a.site-page');
        return aboutLink && aboutLink.getAttribute('href') === '/about/';
      });

      if (aboutItem) {
        root.insertBefore(item, aboutItem);
      } else {
        root.append(item);
      }
    }
  }

  function initGuestbook() {
    if (!/^\/messages\/?$/.test(window.location.pathname)) return;

    const root = document.querySelector('#jing-guestbook');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';

    const form = document.querySelector('#jing-guestbook-form');
    const authorInput = document.querySelector('#jing-guestbook-author');
    const contentInput = document.querySelector('#jing-guestbook-content');
    const parentIdInput = document.querySelector('#jing-guestbook-parent-id');
    const statusNode = document.querySelector('#jing-guestbook-status');
    const submitButton = document.querySelector('#jing-guestbook-submit');
    const cancelButton = document.querySelector('#jing-guestbook-cancel');
    const titleNode = document.querySelector('#jing-guestbook-form-title');
    const hintNode = document.querySelector('#jing-guestbook-reply-hint');
    const listNode = document.querySelector('#jing-guestbook-list');
    const countNode = document.querySelector('#jing-guestbook-count');

    const state = {
      replyTarget: null,
      messages: [],
    };
    const messagesApi = '/api/messages';

    function setStatus(text, type) {
      statusNode.textContent = text || '';
      statusNode.className = `jing-guestbook-status ${type ? `is-${type}` : ''}`.trim();
    }

    function flattenCount(items) {
      return items.reduce((total, item) => total + 1 + flattenCount(item.replies || []), 0);
    }

    function formatDate(value) {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }

    function clearReplyState() {
      state.replyTarget = null;
      parentIdInput.value = '';
      titleNode.textContent = '\u5199\u70b9\u4ec0\u4e48';
      hintNode.textContent = '\u5199\u5b8c\u5c31\u4f1a\u76f4\u63a5\u5c55\u793a\u5728\u4e0b\u9762\u3002';
      submitButton.textContent = '\u53d1\u5e03\u7559\u8a00';
      cancelButton.hidden = true;
    }

    function setReplyTarget(message) {
      state.replyTarget = message;
      parentIdInput.value = message.id;
      titleNode.textContent = `\u56de\u590d ${message.author}`;
      hintNode.textContent = '\u56de\u590d\u4f1a\u6302\u5728\u8fd9\u6761\u7559\u8a00\u4e0b\u9762\u3002';
      submitButton.textContent = '\u53d1\u5e03\u56de\u590d';
      cancelButton.hidden = false;
      contentInput.focus();
      root.scrollIntoView({behavior: 'smooth', block: 'start'});
    }

    function createMessageCard(message, depth) {
      const card = document.createElement('article');
      card.className = 'jing-message-card';
      if (depth > 0) card.classList.add('is-reply');
      card.style.setProperty('--jing-message-depth', String(Math.min(depth, 6)));

      const header = document.createElement('div');
      header.className = 'jing-message-header';

      const author = document.createElement('strong');
      author.className = 'jing-message-author';
      author.textContent = message.author;

      if (message.isAdmin) {
        const badge = document.createElement('span');
        badge.className = 'jing-message-admin-badge';
        badge.textContent = '\u535a\u4e3b';
        author.append(badge);
      }

      const meta = document.createElement('span');
      meta.className = 'jing-message-meta';
      meta.textContent = formatDate(message.createdAt);

      const replyButton = document.createElement('button');
      replyButton.type = 'button';
      replyButton.className = 'jing-message-reply';
      replyButton.textContent = '\u56de\u590d';
      replyButton.addEventListener('click', () => setReplyTarget(message));

      header.append(author, meta, replyButton);

      const content = document.createElement('div');
      content.className = 'jing-message-content';
      for (const line of String(message.content || '').split('\n')) {
        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        content.append(paragraph);
      }

      card.append(header, content);

      if (Array.isArray(message.replies) && message.replies.length) {
        const replies = document.createElement('div');
        replies.className = 'jing-message-children';
        for (const reply of message.replies) {
          replies.append(createMessageCard(reply, depth + 1));
        }
        card.append(replies);
      }

      return card;
    }

    function renderMessages(items) {
      state.messages = Array.isArray(items) ? items : [];
      const total = flattenCount(state.messages);
      countNode.textContent = `${total} \u6761`;
      listNode.innerHTML = '';

      if (state.messages.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'jing-guestbook-empty';
        empty.textContent = '\u8fd8\u6ca1\u6709\u7559\u8a00\uff0c\u4f60\u6765\u5750\u7b2c\u4e00\u6761\u3002';
        listNode.append(empty);
        return;
      }

      for (const item of state.messages) {
        listNode.append(createMessageCard(item, 0));
      }
    }

    async function loadMessages() {
      setStatus('\u6b63\u5728\u52a0\u8f7d\u7559\u8a00...', 'muted');
      try {
        const response = await fetch(messagesApi, {cache: 'no-store'});
        if (!response.ok) throw new Error(response.status === 404 ? '\u7559\u8a00\u63a5\u53e3\u672a\u542f\u52a8' : `HTTP ${response.status}`);
        const data = await response.json();
        renderMessages(data.messages || []);
        setStatus('', '');
      } catch (error) {
        setStatus(error.message || '\u7559\u8a00\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002', 'error');
      }
    }

    cancelButton.addEventListener('click', () => {
      clearReplyState();
      setStatus('', '');
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        author: authorInput.value.trim(),
        content: contentInput.value.trim(),
        parentId: parentIdInput.value.trim(),
        website: new FormData(form).get('website') || '',
      };

      if (!payload.author || !payload.content) {
        setStatus('\u6635\u79f0\u548c\u5185\u5bb9\u90fd\u8981\u586b\u3002', 'error');
        return;
      }

      submitButton.disabled = true;
      setStatus('\u6b63\u5728\u53d1\u5e03...', 'muted');

      try {
        const response = await fetch(messagesApi, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        });
        const text = await response.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(response.status === 404 ? '\u7559\u8a00\u63a5\u53e3\u672a\u542f\u52a8' : '\u7559\u8a00\u63a5\u53e3\u8fd4\u56de\u5f02\u5e38');
        }
        if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);

        contentInput.value = '';
        clearReplyState();
        setStatus('\u7559\u8a00\u5df2\u53d1\u5e03\u3002', 'success');
        await loadMessages();
      } catch (error) {
        setStatus(error.message || '\u53d1\u5e03\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002', 'error');
      } finally {
        submitButton.disabled = false;
      }
    });

    clearReplyState();
    loadMessages();
  }

  function boot() {
    initThemeToggle();
    ensureGuestbookMenu();
    updateDateCategories();
    initArchiveSearch();
    trackPostView();
    window.setTimeout(initSiteStats, 250);
    initGuestbook();
  }

  boot();
  document.addEventListener('pjax:complete', boot);
})();
