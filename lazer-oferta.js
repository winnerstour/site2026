// lazer-oferta.js
// Página de detalhe das ofertas de lazer (usa slug + JSON completo)

(function () {
  const titleEl = document.getElementById('offerTitle');
  const categoryEl = document.getElementById('offerCategory');
  const metaEl = document.getElementById('offerMeta');
  const imgEl = document.getElementById('offerImage');
  const introContainer = document.getElementById('offerIntro');
  const sectionsContainer = document.getElementById('offerSections');
  const errorContainer = document.getElementById('offerError');
  const cta1El = document.getElementById('offerCta1');
  const cta2El = document.getElementById('offerCta2');

  const pageTitleTag = document.getElementById('pageTitle') || document.title;

  // Detecta /site2026 ou raiz
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';

  function showError(msg) {
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-box">
          ${msg}
        </div>
      `;
    }
  }

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    return slug ? slug.trim() : '';
  }

  // Escapa HTML básico
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Aplica markdown inline simples: **negrito**, *itálico*
  function applyInlineMarkdown(text) {
    if (!text) return '';
    // negrito primeiro
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // itálico simples
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return text;
  }

  // Remove heading markdown "### Título" duplicado
  
  function stripDuplicateHeading(md, secTitle) {
    if (!md || typeof md !== 'string') return md || '';
    if (!secTitle || typeof secTitle !== 'string') return md;

    const norm = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = norm.split('\n');
    if (!lines.length) return md;

    // pega primeira linha não vazia
    let idx = 0;
    while (idx < lines.length && !lines[idx].trim()) idx++;
    if (idx >= lines.length) return md;

    const firstRaw = lines[idx].trim();

    function normalizeHeadingText(line) {
      if (!line) return '';
      let t = String(line).trim();
      // remove hashes de heading no começo
      t = t.replace(/^#{1,6}\s+/, '');
      // remove marcadores de negrito/itálico envolvendo a linha inteira
      t = t.replace(/^[_*]+/, '').replace(/[_*]+$/, '');
      return t.trim();
    }

    const firstNorm = normalizeHeadingText(firstRaw);
    const secNorm = String(secTitle).trim();

    if (firstNorm && firstNorm === secNorm) {
      const remaining = lines.slice(idx + 1);
      return remaining.join('\n');
    }

    return md;
  }

function markdownToHtml(md) {
    if (!md || typeof md !== 'string') return '';
    const norm = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = norm.split('\n');

    const htmlLines = [];
    let inList = false;

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        // linha em branco: fecha lista se estiver aberta
        if (inList) {
          htmlLines.push('</ul>');
          inList = false;
        }
        return;
      }

      // headings markdown (###, ####, etc.)
      if (/^#{3,}\s+/.test(trimmed)) {
        if (inList) {
          htmlLines.push('</ul>');
          inList = false;
        }
        // remove #'s
        let level = 0;
        while (level < trimmed.length && trimmed[level] === '#') level++;
        let content = trimmed.slice(level).trim();
        content = escapeHtml(content);
        content = applyInlineMarkdown(content);
        // representamos h3/h4 como <p><strong>...</strong></p>
        htmlLines.push('<p><strong>' + content + '</strong></p>');
        return;
      }

      if (trimmed.startsWith('- ')) {
        // item de lista
        if (!inList) {
          htmlLines.push('<ul>');
          inList = true;
        }
        let item = trimmed.slice(2);
        item = escapeHtml(item);
        item = applyInlineMarkdown(item);
        htmlLines.push('<li>' + item + '</li>');
      } else {
        // parágrafo normal
        if (inList) {
          htmlLines.push('</ul>');
          inList = false;
        }
        let paragraph = escapeHtml(trimmed);
        paragraph = applyInlineMarkdown(paragraph);
        htmlLines.push('<p>' + paragraph + '</p>');
      }
    });

    if (inList) {
      htmlLines.push('</ul>');
    }

    return htmlLines.join('\n');
  }

  // Gera um único bloco com HTML pronto (usado por intro/sections)
  function mdToBlocks(md) {
    const html = markdownToHtml(md);
    return html ? [{ html }] : [];
  }

  // Normaliza o JSON da oferta (novo ou antigo) para o formato usado pelo render
  function normalizeData(raw, slug) {
    // Formato antigo já no jeito
    if (raw && raw.slug && raw.title && raw.intro && raw.sections) {
      // garante fallback de imagem
      if (!raw.image_path) {
        raw.image_path = raw.card_image || ('/assets/lazer/' + raw.slug + '.webp');
      }
      return raw;
    }

    // Formato novo: titulo, titulo_curto, categoria, sections[ {id, titulo_secao, conteudo_markdown} ]
    if (raw && raw.titulo && Array.isArray(raw.sections)) {
      const allSections = raw.sections;

      const cta1Section = allSections.find(s => s && s.id === 'CTA1');
      const cta2Section = allSections.find(s => s && s.id === 'CTA2');

      // intro = id 1 ou primeiro não-CTA
      let introSection = allSections.find(s => s && s.id === 1);
      if (!introSection) {
        introSection = allSections.find(s => s && s.id !== 'CTA1' && s.id !== 'CTA2') || allSections[0];
      }

      const contentSections = allSections.filter(
        s => s && s !== introSection && s.id !== 'CTA1' && s.id !== 'CTA2'
      );

      const intro = { blocks: mdToBlocks(introSection && introSection.conteudo_markdown) };

      const sections = contentSections.map(sec => {
        const title = sec.titulo_secao || '';
        const cleanedMd = stripDuplicateHeading(sec.conteudo_markdown || '', title);
        return {
          title,
          blocks: mdToBlocks(cleanedMd)
        };
      });

      const cta1Text = cta1Section && cta1Section.conteudo_markdown ? cta1Section.conteudo_markdown : '';
      const cta2Text = cta2Section && cta2Section.conteudo_markdown ? cta2Section.conteudo_markdown : '';

      return {
        slug: slug,
        title: raw.titulo,
        meta_title: raw.titulo,
        image_path: raw.image_path || raw.card_image || ('/assets/lazer/' + slug + '.webp'),
        category_macro: raw.categoria || 'Lazer',
        category_micro: '',
        intro,
        sections,
        cta1Text,
        cta2Text
      };
    }

    throw new Error('O JSON desta oferta não está no formato esperado.');
  }

  function buildIntro(intro) {
    introContainer.innerHTML = '';

    if (!intro || !Array.isArray(intro.blocks)) {
      const p = document.createElement('p');
      p.textContent = 'Conteúdo introdutório indisponível para esta oferta.';
      introContainer.appendChild(p);
      return;
    }

    intro.blocks.forEach((block) => {
      if (!block) return;
      const wrapper = document.createElement('div');
      if (block.html) {
        wrapper.innerHTML = block.html;
      } else if (block.text) {
        const p = document.createElement('p');
        p.textContent = block.text;
        wrapper.appendChild(p);
      }
      introContainer.appendChild(wrapper);
    });
  }

  function buildSections(sections) {
    sectionsContainer.innerHTML = '';

    if (!Array.isArray(sections) || !sections.length) {
      const p = document.createElement('p');
      p.textContent = 'Detalhes adicionais não disponíveis para esta oferta.';
      sectionsContainer.appendChild(p);
      return;
    }

    sections.forEach((section) => {
      const wrapper = document.createElement('article');
      wrapper.className = 'content-section';

      if (section.title) {
        const h2 = document.createElement('h2');
        h2.textContent = section.title;
        wrapper.appendChild(h2);
      }

      if (Array.isArray(section.blocks)) {
        section.blocks.forEach((block) => {
          if (!block) return;
          if (block.html) {
            const div = document.createElement('div');
            div.innerHTML = block.html;
            wrapper.appendChild(div);
          } else if (block.text) {
            const p = document.createElement('p');
            p.textContent = block.text;
            wrapper.appendChild(p);
          }
        });
      }

      sectionsContainer.appendChild(wrapper);
    });
  }

  // Preenche a barra de CTA (CTA1 + CTA2) se existirem no JSON
  function renderCtas(data) {
    if (cta1El && data && typeof data.cta1Text === 'string' && data.cta1Text.trim()) {
      const html = markdownToHtml(data.cta1Text);
      cta1El.innerHTML = html;
    }

    if (cta2El && data && typeof data.cta2Text === 'string' && data.cta2Text.trim()) {
      let txt = data.cta2Text.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
      txt = escapeHtml(txt);
      txt = applyInlineMarkdown(txt);
      if (!/^👉/.test(txt)) {
        txt = '👉 ' + txt;
      }
      cta2El.innerHTML = txt;
    }
  }

  function renderOffer(data) {
    const {
      meta_title,
      title,
      image_path,
      category_macro,
      category_micro,
      intro,
      sections
    } = data;

    const finalTitle = meta_title || title || 'Oferta de Lazer — WinnersTour';
    if (pageTitleTag instanceof HTMLElement) {
      pageTitleTag.textContent = finalTitle;
    } else {
      document.title = finalTitle;
    }

    if (titleEl) {
      titleEl.textContent = title || 'Oferta sem título definido';
    }

    const macro = category_macro || '';
    const micro = category_micro || '';
    const catText = [macro, micro].filter(Boolean).join(' · ');
    if (categoryEl) {
      categoryEl.textContent = catText || 'Lazer';
    }

    if (metaEl) {
      metaEl.textContent = 'Oferta de viagem de lazer cuidadosamente curada pela WinnersTour.';
    }

    if (imgEl) {
      let resolvedPath = image_path || '';
      let src = '';

      if (!resolvedPath) {
        if (data.slug) {
          resolvedPath = '/assets/lazer/' + data.slug + '.webp';
        } else {
          resolvedPath = '/assets/misc/placeholder-lazer.webp';
        }
      }

      if (resolvedPath.startsWith('/')) {
        src = BASE_PATH + resolvedPath;
      } else {
        src = BASE_PATH + '/' + resolvedPath;
      }

      imgEl.src = src || (BASE_PATH + '/assets/misc/placeholder-lazer.webp');
      imgEl.alt = title || 'Imagem da oferta de lazer';
    }

    renderCtas(data);
    buildIntro(intro);
    buildSections(sections);
  }

  async function init() {
    const slug = getSlugFromUrl();

    if (!slug) {
      showError('Nenhuma oferta foi selecionada. Acesse a página de lazer e escolha um resort.');
      if (titleEl) titleEl.textContent = 'Oferta não encontrada';
      return;
    }

    const dataUrl = `${BASE_PATH}/lazer/${encodeURIComponent(slug)}.json`;

    try {
      const response = await fetch(dataUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Não foi possível carregar o arquivo ${dataUrl}`);
      }

      const raw = await response.json();
      console.log('[DEBUG JSON OFERTA RAW]', raw);

      const data = normalizeData(raw, slug);
      renderOffer(data);
    } catch (err) {
      console.error('Erro ao carregar oferta de lazer:', err);
      if (titleEl) titleEl.textContent = 'Erro ao carregar oferta';
      showError(err.message || 'Erro inesperado ao carregar esta oferta.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
