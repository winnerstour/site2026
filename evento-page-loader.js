// evento-page-loader.js (FINAL - FIX CRÍTICO DE ORDEM DE FUNÇÕES)

(function () {
  const DATA_BASE_PATH = './data/events/'; 
  const ALL_EVENTS_URL = './event.json'; 
  const VENUE_DATA_PATH = './venue-data/'; // Path para os JSONs de Venue
  
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
  const SCROLL_SPEED = 8000; // 8 segundos para autoplay

  // Seleção de Elementos (Precisa estar no topo do escopo)
  const eventContent = document.getElementById('eventContent');
  const loading = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const pageTitle = document.getElementById('pageTitle');
  const eventTitle = document.getElementById('eventTitle');
  
  // [NOVOS ELEMENTOS DO HERO DE TELA CHEIA]
  const heroSection = document.getElementById('eventHeroSection'); 
  const heroTitle = document.getElementById('heroTitle');         
  const heroSubheadline = document.getElementById('heroSubheadline'); 
  const heroBadge = document.getElementById('heroBadge');         
  const heroWhatsappCta = document.getElementById('heroWhatsappCta'); 
  const oldHeroContainer = document.getElementById('oldHeroContainer'); // Container do banner antigo
  
  // [BANNER ANTIGO, AGORA SECUNDÁRIO]
  const eventHero = document.getElementById('eventHero'); // O <img> do banner antigo
  const heroBannerContainer = document.querySelector('.hero-banner'); 
  
  const eventMeta = document.getElementById('eventMeta');
  const eventDescription = document.getElementById('eventDescription');
  const motivosContainer = document.getElementById('motivosContainer');
  const whatsappCta = document.getElementById('whatsappCta');
  const whatsappTopCta = document.getElementById('whatsappTopCta');
  const relatedEventsSection = document.getElementById('relatedEventsSection');
  const relatedTitle = document.getElementById('relatedTitle');
  const relatedCarouselContainer = document.getElementById('relatedCarouselContainer');
  const youtubeVideoContainer = document.getElementById('youtubeVideoContainer');
  const hotelsSection = document.getElementById('hotelsSection');
  const hotelsCarouselContainer = document.getElementById('hotelsCarouselContainer');
  const hotelsWrapper = document.getElementById('hotelsWrapper');
  const hotelsWhatsLink = document.getElementById('hotelsWhatsLink');

  // --- FUNÇÕES AUXILIARES (DEFINIDAS ANTES DE loadEventData) ---

  // FUNÇÃO DE FIX PATH: Trata paths de dados relativos e paths de assets absolutos
  function fixPath(path) {
      if (!path) return path;

      // 1. Trata paths de DADOS (que usam './' ou 'data/...')
      if (path.startsWith('./') || path.startsWith(DATA_BASE_PATH.substring(2))) {
          if (BASE_PATH) {
              return BASE_PATH + path.substring(1); 
          }
          return path; 
      }
      
      // 2. Trata paths de ASSETS (que usam '/')
      if (path.startsWith('/')) {
          if (BASE_PATH) {
              return BASE_PATH + path; 
          }
          return path;
      }
      
      return path; 
  }

  function getSlug() {
    const params = new URLSearchParams(window.location.search);
    return params.get("slug");
  }

  function renderError(message) {
    // Verifica se os elementos básicos existem antes de tentar manipulá-los
    if (loading) loading.hidden = true;
    if (errorDiv) {
        errorDiv.hidden = false;
        errorDiv.innerHTML = '<h2 style="color:var(--brand)">Erro</h2><p>' + (message || 'Não foi possível carregar os detalhes do evento.') + '</p>';
    }
  }

  // Novo: Tenta extrair o ID de uma URL completa ou usa o que foi fornecido.
  function extractVideoId(input) {
      if (!input) return null;

      try {
          // Tenta tratar como URL completa para extrair o parâmetro 'v'
          const url = new URL(input);
          const urlParams = new URLSearchParams(url.search);
          const idFromQuery = urlParams.get('v');
          if (idFromQuery) return idFromQuery;
      } catch (e) {
          // Se falhar (não for uma URL válida), assume que é apenas o ID
      }
      
      // Se for apenas o ID ou uma URL curta (sem query parameters)
      return input.split('/').pop().split('=').pop();
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
  
  // Card de Evento Similar (usado no carrossel de sugestões)
  function buildSimilarEventCard(ev) {
    const title = ev.title || 'Evento sem título';
    const subtitle = ev.slug; 
    const slug = ev.slug; 
    
    const finalUrl = `evento.html?slug=${slug}`;
    
    // Busca [slug]-hero.webp para a miniatura do carrossel
    const rawImagePath = `/assets/img/banners/${slug}-hero.webp`; 
    const imagePath = fixPath(rawImagePath);

    const faviconRawPath = `/assets/img/banners/${slug}-favicon.webp`;
    const faviconPath = fixPath(faviconRawPath);

    // Favicon usa a classe 'favicon' para travar o tamanho via CSS
    const faviconHtml = `<img class="favicon" src="${faviconPath}" alt="" aria-hidden="true" onerror="this.style.display='none';">`;
    
    return `
      <div class="cl-slide">
        <a href="${finalUrl}" class="card" aria-label="${title}">
          <div class="thumb">
            <img loading="lazy" src="${imagePath}" alt="${title}">
          </div>
          <div class="content">
            <h3 class="title">
              ${faviconHtml}
              <span>${title}</span>
            </h3>
            <p class="subtitle">${subtitle}</p>
          </div>
        </a>
      </div>
    `;
  }

  // FUNÇÃO DE INICIALIZAÇÃO UNIVERSAL DE CARROSSEL
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
              carousel.scroll({left: 0, behavior: 'smooth'});
          } else {
              carousel.scrollBy({left: cardWidth, behavior: 'smooth'});
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
              carousel.scrollBy({left: -cardWidth, behavior: 'smooth'});
          });
          nextButton.addEventListener('click', () => {
              carousel.scrollBy({left: cardWidth, behavior: 'smooth'});
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
  
  // FUNÇÃO PARA CRIAR CARDS DE HOTEL
  function buildHotelCard(hotel) {
      const isDayTrip = hotel.type === 'daytrip';
      const categoryText = hotel.category || (isDayTrip ? 'BATE E VOLTA' : hotel.description.match(/<strong[^>]*>([^<]+)<\/strong>/)?.[1] || 'Opção');
      const priceHtml = isDayTrip ? 'CONSULTE' : `R$ ${hotel.nightly_from_brl || '---'},00 <small>/noite</small>`;
      const starsHtml = isDayTrip ? '' : '★'.repeat(hotel.stars);
      const ctaLabel = hotel.cta || (isDayTrip ? 'RESERVAR VOO' : 'RESERVAR HOTEL');
      
      // Ajuste para usar caminho do VENUE JSON (não mais /assets/hotels)
      const hotelImage = fixPath(hotel.image || `/assets/hotels/default.webp`); 

      return `
          <div class="cl-slide">
              <div class="hotel-card">
                  <div class="thumb">
                      <img loading="lazy" src="${hotelImage}" alt="${hotel.name}">
                  </div>
                  <div class="content">
                      <div class="category">${categoryText.toUpperCase()}</div>
                      <h3 class="title">${hotel.name} <span class="stars">${starsHtml}</span></h3>
                      <div class="price">A PARTIR DE ${priceHtml}</div>
                      
                      <a href="${whatsappCta.href}" target="_blank" class="btn btn-whatsapp" style="margin-top: 10px; width: 100%;">
                          <span class="label">${ctaLabel}</span>
                      </a>
                  </div>
              </div>
          </div>
      `;
  }
  
  // FUNÇÃO PARA CARREGAR E RENDERIZAR HOTÉIS
  async function renderHotels(venueSlug, eventTitle) {
      if (!hotelsSection) return;
      
      try {
          // Os JSONs de Venue não estão em DATA_BASE_PATH, mas em um novo caminho
          const venueJsonPath = fixPath(`${VENUE_DATA_PATH}${venueSlug}.json`);
          const res = await fetch(venueJsonPath);
          
          if (!res.ok) throw new Error(`Venue JSON not found: ${venueSlug}`);
          
          const venueData = await res.json();
          const hotels = venueData.hotels || [];

          if (hotels.length === 0) {
              hotelsSection.style.display = 'none';
              return;
          }
          
          const hotelSlides = hotels.map(buildHotelCard).join('');
          hotelsCarouselContainer.innerHTML = hotelSlides;
          
          // Ajusta o link do WhatsApp para ser específico para hotéis/roteiros
          const whatsText = encodeURIComponent(`Olá! Gostaria de receber a proposta detalhada de roteiros de viagem para o evento ${eventTitle} (${venueData.name}).`);
          const baseWhats = 'https://wa.me/5541999450111?text=';
          if(hotelsWhatsLink) hotelsWhatsLink.href = baseWhats + whatsText;
          
          // Inicializa o carrossel de hotéis (usando o mesmo initCarousel)
          initCarousel('hotelsCarouselContainer', 'hotelsWrapper', false);

          hotelsSection.style.display = 'block';

      } catch (e) {
          console.error("Erro ao carregar ou renderizar hotéis:", e);
          hotelsSection.style.display = 'none';
      }
  }


  // Função para renderizar o Carrossel de Eventos Similares
  async function renderRelatedEvents(currentEventCategory, currentEventSlug) {
      console.log(`[DEBUG RELATED] Iniciando renderização para Categoria: ${currentEventCategory}, Slug: ${currentEventSlug}`);
      try {
          if(relatedEventsSection) relatedEventsSection.hidden = false;
          
          const relatedCarouselId = 'relatedCarouselContainer';
          const relatedWrapperId = 'relatedWrapper';
          
          const finalAllEventsUrl = fixPath(ALL_EVENTS_URL);
          console.log(`[DEBUG RELATED] Tentando carregar lista de todos os eventos de: ${finalAllEventsUrl}`);
          
          const res = await fetch(finalAllEventsUrl);

          if (!res.ok) {
              console.error(`[DEBUG RELATED] Falha no FETCH! Status: ${res.status} para URL: ${finalAllEventsUrl}`);
              throw new Error("Falha ao carregar lista de eventos similares (Erro de Rede).");
          }
          
          const allEvents = await res.json();
          console.log(`[DEBUG RELATED] Lista de eventos carregada. Total: ${allEvents.length}`);
          
          const relatedEvents = allEvents.filter(ev => 
              ev.category_macro === currentEventCategory && ev.slug !== currentEventSlug
          );

          console.log(`[DEBUG RELATED] Eventos similares encontrados (após filtro): ${relatedEvents.length}`);
          
          if (relatedEvents.length === 0) {
              console.log("[DEBUG RELATED] NENHUM evento similar encontrado. Ocultando seção.");
              if(relatedEventsSection) relatedEventsSection.hidden = true;
              return;
          }
          
          if(relatedTitle) relatedTitle.textContent = `Mais Eventos em ${currentEventCategory.toUpperCase()}`;
          
          const relatedSlides = relatedEvents.map(buildSimilarEventCard).join('');
          if(relatedCarouselContainer) relatedCarouselContainer.innerHTML = relatedSlides;

          console.log("[DEBUG RELATED] Carrossel populado e inicializado com sucesso.");
          initCarousel('relatedCarouselContainer', 'relatedWrapper', false); 

      } catch (e) {
          console.error("[DEBUG RELATED] Erro FINAL no processo de renderização de similares:", e);
          if(relatedEventsSection) relatedEventsSection.hidden = true;
      }
  }


  // --- FUNÇÃO PRINCIPAL ---

  async function loadEventData() {
    const slug = getSlug();
    if (!slug) {
      return renderError('Nenhum evento especificado na URL.');
    }
    
    try {
      const finalJsonPath = fixPath(`${DATA_BASE_PATH}${slug}.json`);
      const res = await fetch(finalJsonPath);

      if (!res.ok) {
        const rootPath = fixPath(`./${slug}.json`);
        const rootRes = await fetch(rootPath);
        if (!rootRes.ok) {
             throw new Error(`Arquivo ${slug}.json não encontrado ou erro de rede.`);
        }
        var ev = await rootRes.json();
      } else {
        var ev = await res.json();
      }
      
      const finalTitle = ev.title || 'Evento sem Título';
      const venueName = ev.venue_name || ev.venue_slug || ev.venue || 'Local do Evento'; // Nome do local para subtítulo do Hero

      // ******* 1. ATUALIZAÇÃO DA PÁGINA E FAVICON *******
      if (pageTitle) pageTitle.textContent = `${finalTitle} — WinnersTour`;
      
      // Caminho do Favicon
      const faviconRawPath = `/assets/img/banners/${slug}-favicon.webp`;
      const faviconPath = fixPath(faviconRawPath);
      const faviconEl = document.querySelector('link[rel="icon"]'); 
      if (faviconEl) {
          faviconEl.href = faviconPath; 
      }
      
      // ******* 2. CARREGAR E EXIBIR O NOVO HERO DE TELA CHEIA *******
      
      // 2.1. Caminho da Imagem de Fundo (nova convenção: [category_macro]-bannerhero.webp)
      const categoryMacroSlug = ev.category_macro ? ev.category_macro.replace(/ /g, '-').replace(/&/g, 'e') : 'default';
      const rawHeroBgPath = `/assets/img/banners/${categoryMacroSlug}-bannerhero.webp`;
      const heroBgPath = fixPath(rawHeroBgPath);
      
      // 2.2. Preencher a Seção Hero de Tela Cheia (heroSection)
      if(heroSection) {
          heroSection.style.backgroundImage = `url('${heroBgPath}')`;
          heroSection.style.display = 'flex'; // Garante que o HeroSection esteja visível
      }
      if(heroTitle) {
          heroTitle.innerHTML = `Sua viagem para o <strong>${finalTitle}</strong> resolvida em minutos.`;
      }
      if(heroSubheadline) {
          heroSubheadline.textContent = `Voos + hotéis próximos ao ${venueName} com tarifas corporativas e suporte completo.`;
      }
      if(heroBadge && ev.category_micro) {
          heroBadge.textContent = ev.category_micro.toUpperCase();
          heroBadge.style.display = 'inline-block';
      } else if (heroBadge) {
          heroBadge.style.display = 'none'; // Oculta se não houver micro categoria
      }

      // Oculta o título e metadados antigos que estão no 'wrap event-details'
      if(eventTitle) eventTitle.style.display = 'none';
      if(eventMeta) eventMeta.style.display = 'none';


      // ******* 3. CARREGAR E EXIBIR O BANNER ANTIGO (AGORA SECUNDÁRIO) *******
      
      const rawHeroPath = `/assets/img/banners/${slug}-banner.webp`;
      const heroPath = fixPath(rawHeroPath);
      
      if(eventHero) {
          eventHero.src = heroPath;
          eventHero.alt = `Banner secundário do evento ${finalTitle}`;
          eventHero.style.display = 'block';
      }
      if(oldHeroContainer) oldHeroContainer.style.display = 'block'; 

      // 4. CARREGAR E EXIBIR O VÍDEO (SE HOUVER)
      const rawVideoInput = ev.YouTubeVideo; 
      const youtubeVideoId = extractVideoId(rawVideoInput);

      if (youtubeVideoId) {
          const videoHtml = `
              <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; background: #000; width: 100%;">
                  <iframe 
                      width="100%" 
                      height="100%" 
                      src="https://www.youtube.com/embed/${youtubeVideoId}?rel=0&amp;showinfo=0&amp;autoplay=0&amp;modestbranding=1" 
                      frameborder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen 
                      style="position: absolute; top: 0; left: 0;"
                      title="${finalTitle}"
                  ></iframe>
              </div>
          `;
          if (youtubeVideoContainer) youtubeVideoContainer.innerHTML = videoHtml;
      } 
      
      const metaHtml = [ev.city_state, ev.start_date, ev.category_macro].filter(Boolean).join(' | ');
      if(eventMeta) eventMeta.textContent = metaHtml;
      
      if(eventDescription) eventDescription.innerHTML = ev.initial_description ? `<p>${ev.initial_description}</p>` : `<p>${ev.subtitle || 'Descrição não disponível.'}</p>`;
      
      // CTA (WhatsApp) - Garante que todos os CTAs usem o mesmo link
      const defaultWhatsapp = "https://wa.me/5541999450111?text=Ol%C3%A1!%20Tenho%20interesse%20no%20pacote%20completo%20para%20" + encodeURIComponent(finalTitle);
      const whatsappLink = ev.whatsapp_url || defaultWhatsapp;
      if(whatsappCta) whatsappCta.href = whatsappLink;
      if(whatsappTopCta) whatsappTopCta.href = whatsappLink;
      if(heroWhatsappCta) heroWhatsappCta.href = whatsappLink; // NOVO CTA HERO

      // 5. CARREGAR E RENDERIZAR HOTÉIS (VENUES)
      const venueSlug = ev.venue_slug || ev.venue || ev.slug; // Tenta usar slug como fallback
      if (venueSlug) {
          await renderHotels(venueSlug, finalTitle);
      } else {
          if (hotelsSection) hotelsSection.style.display = 'none';
      }

      // 6. Motivos para Visitar (Carrossel Principal)
      const extractedMotivos = Object.keys(ev)
          .filter(key => key.startsWith('motivo_titulo_'))
          .map(titleKey => {
            const index = titleKey.split('_')[2]; 
            return {
              motivo_emoji: ev[`motivo_emoji_${index}`],
              motivo_titulo: ev[titleKey],
              motivo_conteudo: ev[`motivo_conteudo_${index}`]
            };
          });
          
      const finalMotivos = extractedMotivos
          .filter(m => m.motivo_titulo)
          .concat(Array.isArray(ev.motivos) ? ev.motivos : []);

      const motivosCarouselId = 'motivosContainer';
      const motivosWrapperId = 'motivosWrapper';
      const motivosWrapperEl = document.getElementById('motivosWrapper');

      if (finalMotivos.length > 0) {
        const motivoSlides = finalMotivos.map(renderMotivo).join('');
        
        if(motivosContainer) {
            motivosContainer.innerHTML = motivoSlides;
            motivosContainer.classList.add('cl-track'); // Garante que o container use o cl-track
        }
        
        // Renderiza as setas de navegação (HTML) no wrapper
        if(motivosWrapperEl) motivosWrapperEl.insertAdjacentHTML('beforeend', `
              <button class="carousel-nav prev">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
              </button>
              <button class="carousel-nav next">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
              </button>
          `);
        
        initCarousel(motivosCarouselId, motivosWrapperId, true); // Inicializa Motivos
        
      } else {
        if(document.querySelector('.motivos-section h2')) document.querySelector('.motivos-section h2').hidden = true;
        if(motivosWrapperEl) motivosWrapperEl.hidden = true;
      }

      // 7. Renderiza Eventos Similares
      if (ev.category_macro) {
          renderRelatedEvents(ev.category_macro, slug); 
      } else {
          if(relatedEventsSection) relatedEventsSection.hidden = true;
      }

      if(loading) loading.hidden = true;
      if(eventContent) eventContent.hidden = false;

    } catch (e) {
      console.error('Erro ao carregar evento:', e);
      renderError(e.message);
    }
  }

  document.addEventListener('DOMContentLoaded', loadEventData);
})();
