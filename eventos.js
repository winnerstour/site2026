window.VENUE_DATA_PATH = window.VENUE_DATA_PATH || 'venue-data/';

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

  const baseUrl = 'https://www.comprarviagem.com.br/winnerstour/hotel-list';

  const hotelId = hotel.hotel_id || hotel.id || hotel.code || hotel.codigo || '';

  function toIsoDate(dateStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).split('T');
    const day = parts[0]; // espera 'YYYY-MM-DD'
    if (!day) return '';
    return day + 'T00:00:00.000Z';
  }

  let startDate = '';
  let endDate = '';

  if (eventMeta) {
    if (eventMeta.startDate) startDate = eventMeta.startDate;
    if (eventMeta.endDate) endDate = eventMeta.endDate;
  }

  const params = [];

  // Quarto padrão: 1 adulto, sem crianças/infantes
  const roomsPayload = [
    {
      numberOfAdults: 1,
      numberOfInfant: 0,
      numberOfChilds: 0,
      agesOfChild: [],
      roomNum: 0
    }
  ];
  params.push('rooms=' + encodeURIComponent(JSON.stringify(roomsPayload)));
  params.push('numberOfAdults=1');
  params.push('numberOfChild=0');
  params.push('numberOfInfant=0');
  params.push('numberOfRooms=1');

  if (hotelId) {
    params.push('id=' + encodeURIComponent(String(hotelId)));
  }

  const startIso = toIsoDate(startDate);
  const endIso = toIsoDate(endDate);
  if (startIso) params.push('startDate=' + encodeURIComponent(startIso));
  if (endIso) params.push('endDate=' + encodeURIComponent(endIso));

  params.push('type=3');
  params.push('source=h');

  const query = params.join('&');
  return baseUrl + (query ? ('?' + query) : '');
}



// --- Render de seções em markdown, mantendo estrutura original ---
function renderMarkdown(text) {
  if (!text) return '';

  let html = text;

  html = html.replace(/^###\s?(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s?(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s?(.*)$/gm, '<h2>$1</h2>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  html = html.replace(/```([\s\S]*?)```/g, function (_match, code) {
    const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<pre><code>' + escaped + '</code></pre>';
  });

  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\s*)+/gm, function (match) {
    return '<ul>' + match + '</ul>';
  });

  html = html.replace(/\n{2,}/g, '</p><p>');
  html = '<p>' + html + '</p>';

  return html;
}



// Carrossel genérico (já usado no layout antigo)
function initCarousel(carouselId, wrapperId, isMotivos) {
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
    scrollInterval = setInterval(scrollRight, 8000);
  };

  carousel.addEventListener('mouseover', () => { isPaused = true; });
  carousel.addEventListener('mouseleave', () => { isPaused = false; });

  if (!isMotivos) {
    startAutoplay();
  }

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



// Card de hotel com chip superior (nome + parâmetros)

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
            ${secondaryInfo ? `<div class="hotel-chip-line hotel-chip-info">${secondaryInfo}</div>` : ''}
            <div class="hotel-chip-line hotel-chip-name"><strong>${name}</strong></div>
            <a href="${href}" class="hotel-chip-line hotel-chip-cta" target="_blank" rel="noopener">
              Clique aqui e saiba mais
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}





document.addEventListener('DOMContentLoaded', async function () {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) return;

  const loading = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const pageTitle = document.getElementById('pageTitle');
  const faviconEl = document.getElementById('faviconEl');

  const heroTitleEl = document.getElementById('heroTitle');
  const heroSubtitleEl = document.getElementById('heroSubtitle');
  const heroChipEl = document.getElementById('heroChip');
  const heroCtaEl = document.getElementById('heroCta');
  const heroBgEl = document.getElementById('heroBg');

  const eventSummaryEl = document.getElementById('eventSummary');
  const eventMetaEl = document.getElementById('eventMeta');
  const eventWhatsCtaEl = document.getElementById('eventWhatsCta');

  const sectionsEl = document.getElementById('articleSections');
  const relatedWrapperEl = document.getElementById('relatedWrapper');
  const relatedCarouselEl = document.getElementById('relatedCarouselContainer');

  try {
    const jsonPath = fixPath('/eventos/' + slug + '.json');
    const response = await fetch(jsonPath);
    if (!response.ok) {
      throw new Error('Não foi possível carregar os dados do evento.');
    }
    const data = await response.json();

    const titulo = data.title || data.titulo || 'Evento';
    const resumo = data.summary || data.resumo || data.subtitle || '';
    const local = data.local || data.location || '';
    const cidade = data.city || data.cidade || '';
    const estado = data.state || data.estado || '';
    const dataInicio = data.start_date || data.data_inicio || data.startDate || data.dataInicio || '';
    const dataFim = data.end_date || data.data_fim || data.endDate || data.dataFim || '';
    const imagemHero = data.hero_image || data.imagem_hero || '/assets/img/banners/' + slug + '-hero.webp';
    const chipColor = data.ChipColor || data.chip_color || 'bg-orange-500';
    const categoriaMacro = data.category_macro || data.categoria_macro || '';
    const categoriaMicro = data.category_micro || data.categoria_micro || '';
    const whatsLink = data.whatsapp_link || data.whatsapp || '';
    const faviconPath = data.favicon || ('/assets/img/banners/' + slug + '-favicon.webp');

    if (pageTitle) {
      pageTitle.textContent = titulo + ' — WinnersTour';
    }
    if (faviconEl) {
      faviconEl.href = fixPath(faviconPath);
    }

    if (heroTitleEl) {
      heroTitleEl.innerHTML = titulo;
    }
    if (heroSubtitleEl) {
      heroSubtitleEl.textContent = resumo;
    }
    if (heroChipEl) {
      heroChipEl.textContent = categoriaMicro ? categoriaMicro.toUpperCase() : 'EVENTO';
      heroChipEl.classList.add(chipColor);
    }
    if (heroBgEl) {
      heroBgEl.style.backgroundImage = 'url(' + fixPath(imagemHero) + ')';
    }

    if (eventSummaryEl) {
      eventSummaryEl.textContent = resumo;
    }

    if (eventMetaEl) {
      const parts = [];
      if (cidade && estado) parts.push(`${cidade} — ${estado}`);
      else if (cidade) parts.push(cidade);
      if (dataInicio && dataFim && dataInicio !== dataFim) {
        parts.push(`${dataInicio} até ${dataFim}`);
      } else if (dataInicio) {
        parts.push(dataInicio);
      }
      eventMetaEl.textContent = parts.join(' | ');
    }

    if (eventWhatsCtaEl && whatsLink) {
      eventWhatsCtaEl.href = whatsLink;
    }

    const sections = Array.isArray(data.sections) ? data.sections : [];
    sections.forEach(function (sec) {
      const wrapper = document.createElement('section');
      wrapper.className = 'content-section';
      wrapper.setAttribute('data-sec-id', sec.id || sec.sec_id || '');

      if (sec.type === 'cta_whatsapp' || sec.tipo === 'cta_whatsapp') {
        wrapper.innerHTML = `
          <div class="cta-whatsapp-block">
            <h2>${sec.titulo_secao || 'Fale com nossa equipe'}</h2>
            <p>${sec.texto || ''}</p>
            <a href="${whatsLink}" class="btn btn-whatsapp">Falar no WhatsApp</a>
          </div>
        `;
        sectionsEl.appendChild(wrapper);
        return;
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

      const venueSlug = String(venueSlugRaw)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

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
        <h3 class="wrap font-black text-center uppercase">Hotéis próximos do pavilhão</h3>
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

      try {
        const venueResponse = await fetch(window.VENUE_DATA_PATH + venueSlug + '.json');
        if (!venueResponse.ok) {
          console.warn('Falha ao tentar venue-data para', venueSlug, 'status', venueResponse.status);
          hotelsSection.style.display = 'none';
          return;
        }

        const venueData = await venueResponse.json();
        const hotelsCarouselEl = document.getElementById('hotelsCarousel');
        const hotelsWrapperEl = document.getElementById('hotelsWrapper');

        if (!hotelsCarouselEl || !hotelsWrapperEl) return;

        const hotels = Array.isArray(venueData.hotels) ? venueData.hotels.filter(function (h) {
          return h && (h.type === 'hotel' || h.type === 'daytrip');
        }) : [];

        if (!hotels.length) {
          hotelsSection.style.display = 'none';
          return;
        }

        const eventMeta = {
          slug: data.slug || data.slug_evento || '',
          title: titulo,
          startDate: data.start_date || data.data_inicio || data.startDate || data.dataInicio || '',
          endDate: data.end_date || data.data_fim || data.endDate || data.dataFim || ''
        };

        const slidesHtml = hotels.map(function (h) { return renderHotelCard(h, eventMeta); }).join('');
        hotelsCarouselEl.innerHTML = slidesHtml;
        hotelsCarouselEl.classList.add('cl-track');

        hotelsWrapperEl.insertAdjacentHTML('beforeend', `
          <button class="carousel-nav prev">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,7.41L14,6L8,12L14,18L15.41,16.58L10.83,12L15.41,7.41Z" /></svg>
          </button>
          <button class="carousel-nav next">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,7.41L10,6L16,12L10,18L8.59,16.58L13.17,12L8.59,7.41Z" /></svg>
          </button>
        `);

        initCarousel('hotelsCarousel', 'hotelsWrapper', false);
        attachDots('hotelsCarousel', 'hotelsWrapper');
      } catch (e) {
        console.warn('Erro ao carregar hotels a partir do venue-data:', e);
        hotelsSection.style.display = 'none';
      }
    })();


    // --- Carrossel de Motivos (motivos-section) ---
    (function () {
      const motivosWrapperEl = document.getElementById('motivosWrapper');
      const motivosContainerEl = document.getElementById('motivosContainer');
      if (!motivosWrapperEl || !motivosContainerEl) return;

      let extractedMotivos = Array.isArray(data.motivos) ? data.motivos.slice() : [];

      // Fallback: montar motivos a partir dos campos numerados (motivo_emoji_1, motivo_titulo_1, motivo_conteudo_1, etc.)
      if (!extractedMotivos.length) {
        const tmp = [];
        for (let i = 1; i <= 10; i++) {
          const emojiKey = 'motivo_emoji_' + i;
          const tituloKey = 'motivo_titulo_' + i;
          const conteudoKey = 'motivo_conteudo_' + i;

          const emojiVal = data[emojiKey];
          const tituloVal = data[tituloKey];
          const conteudoVal = data[conteudoKey];

          if (!emojiVal && !tituloVal && !conteudoVal) continue;

          tmp.push({
            motivo_emoji: emojiVal || '✨',
            motivo_titulo: tituloVal || '',
            motivo_conteudo: conteudoVal || ''
          });
        }
        extractedMotivos = tmp;
      }

      if (!extractedMotivos.length) {
        motivosWrapperEl.style.display = 'none';
        return;
      }

      const motivosHtml = extractedMotivos.map(function (m) {
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
      }).join('');

      motivosContainerEl.innerHTML = motivosHtml;
      motivosContainerEl.classList.add('cl-track');

      // Setas de navegação no carrossel de motivos (mesmo padrão dos hotéis)
      motivosWrapperEl.insertAdjacentHTML('beforeend', `
        <button class="carousel-nav prev">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 7.41L14 6L8 12L14 18L15.41 16.58L10.83 12L15.41 7.41Z" /></svg>
        </button>
        <button class="carousel-nav next">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59 7.41L10 6L16 12L10 18L8.59 16.58L13.17 12L8.59 7.41Z" /></svg>
        </button>
      `);

      initCarousel('motivosContainer', 'motivosWrapper', true);
      attachDots('motivosContainer', 'motivosWrapper');
    })();


    if (loading) loading.hidden = true;
    if (errorDiv) errorDiv.hidden = true;
    const eventContent = document.getElementById('eventContent');
    if (eventContent) eventContent.hidden = false;
  } catch (err) {
    console.error(err);
    if (loading) loading.hidden = true;
    renderError(err.message);
  }
});



// Controles por bolinhas (dots) para carrosséis horizontais
function attachDots(carouselId, wrapperId) {
  const carousel = document.getElementById(carouselId);
  const wrapper = document.getElementById(wrapperId);
  if (!carousel || !wrapper) return;

  const slides = Array.from(carousel.children || []);
  if (!slides.length || slides.length === 1) return;

  let dotsContainer = wrapper.querySelector('.carousel-dots');
  if (!dotsContainer) {
    dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    wrapper.appendChild(dotsContainer);
  } else {
    dotsContainer.innerHTML = '';
  }

  const cardWidth = 318;
  const dots = [];

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      const target = index * cardWidth;
      carousel.scrollTo({ left: target, behavior: 'smooth' });
    });
    dotsContainer.appendChild(dot);
    dots.push(dot);
  });

  const updateDots = () => {
    if (!dots.length) return;
    const index = Math.round(carousel.scrollLeft / cardWidth);
    dots.forEach((dot, i) => {
      if (i === index) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  };

  carousel.addEventListener('scroll', updateDots);
  updateDots();
}
