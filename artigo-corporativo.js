document.addEventListener('DOMContentLoaded', async function () {
  const pageTitleEl = document.getElementById('pageTitle');
  const articleTitleEl = document.getElementById('articleTitle');
  const articleSubtitleEl = document.getElementById('articleSubtitle');
  const introEl = document.getElementById('articleIntro');
  const sectionsEl = document.getElementById('articleSections');
  const errorEl = document.getElementById('articleError');
  const ctaWaEl = document.getElementById('articleCtaWhatsApp');

  function showError(message, detail) {
    console.error('Erro ao carregar artigo corporativo:', message, detail || '');
    if (!errorEl) return;
    errorEl.innerHTML = '<div class="error-box">' +
      (message || 'Não foi possível carregar este artigo agora.') +
      (detail ? '<br><small>' + detail + '</small>' : '') +
      '</div>';
  }

  function renderMarkdown(md) {
    if (!md) return '';
    let text = md.trim();
    // Negrito **texto**
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    for (let rawLine of lines) {
      const line = rawLine.replace(/\r$/, '');

      // Títulos tipo "### Título" viram <h3>Título</h3>
      const headingMatch = line.match(/^\s*###\s+(.+)/);
      if (headingMatch) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<h3>' + headingMatch[1] + '</h3>';
        continue;
      }

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

  async function fetchJsonForSlug(slug) {
    const bases = ['Artigos/', 'artigos/', ''];
    const attempts = [];

    for (const base of bases) {
      const path = (base ? base : '') + slug + '.json';
      attempts.push(path);
      try {
        const resp = await fetch(path + '?t=' + Date.now());
        if (resp.ok) {
          const json = await resp.json();
          console.log('Artigo carregado de:', path);
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

  // ============================
  // INÍCIO DA CARGA DO ARTIGO
  // ============================
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    showError('Parâmetro "slug" não informado na URL.');
    return;
  }

  let usedPath = '';

  try {
    const result = await fetchJsonForSlug(slug);
    const data = result.data;
    usedPath = result.usedPath || '';

    if (!data || !Array.isArray(data.sections)) {
      showError('Formato de artigo inválido.', 'Verifique se o JSON possui a propriedade "sections".');
      return;
    }

    const titulo = data.titulo || 'Artigo corporativo';
    const tituloCurto = data.titulo_curto || titulo;
    const categoria = data.categoria || 'Artigo Corporativo';
    const youtubeInline = data['youtube-inline'] || data.youtube_inline || data.youtubeInline || '';

    // Título da aba
    if (pageTitleEl) {
      pageTitleEl.textContent = tituloCurto + ' — Winners Tour';
    }

    // Hero
    if (articleTitleEl) {
      articleTitleEl.textContent = titulo;
      if (titulo.length > 80) {
        articleTitleEl.classList.add('hero-title-small');
      }
    }
    if (articleSubtitleEl) {
      articleSubtitleEl.textContent = categoria;
    }

    // CTA WhatsApp final com título curto
    if (ctaWaEl) {
      const waMsg = 'Ol\u00e1! Li o artigo "' + tituloCurto +
        '" no site da Winners Tour e gostaria de ajuda com viagens corporativas.';
      const waHref = 'https://wa.me/5541999450111?text=' + encodeURIComponent(waMsg);
      ctaWaEl.href = waHref;
    }

    const sections = data.sections.slice().sort(function (a, b) {
      return (a.id || 0) - (b.id || 0);
    });

    const first = sections.find(function (s) { return s.id === 1; }) || sections[0];
    const rest = sections.filter(function (s) { return s !== first; });

    // Introdução (sem título "Introdução")
    if (introEl && first) {
      introEl.innerHTML = renderMarkdown(first.conteudo_markdown || '');
    }

    if (!sectionsEl) return;

    let videoInserted = false;

    rest.forEach(function (sec) {
      const secId = sec.id || 0;

      // Imagens inline antes das seções 2 a 6
      if (secId >= 2 && secId <= 6) {
        const imgIndex = secId; // img2, img3, ..., img6
        const imgFigure = createInlineImage(imgIndex, slug);
        sectionsEl.appendChild(imgFigure);
      }

      // Vídeo do YouTube antes da seção 7 (apenas uma vez)
      if (!videoInserted && secId === 7 && youtubeInline) {
        const videoNode = createInlineYoutube(youtubeInline);
        if (videoNode) {
          sectionsEl.appendChild(videoNode);
          videoInserted = true;
        }
      }

      // Bloco da seção
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
    showError('Não foi possível carregar o artigo corporativo.', usedPath || ('slug: ' + slug));
    console.error('Erro ao carregar artigo corporativo:', err);
  }
});
