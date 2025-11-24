// lazer-oferta.js
// Página de detalhe das ofertas de lazer (usa slug + JSON completo)

(function () {
  const titleEl          = document.getElementById('offerTitle');
  const categoryEl       = document.getElementById('offerCategory');
  const metaEl           = document.getElementById('offerMeta');
  const imgEl            = document.getElementById('offerImage');
  const introContainer   = document.getElementById('offerIntro');
  const sectionsContainer= document.getElementById('offerSections');
  const cta1Container    = document.getElementById('offerCta1');
  const bottomCtaButton  = document.getElementById('offerBottomCta');
  const errorContainer   = document.getElementById('offerError');
  const pageTitleTag     = document.getElementById('pageTitle');

  // Detecta /site2026 ou raiz para montar caminhos
  const BASE_PATH = window.location.pathname.startsWith('/site2026')
    ? '/site2026'
    : '';

  function showError(msg) {
    if (errorContainer) {
      errorContainer.innerHTML = '<div class=\"error-box\">' + (msg || 'Erro inesperado ao carregar esta oferta.') + '</div>';
    }
  }

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    return slug ? slug.trim() : '';
  }

  // Remove heading duplicado no início do markdown quando ele é igual ao título da seção
  function stripDuplicateHeading(md, secTitle) {
    if (!md || typeof md !== 'string') return md || '';
    if (!secTitle || typeof secTitle !== 'string') return md;

    const norm = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = norm.split('\n');
    if (!lines.length) return md;

    // primeira linha não vazia
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
    const secNorm   = String(secTitle).trim();

    if (firstNorm && firstNorm === secNorm) {
      const remaining = lines.slice(idx + 1);
      return remaining.join('\n');
    }

    return md;
  }

  // Converte markdown básico em HTML (parágrafos, headings, listas, negrito/itálico)
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
      // negrito **texto**
      t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // itálico *texto*
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

      // Headings
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

      // Lista simples com "-" ou "*"
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

      // Linha comum -> acumula para parágrafo
      paragraph.push(trimmed);
    }

    flushParagraph();
    if (inList) {
      html += '</ul>\n';
    }

    return html;
  }

  // Versão simplificada para usar em botões (CTA2)
  function markdownToInlineHtml(md) {
    if (!md || typeof md !== 'string') return '';
    let text = md.replace(/\r\n/g, ' ').replace(/\r/g, ' ').trim();
    // aplica apenas negrito/itálico inline
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return text;
  }

  function renderOfferFromJson(json, slug) {
    if (!json || typeof json !== 'object') {
      showError('O JSON desta oferta não está no formato esperado.');
      if (titleEl) titleEl.textContent = 'Oferta não encontrada';
      return;
    }

    const slugSafe  = slug || '';
    const titulo    = json.titulo || json.titulo_curto || slugSafe || 'Oferta de lazer';
    const categoria = json.categoria || '';
    const metaTitle = json.meta_title || titulo;

    // Título da aba
    if (pageTitleTag instanceof HTMLElement) {
      pageTitleTag.textContent = metaTitle;
    } else {
      document.title = metaTitle;
    }

    // Hero: título (com ajuste se for muito longo)
    if (titleEl) {
      titleEl.textContent = titulo;
      const len = titulo ? String(titulo).length : 0;
      if (len > 60) {
        titleEl.classList.add('hero-title-small');
      } else {
        titleEl.classList.remove('hero-title-small');
      }
    }

    // Hero: categoria
    if (categoryEl) {
      categoryEl.textContent = categoria || 'Lazer';
    }

    // Hero: meta (linha fina)
    if (metaEl) {
      metaEl.textContent = 'Oferta de viagem de lazer cuidadosamente curada pela WinnersTour.';
    }

    // Imagem principal
    if (imgEl) {
      let src = '';

      if (json.image_path) {
        const p = String(json.image_path);
        if (p.startsWith('/')) {
          src = BASE_PATH + p;
        } else {
          src = BASE_PATH + '/' + p;
        }
      } else if (slugSafe) {
        // fallback: tenta em /assets/lazer/slug.webp
        src = BASE_PATH + '/assets/lazer/' + encodeURIComponent(slugSafe) + '.webp';
      } else {
        src = BASE_PATH + '/assets/misc/placeholder-lazer.webp';
      }

      imgEl.src = src;
      imgEl.alt = titulo || 'Imagem da oferta de lazer';
    }

    // Seções
    const sections = Array.isArray(json.sections) ? json.sections : [];

    let cta1Text    = '';
    let cta2Text    = '';
    let introSection= null;
    const otherSections = [];

    sections.forEach(function(sec) {
      if (!sec || typeof sec !== 'object') return;

      const rawId   = sec.id;
      const title   = sec.titulo_secao || '';
      const idStr   = (typeof rawId === 'string') ? rawId : String(rawId || '');

      const tNorm = String(title).trim();

      if (tNorm === 'CTA1' || idStr === 'CTA1') {
        cta1Text = sec.conteudo_markdown || '';
        return;
      }
      if (tNorm === 'CTA2' || idStr === 'CTA2') {
        cta2Text = sec.conteudo_markdown || '';
        return;
      }
      if (tNorm === 'Introdução' || rawId === 1) {
        introSection = sec;
        return;
      }

      otherSections.push(sec);
    });

    // CTA1: texto do JSON, em markdown, no card superior
    if (cta1Container) {
      if (cta1Text) {
        cta1Container.innerHTML = markdownToHtml(cta1Text);
      } else {
        cta1Container.textContent = '';
      }
    }

    // Introdução: NÃO mostra o título "Introdução" e remove "### Introdução" do início
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

    // Demais seções (com títulos em H2 + markdown interno)
    if (sectionsContainer) {
      sectionsContainer.innerHTML = '';

      otherSections.forEach(function(sec) {
        const wrapper = document.createElement('article');
        wrapper.className = 'content-section';

        const title = sec.titulo_secao || '';
        const tNorm = String(title).trim().toLowerCase();

        // Por segurança, nunca renderiza H2 "Introdução" aqui
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

        sectionsContainer.appendChild(wrapper);
      });
    }

    // CTA2: texto curto/inline aplicado no botão final
    if (bottomCtaButton) {
      if (cta2Text) {
        bottomCtaButton.innerHTML = markdownToInlineHtml(cta2Text);
      }
    }
  }

  async function init() {
    const slug = getSlugFromUrl();

    if (!slug) {
      showError('Nenhuma oferta foi selecionada. Acesse a página de lazer e escolha um pacote.');
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
      showError(err.message || 'Erro inesperado ao carregar esta oferta.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
