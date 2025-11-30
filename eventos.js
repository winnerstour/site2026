const VENUE_DATA_PATH = 'venue-data/';

const BASE_PATH = '/site2026';

function fixPath(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith(BASE_PATH + '/')) return path;
  if (path.startsWith('/')) return BASE_PATH + path;
  return BASE_PATH + '/' + path;
}



// Monta URL de busca no ComprarViagem para o hotel selecionado
function buildHotelBookingUrl(hotel, eventMeta) {
  if (!hotel) return '#';
  const baseUrl = 'https://www.comprarviagem.com.br/busca-hotel'; // ajuste se o path for diferente

  const hotelId = hotel.hotel_id || hotel.id || hotel.code || hotel.codigo || '';
  const hotelName = hotel.name || hotel.titulo || '';

  const params = [];

  if (hotelId) params.push('hotelId=' + encodeURIComponent(hotelId));
  if (hotelName) params.push('hotel=' + encodeURIComponent(hotelName));

  if (eventMeta) {
    if (eventMeta.title) {
      params.push('evento=' + encodeURIComponent(eventMeta.title));
    }
    if (eventMeta.startDate) {
      params.push('checkin=' + encodeURIComponent(eventMeta.startDate));
    }
    if (eventMeta.endDate) {
      params.push('checkout=' + encodeURIComponent(eventMeta.endDate));
    }
  }

  const query = params.join('&');
  return baseUrl + (query ? ('?' + query) : '');
}


const SCROLL_SPEED = 8000;

// Carrossel genérico (mesma base da landing principal)
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

// Card de MOTIVO


// Card simples de HOTEL (versão enxuta para o artigo)


function renderHotelCard(hotel, eventMeta) {
  if (!hotel) return '';
  const name = hotel.name || hotel.titulo || 'Hotel';

  const price = hotel.nightly_from_brl || hotel.price_from || hotel.preco_desde;
  const roomspace = hotel.roomspace || hotel.tamanho_quarto;
  const stars = hotel.stars || hotel.classificacao;

  const roomInfo = roomspace ? `🏠 ${roomspace}m²` : '';

  let priceLevel = '';
  const priceNumber = price != null ? Number(price) : null;
  if (!Number.isNaN(priceNumber) && priceNumber > 0) {
    if (priceNumber < 300) priceLevel = '$';
    else if (priceNumber < 500) priceLevel = '$$';
    else priceLevel = '$$$';
  }

  let starsText = '';
  if (stars && Number(stars) > 0) {
    const n = Math.round(Number(stars));
    starsText = '★'.repeat(n);
  }

  const infoParts = [];
  if (roomInfo) infoParts.push(roomInfo);
  if (priceLevel) infoParts.push(priceLevel);
  if (starsText) infoParts.push(starsText);
  const secondaryInfo = infoParts.join(' | ');

  const rawImage = hotel.image || hotel.imagem || '/assets/hotels/default.webp';
  const image = fixPath(rawImage);

  const href = buildHotelBookingUrl(hotel, eventMeta);

  return `
    <div class="cl-slide">
      <div class="hotel-card">
        <div class="thumb">
          <img loading="lazy" src="${image}" alt="${name}">
          <div class="hotel-chip">
            <div class="hotel-chip-line hotel-chip-name">${name}</div>
            ${secondaryInfo ? `<div class="hotel-chip-line hotel-chip-info">${secondaryInfo}</div>` : ''}
          </div>
          <a href="${href}" class="btn-hotel-primary btn-hotel-overlay" target="_blank" rel="noopener noreferrer">
            Ver detalhes do hotel
          </a>
        </div>
      </div>
    </div>
  `;
}
// Card de MOTIVO
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

    // Negrito **texto** e itálico *texto*
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

    const lines = text.split('\n');
    let html = '';
    let inList = false;

    for (let rawLine of lines) {
      const line = rawLine.replace(/\r$/, '');

      // Listas com "- "
      if (/^\s*-\s+/.test(line)) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += '<li>' + line.replace(/^\s*-\s+/, '') + '</li>';
        continue;
      }

      // Linha em branco fecha lista
      if (line.trim() === '') {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }

      // Se sair de lista, fecha
      if (inList) {
        html += '</ul>';
        inList = false;
      }

      // Títulos Markdown (#, ##, ###)
      const headingMatch = line.match(/^\s*(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2].trim();

        if (level === 1 || level === 3) {
          if (content) {
            html += '<p><strong>' + content + '</strong></p>';
          }
        }
        // level 2 (##) é ignorado aqui, pois já aparece no título laranja
        continue;
      }

      // Linha normal -> parágrafo
      html += '<p>' + line + '</p>';
    }

    if (inList) html += '</ul>';
    return html;
  }


  // Utilitários de data para o subtítulo
  function parseIsoDateToParts(isoDate) {
    if (!isoDate) return null;
    const [year, month, day] = isoDate.split('-').map(Number);
    if (!year || !month || !day) return null;
    return { year, month, day };
  }

  function formatDateRangePtBr(startIso, endIso) {
    const s = parseIsoDateToParts(startIso);
    const e = parseIsoDateToParts(endIso);
    if (!s && !e) return '';
    if (s && !e) {
      return new Date(startIso + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }
    if (!s && e) {
      return new Date(endIso + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }

    const sameMonth = s.year === e.year && s.month === e.month;
    if (sameMonth) {
      const startDay = String(s.day).padStart(2, '0');
      const fullEnd = new Date(endIso + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      return `${startDay} a ${fullEnd}`;
    }

    const fullStart = new Date(startIso + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const fullEnd = new Date(endIso + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    return `${fullStart} a ${fullEnd}`;
  }

  function buildSubtitle(startDate, endDate, localEvento, categoria) {
    const range = formatDateRangePtBr(startDate, endDate);
    const parts = [];
    if (range) parts.push(range);
    if (localEvento) parts.push(localEvento);
    if (categoria) parts.push(categoria);
    return parts.join(' • ');
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
    img.src = fixPath('assets/inline/img' + imgIndex + slug + '.webp');

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
    const categoria = data.category_micro || data.categoria || data.category || data.category_macro || 'Feiras, Congressos & Eventos Corporativos';
    const startDate = data.startDate || data.start_date || data.data_inicio || data.dataInicio || '';
    const endDate = data.endDate || data.end_date || data.data_fim || data.dataFim || '';
    const localEvento = data.local || data.local_evento || data.localEvento || data.venue_name || '';
    const subtitleText = buildSubtitle(startDate, endDate, localEvento, categoria);

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
      articleSubtitleEl.textContent = subtitleText || categoria;
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


    // Reordenar seções para garantir a sequência: 3, CTA3, 4, CTA4, 5, CTA5
    const orderedSections = [];
    const sectionsById = {};

    rest.forEach(function (sec) {
      const idStr = sec.id != null ? String(sec.id) : '';
      if (idStr) {
        sectionsById[idStr] = sec;
      }
    });

    ['3', '4', '5'].forEach(function (baseId) {
      const main = sectionsById[baseId];
      if (main && orderedSections.indexOf(main) === -1) {
        orderedSections.push(main);
      }
      const cta = sectionsById['CTA' + baseId];
      if (cta && orderedSections.indexOf(cta) === -1) {
        orderedSections.push(cta);
      }
    });

    // Adiciona qualquer seção que não tenha entrado ainda (inclusive outras CTAs)
    rest.forEach(function (sec) {
      if (orderedSections.indexOf(sec) === -1) {
        orderedSections.push(sec);
      }
    });

    orderedSections.forEach(function (sec) {
      const secNum = Number(sec.id);
      const isNumeric = Number.isFinite(secNum);

      // Imagens inline antes das seções 2 a 6 (apenas se id numérico simples)
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
      if (sec.id != null) {
        wrapper.setAttribute('data-sec-id', String(sec.id));
      }

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

    
    // --- Carrossel de Hotéis (entre CTA4 e CTA5) ---
    (async function () {
      const container = document.getElementById('articleSections');
      if (!container) return;

      const venueSlugRaw = data.venue_slug || data.local_slug || data.venue || data.centro_evento_slug;
      if (!venueSlugRaw) return;

      function slugifyVenueName(str) {
        if (!str) return '';
        return String(str)
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      const venueSlugCandidates = [];
      venueSlugCandidates.push(venueSlugRaw);
      const normalizedVenue = slugifyVenueName(venueSlugRaw);
      if (normalizedVenue && normalizedVenue !== venueSlugRaw) {
        venueSlugCandidates.push(normalizedVenue);
      }

      // Posição: depois da seção de CTA de hospedagem (CTA4), com fallbacks
      const sections = Array.from(container.querySelectorAll('.content-section'));
      const byId = {};
      sections.forEach(function (secEl) {
        const idAttr = secEl.getAttribute('data-sec-id');
        if (idAttr) {
          byId[idAttr] = secEl;
        }
      });

      let anchor = null;
      const preferredOrder = ['CTA4', '4', 'CTA3', '3'];
      for (let i = 0; i < preferredOrder.length; i++) {
        const key = preferredOrder[i];
        if (byId[key]) {
          anchor = byId[key];
          break;
        }
      }

      const hotelsSection = document.createElement('section');
      hotelsSection.className = 'hotels-section';
      hotelsSection.id = 'hotelsSection';
      hotelsSection.innerHTML = `
        <h3 class="wrap font-black text-center uppercase">Hotéis sugeridos perto do pavilhão</h3>
        <div id="hotelsWrapper" class="hotels-wrapper wrap">
          <div id="hotelsCarouselContainer" class="carousel hotels-carousel">
            <div id="hotelsCarousel" class="carousel-track hotels-track"></div>
          </div>
        </div>
      `;

      if (anchor && anchor.nextSibling) {
        container.insertBefore(hotelsSection, anchor.nextSibling);
      } else {
        container.appendChild(hotelsSection);
      }

      let venueData = null;

      for (let i = 0; i < venueSlugCandidates.length; i++) {
        const candidate = venueSlugCandidates[i];
        try {
          const venueResponse = await fetch(VENUE_DATA_PATH + candidate + '.json');
          if (venueResponse.ok) {
            venueData = await venueResponse.json();
            console.log('venue-data carregado de:', VENUE_DATA_PATH + candidate + '.json');
            break;
          } else {
            console.warn('Falha ao tentar venue-data para', candidate, 'status', venueResponse.status);
          }
        } catch (err) {
          console.warn('Erro ao tentar venue-data para', candidate, err);
        }
      }

      if (!venueData) {
        hotelsSection.style.display = 'none';
        return;
      }

      const hotelsCarouselEl = document.getElementById('hotelsCarousel');
      const hotelsWrapperEl = document.getElementById('hotelsWrapper');

      if (!hotelsCarouselEl || !hotelsWrapperEl) return;

      const hotels = Array.isArray(venueData.hotels) ? venueData.hotels.filter(function (h) {
        return h && (h.type === 'hotel' || h.type === 'daytrip');
      }) : [];

      if (!hotels.length) {
        const heading = hotelsSection.querySelector('h3');
        if (heading) heading.hidden = true;
        hotelsSection.style.display = 'none';
        return;
      }

      const eventMeta = {
        slug: data.slug || data.slug_evento || '',
        title: data.title || data.titulo || '',
        startDate: data.start_date || data.data_inicio || data.startDate || data.dataInicio || '',
        endDate: data.end_date || data.data_fim || data.endDate || data.dataFim || ''
      };

      const slidesHtml = hotels.map(function (h) { return renderHotelCard(h, eventMeta); }).join('');
      hotelsCarouselEl.innerHTML = slidesHtml;
      hotelsCarouselEl.classList.add('cl-track');

      hotelsWrapperEl.insertAdjacentHTML('beforeend', `
        <button class="carousel-nav prev">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 7.41L14 6 8 12l6 6 1.41-1.42L10.83 12l4.58-4.59z"/></svg>
        </button>
        <button class="carousel-nav next">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12l-4.58 4.59z"/></svg>
        </button>
      `);

      initCarousel('hotelsCarouselContainer', 'hotelsWrapper', false);
    })();
// --- Carrossel de Motivos (motivos-section) ---
    (function () {
      const motivosWrapperEl = document.getElementById('motivosWrapper');
      const motivosContainerEl = document.getElementById('motivosContainer');
      if (!motivosWrapperEl || !motivosContainerEl) return;

      const extractedMotivos = [];
      for (let i = 1; i <= 8; i++) {
        const titulo = data['motivo_titulo_' + i];
        const conteudo = data['motivo_conteudo_' + i];
        const emoji = data['motivo_emoji_' + i];
        if (titulo) {
          extractedMotivos.push({
            motivo_titulo: titulo,
            motivo_conteudo: conteudo || '',
            motivo_emoji: emoji || '✨'
          });
        }
      }

      const extraMotivos = Array.isArray(data.motivos) ? data.motivos : [];
      const finalMotivos = extractedMotivos.concat(extraMotivos);

      if (!finalMotivos.length) {
        const heading = document.querySelector('.motivos-section h3');
        if (heading) heading.hidden = true;
        motivosWrapperEl.hidden = true;
        return;
      }

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
    })();

  } catch (err) {
    showError('Não foi possível carregar o conteúdo deste evento.', usedPath || ('slug: ' + slug));
    console.error('Erro ao carregar evento:', err);
  }
});
