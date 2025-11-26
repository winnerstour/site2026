// artigo-corporativo.js
// Página de artigo corporativo (usa slug + JSON em /Artigos/<slug>.json)

(function () {
  const titleEl        = document.getElementById('articleTitle');
  const subtitleEl     = document.getElementById('articleSubtitle');
  const introContainer = document.getElementById('articleIntro');
  const sectionsCont   = document.getElementById('articleSections');
  const errorContainer = document.getElementById('articleError');
  const pageTitleTag   = document.getElementById('pageTitle');

  const BASE_PATH = window.location.pathname.startsWith('/site2026')
    ? '/site2026'
    : '';

  function showError(msg) {
    if (errorContainer) {
      errorContainer.innerHTML = '<div class="error-box">' + (msg || 'Erro inesperado ao carregar este artigo.') + '</div>';
    }
  }

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    return slug ? slug.trim() : '';
  }

  function stripDuplicateHeading(md, secTitle) {
    if (!md || typeof md !== 'string') return md || '';
    if (!secTitle || typeof secTitle !== 'string') return md;

    const norm = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = norm.split('\n');
    if (!lines.length) return md;

    let idx = 0;
    while (idx < lines.length && !lines[idx].trim()) idx++;
    if (idx >= lines.length) return md;

    const firstRaw = lines[idx].trim();

    function normalizeHeadingText(line) {
      if (!line) return '';
      let t = String(line).trim();
      t = t.replace(/^#{1,6}\s+/, '');
      t = t.replace(/^[_*]+/, '').replace(/[_*]+$/, '');
      return t.trim();
    }

    const firstNorm = normalizeHeadingText(firstRaw);
    const secNorm   = String(secTitle).trim();

    if (firstNorm && firstNorm === secNorm) {
      const remaining = lines.slice(idx + 1);
      return remaining.join('\n');
    }

    return md;
  }

  function markdownToHtml(md) {
    if (!md || typeof md !== 'string') return '';

    const norm  = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = norm.split('\n');

    let html      = '';
    let inList    = false;
    let paragraph = [];

    function inlineFormat(text) {
      if (!text) return '';
      let t = String(text);
      t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      return t;
    }

    function flushParagraph() {
      if (!paragraph.length) return;
      const text = paragraph.join(' ').trim();
      if (text) {
        html += '<p>' + inlineFormat(text) + '</p>\n';
      }
      paragraph = [];
    }

    function closeList() {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const raw     = lines[i];
      const trimmed = raw.trim();

      if (!trimmed) {
        flushParagraph();
        closeList();
        continue;
      }

      let m;
      if ((m = /^####\s+(.+)$/.exec(trimmed))) {
        flushParagraph();
        closeList();
        html += '<h4>' + inlineFormat(m[1].trim()) + '</h4>\n';
        continue;
      }
      if ((m = /^###\s+(.+)$/.exec(trimmed))) {
        flushParagraph();
        closeList();
        html += '<h3>' + inlineFormat(m[1].trim()) + '</h3>\n';
        continue;
      }
      if ((m = /^##\s+(.+)$/.exec(trimmed))) {
        flushParagraph();
        closeList();
        html += '<h3>' + inlineFormat(m[1].trim()) + '</h3>\n';
        continue;
      }
      if ((m = /^#\s+(.+)$/.exec(trimmed))) {
        flushParagraph();
        closeList();
        html += '<h2>' + inlineFormat(m[1].trim()) + '</h2>\n';
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        flushParagraph();
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        const item = trimmed.replace(/^[-*]\s+/, '');
        html += '<li>' + inlineFormat(item) + '</li>';
        continue;
      }

      paragraph.push(trimmed);
    }

    flushParagraph();
    if (inList) {
      html += '</ul>\n';
    }

    return html;
  }

  function renderArticleFromJson(json, slug) {
    if (!json || typeof json !== 'object') {
      showError('O JSON deste artigo não está no formato esperado.');
      if (titleEl) titleEl.textContent = 'Artigo não encontrado';
      return;
    }

    const slugSafe    = slug || '';
    const titulo      = json.titulo || json.titulo_curto || slugSafe || 'Artigo corporativo';
    const tituloCurto = json.titulo_curto || json.titulo || slugSafe || 'Artigo corporativo';
    const subtitulo   = json.subtitulo || '';
    const metaTitle   = json.meta_title || titulo;

    // deixa o título curto disponível para o script de WhatsApp
    document.body.dataset.articleShortTitle = tituloCurto;

    if (pageTitleTag instanceof HTMLElement) {
      pageTitleTag.textContent = metaTitle;
    } else {
      document.title = metaTitle;
    }

    if (titleEl) {
      titleEl.textContent = titulo;
      const len = titulo ? String(titulo).length : 0;
      if (len > 60) {
        titleEl.classList.add('hero-title-small');
      } else {
        titleEl.classList.remove('hero-title-small');
      }
    }

    if (subtitleEl) {
      subtitleEl.textContent = subtitulo || '';
    }

    const sections = Array.isArray(json.sections) ? json.sections : [];

    let introSection = null;
    const otherSections = [];

    sections.forEach(function(sec) {
      if (!sec || typeof sec !== 'object') return;

      const rawId = sec.id;
      const title = sec.titulo_secao || '';
      const tNorm = String(title).trim().toLowerCase();

      if (tNorm === 'introdução' || rawId === 1) {
        introSection = sec;
        return;
      }

      otherSections.push(sec);
    });

    if (introContainer) {
      introContainer.innerHTML = '';
      if (introSection && introSection.conteudo_markdown) {
        const introTitle = introSection.titulo_secao || 'Introdução';
        const cleanedIntroMd = stripDuplicateHeading(introSection.conteudo_markdown, introTitle);
        const introHtml = markdownToHtml(cleanedIntroMd);
        if (introHtml) {
          introContainer.innerHTML = introHtml;
        }
      }
    }

    if (sectionsCont) {
      sectionsCont.innerHTML = '';

      otherSections.forEach(function(sec) {
        const wrapper = document.createElement('article');
        wrapper.className = 'content-section';

        const title = sec.titulo_secao || '';
        const tNorm = String(title).trim().toLowerCase();

        if (title && tNorm !== 'introdução') {
          const h2 = document.createElement('h2');
          h2.textContent = title;
          wrapper.appendChild(h2);
        }

        const rawMd = sec.conteudo_markdown || '';
        const cleanedMd = stripDuplicateHeading(rawMd, sec.titulo_secao || '');
        const bodyHtml  = markdownToHtml(cleanedMd);

        if (bodyHtml) {
          const div = document.createElement('div');
          div.innerHTML = bodyHtml;
          wrapper.appendChild(div);
        }

        sectionsCont.appendChild(wrapper);
      });
    }
  }

  async function init() {
    const slug = getSlugFromUrl();

    if (!slug) {
      showError('Nenhum artigo foi selecionado. Acesse a área corporativa e escolha um conteúdo.');
      if (titleEl) titleEl.textContent = 'Artigo não encontrado';
      return;
    }

    const dataUrl = BASE_PATH + '/Artigos/' + encodeURIComponent(slug) + '.json';

    try {
      const response = await fetch(dataUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Não foi possível carregar o arquivo ' + dataUrl);
      }

      const data = await response.json();
      renderArticleFromJson(data, slug);
    } catch (err) {
      console.error('Erro ao carregar artigo corporativo:', err);
      if (titleEl) titleEl.textContent = 'Erro ao carregar artigo';
      showError(err.message || 'Erro inesperado ao carregar este artigo.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();