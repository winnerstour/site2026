
const SCROLL_SPEED = 8000;

// Função genérica de carrossel (mesma base da landing principal)
function initCarousel(carouselId, wrapperId, isMotivos = false) {
  const carousel = document.getElementById(carouselId);
  const wrapper = document.getElementById(wrapperId);
  if (!carousel || !wrapper) return;

  let scrollInterval;
  let isPaused = false;
  const cardWidth = 318;

  const scrollRight = () => {
    if (isPaused) return;

    const currentScroll = carousel.scrollLeft;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;

    if (currentScroll + carousel.clientWidth >= carousel.scrollWidth - 1) {
      carousel.scroll({ left: 0, behavior: 'smooth' });
    } else {
      carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  const startAutoplay = () => {
    clearInterval(scrollInterval);
    scrollInterval = setInterval(scrollRight, SCROLL_SPEED);
  };

  carousel.addEventListener('mouseover', () => { isPaused = true; });
  carousel.addEventListener('mouseleave', () => { isPaused = false; });

  startAutoplay();

  const prevButton = wrapper.querySelector('.carousel-nav.prev');
  const nextButton = wrapper.querySelector('.carousel-nav.next');

  if (prevButton && nextButton) {
    prevButton.addEventListener('click', () => {
      carousel.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    });
    nextButton.addEventListener('click', () => {
      carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
    });

    const checkScroll = () => {
      const currentScroll = carousel.scrollLeft;
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;

      if (window.innerWidth > 1024) {
        prevButton.style.display = currentScroll > 10 ? 'block' : 'none';
        nextButton.style.display = currentScroll < maxScroll - 10 ? 'block' : 'none';
      } else {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
      }
    };

    carousel.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    checkScroll();
  }
}

// Card de MOTIVO (aproveita o mesmo JSON do evento)
function renderMotivo(m) {
  const emoji = m.motivo_emoji || m.emoji || '✨';
  const title = m.motivo_titulo || m.title || 'Atração';
  const text = m.motivo_conteudo || m.content || '';

  return `
    <div class="cl-slide">
      <li class="motivo-item">
        <strong class="motivo-title-montserrat" style="display:flex; align-items:center;">
          <span class="emoji" aria-hidden="true">${emoji}</span>
          ${title.toUpperCase()}
        </strong>
        <p class="motivo-text-body">${text}</p>
      </li>
    </div>
  `;
}


document.addEventListener('DOMContentLoaded', async function () {
  const pageTitleEl = document.getElementById('pageTitle');
  const articleTitleEl = document.getElementById('articleTitle');
  const articleSubtitleEl = document.getElementById('articleSubtitle');
  const introEl = document.getElementById('articleIntro');
  const sectionsEl = document.getElementById('articleSections');
  const errorEl = document.getElementById('articleError');
  const ctaWaEl = document.getElementById('articleCtaWhatsApp');

  function showError(message, detail) {
    console.error('Erro ao carregar evento:', message, detail || '');
    if (!errorEl) return;
    errorEl.innerHTML = '<div class="error-box">' +
      (message || 'Não foi possível carregar este conteúdo agora.') +
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
    // tenta em: Eventos/, eventos/ e raiz
    const bases = ['Eventos/', 'eventos/', ''];
    const attempts = [];

    for (const base of bases) {
      const path = (base ? base : '') + slug + '.json';
      attempts.push(path);
      try {
        const resp = await fetch(path + '?t=' + Date.now());
        if (resp.ok) {
          const json = await resp.json();
          console.log('Evento carregado de:', path);
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
  // INÍCIO DA CARGA DO EVENTO
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
      showError('Formato de conteúdo inválido.', 'Verifique se o JSON possui a propriedade "sections".');
      return;
    }

    const titulo = data.titulo || data.title || 'Evento corporativo';
    const tituloCurto = data.titulo_curto || data.title || titulo;
    // micro categoria primeiro, depois categoria normal, depois macro
    const categoria = data.category_micro || data.categoria || data.category_macro || 'Feiras, Congressos & Eventos Corporativos';
    const youtubeInline = data['youtube-inline'] || data.youtube_inline || data.youtubeInline || data.YouTubeVideo || '';

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

    // CTA WhatsApp final com título curto do evento
    if (ctaWaEl) {
      const waMsg = 'Ol\u00e1! Li o conte\u00fado sobre "' + tituloCurto +
        '" no site da Winners Tour e quero ajuda para organizar a viagem da nossa equipe para esse evento.';
      const waHref = 'https://wa.me/5541999450111?text=' + encodeURIComponent(waMsg);
      ctaWaEl.href = waHref;
    }

    const sections = data.sections.slice();

    // Função para ordenar seções: numéricas em ordem; outras (CTA1, CTA2, etc.) vão para o final
    function sectionOrder(sec) {
      const n = Number(sec.id);
      if (Number.isFinite(n)) return n;
      return 9999;
    }

    sections.sort(function (a, b) {
      return sectionOrder(a) - sectionOrder(b);
    });

    // Introdução: seção id=1 numérica, se existir; senão, primeira seção
    let introSection = sections.find(function (s) { return Number(s.id) === 1; }) || sections[0];
    const rest = sections.filter(function (s) { return s !== introSection; });

    if (introEl && introSection) {
      introEl.innerHTML = renderMarkdown(introSection.conteudo_markdown || '');
    }

    if (!sectionsEl) return;

    let videoInserted = false;

    rest.forEach(function (sec) {
      const secNum = Number(sec.id);
      const isNumeric = Number.isFinite(secNum);

      // Imagens inline antes das seções 2 a 6 (apenas se id numérico)
      if (isNumeric && secNum >= 2 && secNum <= 6) {
        const imgFigure = createInlineImage(secNum, slug);
        sectionsEl.appendChild(imgFigure);
      }

      // Vídeo do YouTube antes da seção 7 (apenas se id numérico)
      if (!videoInserted && isNumeric && secNum === 7 && youtubeInline) {
        const videoNode = createInlineYoutube(youtubeInline);
        if (videoNode) {
          sectionsEl.appendChild(videoNode);
          videoInserted = true;
        }
      }

      const wrapper = document.createElement('section');
      wrapper.className = 'content-section';

      if (sec.titulo_secao && sec.titulo_secao !== 'CTA1' && sec.titulo_secao !== 'CTA2') {
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
    showError('Não foi possível carregar o conteúdo deste evento.', usedPath || ('slug: ' + slug));
    console.error('Erro ao carregar evento:', err);
  }
});
    // --- Carrossel de Motivos (motivos-section) ---
    (function () {
      const motivosWrapperEl = document.getElementById('motivosWrapper');
      const motivosContainerEl = document.getElementById('motivosContainer');
      if (!motivosWrapperEl || !motivosContainerEl) return;

      const extractedMotivos = [1, 2, 3, 4].map(function (index) {
        return {
          motivo_emoji: data['motivo_emoji_' + index],
          motivo_titulo: data['motivo_titulo_' + index],
          motivo_conteudo: data['motivo_conteudo_' + index]
        };
      });

      const finalMotivos = extractedMotivos
        .filter(function (m) { return m.motivo_titulo; })
        .concat(Array.isArray(data.motivos) ? data.motivos : []);

      if (finalMotivos.length > 0) {
        const motivoSlides = finalMotivos.map(renderMotivo).join('');
        motivosContainerEl.innerHTML = motivoSlides;
        motivosContainerEl.classList.add('cl-track');

        motivosWrapperEl.insertAdjacentHTML('beforeend', `
          <button class="carousel-nav prev">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
          </button>
          <button class="carousel-nav next">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
          </button>
        `);

        initCarousel('motivosContainer', 'motivosWrapper', true);
      } else {
        const heading = document.querySelector('.motivos-section h3');
        if (heading) heading.hidden = true;
        motivosWrapperEl.hidden = true;
      }
    })();

