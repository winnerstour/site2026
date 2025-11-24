// lazer-oferta.js
// Página de detalhe das ofertas de lazer (usa slug + JSON completo no formato "novo")

(function () {
  const titleEl = document.getElementById('offerTitle');
  const categoryEl = document.getElementById('offerCategory');
  const metaEl = document.getElementById('offerMeta');
  const imgEl = document.getElementById('offerImage');
  const introContainer = document.getElementById('offerIntro');
  const sectionsContainer = document.getElementById('offerSections');
  const errorContainer = document.getElementById('offerError');
  const cta1Container = document.getElementById('offerCta1');
  const bottomCtaButton = document.getElementById('offerBottomCta');

  const pageTitleTag = document.getElementById('pageTitle') || document.title;

  // Detecta /site2026 ou raiz
  const BASE_PATH = window.location.pathname.indexOf('/site2026') === 0 ? '/site2026' : '';

  function showError(msg) {
    if (errorContainer) {
      errorContainer.innerHTML = '<div class="error-box">' + msg + '</div>';
    }
  }

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    return slug ? slug.trim() : '';
  }

  function normaliseNewlines(str) {
    return String(str || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  // Remove heading duplicado no início do markdown quando ele repete o título da seção
  function stripDuplicateHeading(markdown, sectionTitle) {
    if (!markdown || !sectionTitle) return markdown || '';
    const norm = normaliseNewlines(markdown);
    const lines = norm.split('\n');

    let firstIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        firstIdx = i;
        break;
      }
    }
    if (firstIdx === -1) return markdown;

    const firstLine = lines[firstIdx].trim();

    function normalizeHeadingText(line) {
      let t = String(line || '').trim();
      // remove ###, #### etc
      t = t.replace(/^#{1,6}\s+/, '');
      // remove negrito/itálico markdown
      t = t.replace(/^[_*]+/, '').replace(/[_*]+$/, '');
      return t.trim();
    }

    const firstNorm = normalizeHeadingText(firstLine);
    const secNorm = normalizeHeadingText(sectionTitle);

    if (firstNorm && secNorm && firstNorm === secNorm) {
      return lines.slice(firstIdx + 1).join('\n');
    }
    return markdown;
  }

  function formatInline(text) {
    if (!text) return '';
    let t = String(text);

    // negrito: **texto**
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // itálico: *texto*
    t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return t;
  }

  // Converte markdown "simples" (títulos, listas, parágrafos, negrito, itálico) para HTML
  function markdownToHtml(md) {
    if (!md) return '';
    const lines = normaliseNewlines(md).split('\n');

    let html = '';
    let inList = false;
    let paraLines = [];

    function flushParagraph() {
      if (!paraLines.length) return;
      const text = paraLines.join(' ').trim();
      if (text) {
        html += '<p>' + formatInline(text) + '</p>';
      }
      paraLines = [];
    }

    function closeList() {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();

      if (!trimmed) {
        flushParagraph();
        closeList();
        continue;
      }

      // títulos markdown (#, ##, ###, #### etc)
      const mHeading = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (mHeading) {
        flushParagraph();
        closeList();
        const level = mHeading[1].length;
        const content = formatInline(mHeading[2].trim());
        let tag = 'h3';
        if (level === 1) tag = 'h2';
        else if (level === 2) tag = 'h3';
        else if (level === 3) tag = 'h3';
        else if (level === 4) tag = 'h4';
        else if (level === 5) tag = 'h5';
        else tag = 'h6';

        html += '<' + tag + '>' + content + '</' + tag + '>';
        continue;
      }

      // itens de lista "- " ou "* "
      if (/^[-*]\s+/.test(trimmed)) {
        flushParagraph();
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        const itemText = trimmed.replace(/^[-*]\s+/, '');
        html += '<li>' + formatInline(itemText) + '</li>';
        continue;
      }

      // texto normal -> acumula no parágrafo
      paraLines.push(trimmed);
    }

    flushParagraph();
    closeList();
    return html;
  }

  function markdownToInlineHtml(md) {
    const full = markdownToHtml(md).trim();
    if (full.startsWith('<p>') && full.endsWith('</p>')) {
      return full.slice(3, -4);
    }
    return full;
  }

  function renderOfferFromJson(data, slug) {
    if (!data || typeof data !== 'object') {
      throw new Error('JSON da oferta vazio ou inválido.');
    }

    const titulo = data.titulo || data.titulo_curto || slug || 'Oferta de lazer';
    const categoria = data.categoria || data.categoria_macro || 'Lazer';

    // Título da aba
    const finalTitle = titulo + ' — WinnersTour Lazer';
    if (pageTitleTag instanceof HTMLElement) {
      pageTitleTag.textContent = finalTitle;
    } else {
      document.title = finalTitle;
    }

    // Hero: título
    if (titleEl) {
      titleEl.textContent = titulo;
    }

    // Hero: categoria (opcional, hoje está oculto via CSS)
    if (categoryEl) {
      categoryEl.textContent = categoria;
    }

    if (metaEl) {
      metaEl.textContent = 'Oferta de viagem de lazer cuidadosamente curada pela WinnersTour.';
    }

    // Imagem principal: busca em /assets/lazer/<slug>.webp
    if (imgEl) {
      let src = '';
      if (data.image_path) {
        if (data.image_path.charAt(0) === '/') {
          src = BASE_PATH + data.image_path;
        } else {
          src = BASE_PATH + '/' + data.image_path;
        }
      } else if (slug) {
        src = BASE_PATH + '/assets/lazer/' + encodeURIComponent(slug) + '.webp';
      }

      imgEl.src = src || (BASE_PATH + '/assets/misc/placeholder-lazer.webp');
      imgEl.alt = titulo;
    }

    const allSections = Array.isArray(data.sections) ? data.sections : [];

    let introMd = '';
    let cta1Text = '';
    let cta2Text = '';

    const contentSections = [];

    allSections.forEach(function (sec) {
      if (!sec) return;
      const id = sec.id;
      const tituloSecao = sec.titulo_secao || '';
      const conteudo = sec.conteudo_markdown || '';

      const idStr = String(id || '').trim();
      const tituloLower = String(tituloSecao).trim().toLowerCase();

      const isCTA1 = idStr === 'CTA1' || tituloSecao === 'CTA1';
      const isCTA2 = idStr === 'CTA2' || tituloSecao === 'CTA2';
      const isIntro = idStr === '1' || tituloLower === 'introdução';

      if (isCTA1) {
        cta1Text = conteudo || '';
        return;
      }
      if (isCTA2) {
        cta2Text = conteudo || '';
        return;
      }
      if (isIntro) {
        introMd = conteudo || '';
        return;
      }

      contentSections.push(sec);
    });

    // CTA1: usa exatamente o texto que vem do JSON (em markdown simples)
    if (cta1Container) {
      if (cta1Text) {
        cta1Container.innerHTML = markdownToHtml(cta1Text);
      }
    }

    // CTA2: agora vai apenas no botão FINAL da página
    if (bottomCtaButton) {
      if (cta2Text) {
        bottomCtaButton.innerHTML = markdownToInlineHtml(cta2Text);
      }
    }

    // Intro
    if (introContainer) {
      introContainer.innerHTML = '';
      if (introMd) {
        introContainer.innerHTML = markdownToHtml(introMd);
      }
    }

    // Demais seções
    if (sectionsContainer) {
      sectionsContainer.innerHTML = '';

      if (!contentSections.length) {
        const p = document.createElement('p');
        p.textContent = 'Detalhes adicionais não disponíveis para esta oferta.';
        sectionsContainer.appendChild(p);
      } else {
        contentSections.forEach(function (sec) {
          const tituloSecao = sec.titulo_secao || '';
          let conteudo = sec.conteudo_markdown || '';

          const wrapper = document.createElement('article');
          wrapper.className = 'content-section';

          if (tituloSecao) {
            const h2 = document.createElement('h2');
            h2.textContent = tituloSecao;
            wrapper.appendChild(h2);
          }

          conteudo = stripDuplicateHeading(conteudo, tituloSecao);
          const html = markdownToHtml(conteudo);
          if (html) {
            wrapper.insertAdjacentHTML('beforeend', html);
          }

          sectionsContainer.appendChild(wrapper);
        });
      }
    }
  }

  async function init() {
    const slug = getSlugFromUrl();

    if (!slug) {
      showError('Nenhuma oferta foi selecionada. Acesse a página de lazer e escolha um roteiro.');
      if (titleEl) titleEl.textContent = 'Oferta não encontrada';
      return;
    }

    const dataUrl = BASE_PATH + '/lazer/' + encodeURIComponent(slug) + '.json';

    try {
      const response = await fetch(dataUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Não foi possível carregar o arquivo ' + dataUrl);
      }

      const data = await response.json();
      renderOfferFromJson(data, slug);
    } catch (err) {
      console.error('Erro ao carregar oferta de lazer:', err);
      if (titleEl) titleEl.textContent = 'Erro ao carregar oferta';
      showError(err && err.message ? err.message : 'Erro inesperado ao carregar esta oferta.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
