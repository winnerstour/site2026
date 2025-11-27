// lazer-oferta.js
// Página de detalhe das ofertas de lazer (usa slug + JSON completo em /lazer/slug.json)

document.addEventListener('DOMContentLoaded', async function () {
  const pageTitleEl       = document.getElementById('pageTitle');
  const articleTitleEl    = document.getElementById('articleTitle');
  const articleSubtitleEl = document.getElementById('articleSubtitle');
  const introEl           = document.getElementById('articleIntro');
  const sectionsEl        = document.getElementById('articleSections');
  const errorEl           = document.getElementById('articleError');
  const ctaWaEl           = document.getElementById('articleCtaWhatsApp');
  const cta2TextEl        = document.getElementById('offerCta2Text');
  const heroWaBtn         = document.getElementById('heroWaBtn');

  function showError(message, detail) {
    console.error('Erro ao carregar oferta de lazer:', message, detail || '');
    if (!errorEl) return;
    errorEl.innerHTML = '<div class="error-box">' +
      (message || 'Não foi possível carregar esta oferta agora.') +
      (detail ? '<br><small>' + detail + '</small>' : '') +
      '</div>';
  }

  function renderMarkdown(md) {
    if (!md) return '';
    let text = md.trim();
    // Negrito *texto*
    text = text.replace(/\\(.+?)\\/g, '<strong>$1</strong>');
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    for (let rawLine of lines) {
      const line = rawLine.replace(/\r$/, '');
      if (/^\s*-\s+/.test(line)) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += '<li>' + line.replace(/^\s*-\s+/, '') + '</li>';
      } else if (line.trim() === '') {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<p>' + line + '</p>';
      }
    }
    if (inList) html += '</ul>';
    return html;
  }

  function markdownToPlain(md) {
    if (!md) return '';
    // remove negritos, itálicos, etc., e normaliza espaço
    let text = md.replace(/\\(.+?)\\/g, '$1');
    text = text.replace(/[_*`]/g, '');
    text = text.replace(/\s+/g, ' ');
    return text.trim();
  }

  function buildYoutubeEmbedUrl(url) {
    if (!url) return null;
    try {
      if (url.includes('/embed/')) {
        return url;
      }
      const u = new URL(url);
      let videoId = null;

      if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.replace('/', '');
      } else {
        videoId = u.searchParams.get('v');
      }
      if (!videoId) return null;

      return 'https://www.youtube.com/embed/' + videoId + '?rel=0';
    } catch (e) {
      console.warn('Não foi possível interpretar URL do YouTube:', url, e);
      return null;
    }
  }

  function createInlineImage(imgIndex, slug) {
    const figure = document.createElement('figure');
    figure.className = 'inline-media inline-media-image';
    figure.style.margin = '26px 0';
    figure.style.borderRadius = '20px';
    figure.style.overflow = 'hidden';
    figure.style.boxShadow = '0 16px 40px rgba(15,23,42,0.18)';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = '';
    img.src = 'assets/inline/img' + imgIndex + slug + '.webp';

    img.addEventListener('error', function () {
      if (figure && figure.parentNode) {
        figure.parentNode.removeChild(figure);
      }
    });

    figure.appendChild(img);
    return figure;
  }

  function createInlineYoutube(youtubeUrl) {
    const embedUrl = buildYoutubeEmbedUrl(youtubeUrl);
    if (!embedUrl) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'inline-media inline-media-video';
    wrapper.style.margin = '30px 0';

    const aspect = document.createElement('div');
    aspect.style.position = 'relative';
    aspect.style.paddingTop = '56.25%';
    aspect.style.borderRadius = '20px';
    aspect.style.overflow = 'hidden';
    aspect.style.boxShadow = '0 20px 45px rgba(15,23,42,0.28)';

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.title = 'Vídeo do YouTube';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';

    aspect.appendChild(iframe);
    wrapper.appendChild(aspect);
    return wrapper;
  }

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    return slug ? slug.trim() : '';
  }

  async function fetchJsonForSlug(slug) {
    // Mantém convenção /lazer/slug.json, com alguns fallbacks simples
    const bases = ['lazer/', 'Lazer/', ''];
    const attempts = [];

    for (const base of bases) {
      const path = (base ? base : '') + slug + '.json';
      attempts.push(path);
      try {
        const resp = await fetch(path + '?t=' + Date.now());
        if (resp.ok) {
          const json = await resp.json();
          console.log('Oferta de lazer carregada de:', path);
          return { data: json, usedPath: path };
        } else {
          console.warn('Falha ao tentar', path, 'status', resp.status);
        }
      } catch (e) {
        console.warn('Erro ao tentar carregar', path, e);
      }
    }

    throw new Error('Nenhum dos caminhos funcionou: ' + attempts.join(', '));
  }

  function findSectionById(sections, idWanted) {
    const target = String(idWanted).toUpperCase();
    return sections.find(function (s) {
      return String(s.id).toUpperCase() === target ||
             String(s.titulo_secao || '').toUpperCase() === target;
    }) || null;
  }

  // ============================
  // INÍCIO DA CARGA DA OFERTA
  // ============================
  const slug = getSlugFromUrl();

  if (!slug) {
    showError('Nenhuma oferta foi selecionada. Volte à página de lazer e escolha um pacote.');
    if (articleTitleEl) {
      articleTitleEl.textContent = 'Oferta de lazer não encontrada';
    }
    return;
  }

  let usedPath = '';

  try {
    const result = await fetchJsonForSlug(slug);
    const data = result.data;
    usedPath = result.usedPath || '';

    if (!data || !Array.isArray(data.sections)) {
      showError('Formato de oferta inválido.', 'Verifique se o JSON possui a propriedade "sections".');
      return;
    }

    const sections = data.sections.slice();

    const titulo      = data.titulo || 'Oferta de lazer';
    const tituloCurto = data.titulo_curto || titulo;
    const categoria   = data.categoria || 'Lazer';

    const cta1Sec = findSectionById(sections, 'CTA1');
    const cta2Sec = findSectionById(sections, 'CTA2');

    const cta1TextMd = cta1Sec ? (cta1Sec.conteudo_markdown || '') : '';
    const cta2TextMd = cta2Sec ? (cta2Sec.conteudo_markdown || '') : '';

    const youtubeInline = data['youtube-inline'] || data.youtube_inline || data.youtubeInline || '';

    // Título da aba
    if (pageTitleEl) {
      pageTitleEl.textContent = tituloCurto + ' — Winners Tour';
    }

    // Hero: título e subtítulo com CTA1 em modo "resumo"
    if (articleTitleEl) {
      articleTitleEl.textContent = titulo;
      if (titulo.length > 80) {
        articleTitleEl.classList.add('hero-title-small');
      }
    }
    if (articleSubtitleEl) {
      articleSubtitleEl.textContent = markdownToPlain(cta1TextMd);
    }

    // Whatsapp – mensagem de orçamento com título curto
    const waMsg = 'Ol\u00e1! Gostaria de fazer um or\u00e7amento para a oferta de lazer "' +
      tituloCurto + '" que vi no site da Winners Tour.';
    const waHref = 'https://wa.me/5541999450111?text=' + encodeURIComponent(waMsg);

    if (ctaWaEl) {
      ctaWaEl.href = waHref;
    }
    if (heroWaBtn) {
      heroWaBtn.href = waHref;
    }

    // CTA2 no card final
    if (cta2TextEl) {
      if (cta2TextMd) {
        cta2TextEl.innerHTML = renderMarkdown(cta2TextMd);
      } else {
        cta2TextEl.textContent =
          'Envie suas datas e cidade de saída para nossa equipe e receba um desenho completo de voos e hospedagens para este roteiro.';
      }
    }

    // Seções numéricas: introdução + demais
    const numericSections = sections.filter(function (s) {
      const n = Number(s.id);
      return Number.isFinite(n);
    });

    numericSections.sort(function (a, b) {
      return Number(a.id) - Number(b.id);
    });

    const introSection = numericSections.find(function (s) { return Number(s.id) === 1; }) || numericSections[0];
    const restSections = numericSections.filter(function (s) { return s !== introSection; });

    if (introEl && introSection) {
      introEl.innerHTML = renderMarkdown(introSection.conteudo_markdown || '');
    }

    if (!sectionsEl) return;

    let videoInserted = false;

    restSections.forEach(function (sec) {
      const secNum = Number(sec.id);
      const isNumeric = Number.isFinite(secNum);

      // Imagens inline antes das seções 2 a 6
      if (isNumeric && secNum >= 2 && secNum <= 6) {
        const imgFigure = createInlineImage(secNum, slug);
        sectionsEl.appendChild(imgFigure);
      }

      // Vídeo do YouTube antes da seção 7 (apenas uma vez)
      if (!videoInserted && isNumeric && secNum === 7 && youtubeInline) {
        const videoNode = createInlineYoutube(youtubeInline);
        if (videoNode) {
          sectionsEl.appendChild(videoNode);
          videoInserted = true;
        }
      }

      const wrapper = document.createElement('section');
      wrapper.className = 'content-section';

      if (sec.titulo_secao) {
        const h2 = document.createElement('h2');
        h2.textContent = sec.titulo_secao;
        wrapper.appendChild(h2);
      }

      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = renderMarkdown(sec.conteudo_markdown || '');
      wrapper.appendChild(contentDiv);

      sectionsEl.appendChild(wrapper);
    });
  } catch (err) {
    showError('Não foi possível carregar esta oferta de lazer.', usedPath || ('slug: ' + slug));
    console.error('Erro ao carregar oferta de lazer:', err);
  }
});
