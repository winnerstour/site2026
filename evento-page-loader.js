// evento-page-loader.js (FINAL - COM CARROSSEL DE HOTÉIS E FIX PATHS)

(function () {
  const DATA_BASE_PATH = './data/events/'; 
  const ALL_EVENTS_URL = './event.json'; 
  const VENUE_DATA_PATH = './venue-data/'; // Novo Path para os JSONs de Venue
  
  // Define o prefixo necessário APENAS para o ambiente GitHub Pages
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
  const SCROLL_SPEED = 8000; // 8 segundos para autoplay

  const eventContent = document.getElementById('eventContent');
  const loading = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  
  const pageTitle = document.getElementById('pageTitle');
  const eventTitle = document.getElementById('eventTitle');
  const eventHero = document.getElementById('eventHero');
  const eventMeta = document.getElementById('eventMeta');
  const eventDescription = document.getElementById('eventDescription');
  const motivosContainer = document.getElementById('motivosContainer');
  const whatsappCta = document.getElementById('whatsappCta');
  const whatsappTopCta = document.getElementById('whatsappTopCta');
  
  const relatedEventsSection = document.getElementById('relatedEventsSection');
  const relatedTitle = document.getElementById('relatedTitle');
  const relatedCarouselContainer = document.getElementById('relatedCarouselContainer');

  const heroBannerContainer = document.querySelector('.hero-banner'); 
  const youtubeVideoContainer = document.getElementById('youtubeVideoContainer');

  // [NOVOS ELEMENTOS PARA HOTÉIS]
  const hotelsSection = document.getElementById('hotelsSection');
  const hotelsCarouselContainer = document.getElementById('hotelsCarouselContainer');
  const hotelsWrapper = document.getElementById('hotelsWrapper');
  const hotelsWhatsLink = document.getElementById('hotelsWhatsLink');


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
    loading.hidden = true;
    errorDiv.hidden = false;
    errorDiv.innerHTML = '<h2 style="color:var(--brand)">Erro</h2><p>' + (message || 'Não foi possível carregar os detalhes do evento.') + '</p>';
  }

  // FUNÇÃO PARA CRIAR CARDS DE HOTEL
  function buildHotelCard(hotel) {
      const isDayTrip = hotel.type === 'daytrip';
      const categoryText = isDayTrip ? 'BATE E VOLTA' : hotel.description.match(/<strong[^>]*>([^<]+)<\/strong>/)?.[1] || `Opção ${hotel.category}`;
      const priceHtml = isDayTrip ? 'CONSULTE' : `R$ ${hotel.nightly_from_brl || '---'},00 <small>/noite</small>`;
      const starsHtml = isDayTrip ? '' : '★'.repeat(hotel.stars);
      const ctaLabel = hotel.cta || (isDayTrip ? 'RESERVAR VOO' : 'RESERVAR HOTEL');
      
      // Usando imagePath para o card (assumindo que a imagem está em assets/hotels/[hotel.id].webp ou default)
      const hotelImage = fixPath(hotel.image || `/assets/hotels/${hotel.id}.webp`);

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
          hotelsWhatsLink.href = baseWhats + whatsText;
          
          // Inicializa o carrossel de hotéis (usando o mesmo initCarousel)
          initCarousel('hotelsCarouselContainer', 'hotelsWrapper', false);

          hotelsSection.style.display = 'block';

      } catch (e) {
          console.error("Erro ao carregar ou renderizar hotéis:", e);
          hotelsSection.style.display = 'none';
      }
  }


  // ... (buildSimilarEventCard, initCarousel, renderRelatedEvents, extractVideoId permanecem do código final) ...
  
  async function loadEventData() {
    const slug = getSlug();
    if (!slug) {
      return renderError('Nenhum evento especificado na URL.');
    }
    
    try {
      // Carregar JSON do evento
      const finalJsonPath = fixPath(`${DATA_BASE_PATH}${slug}.json`);
      const res = await fetch(finalJsonPath);

      if (!res.ok) {
        // Fallback para buscar o JSON na raiz do projeto
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
      pageTitle.textContent = `${finalTitle} — WinnersTour`;
      
      // Caminho do Favicon
      const faviconRawPath = `/assets/img/banners/${slug}-favicon.webp`;
      const faviconPath = fixPath(faviconRawPath);
      const faviconEl = document.querySelector('link[rel="icon"]'); 
      if (faviconEl) {
          faviconEl.href = faviconPath; 
      }
      
      eventTitle.textContent = finalTitle;
      
      /* --- INÍCIO DA LÓGICA COEXISTENTE (BANNER E VÍDEO) --- */

      // 1. CARREGAR E EXIBIR O BANNER (SEMPRE)
      
      const rawHeroPath = `/assets/img/banners/${slug}-banner.webp`;
      const heroPath = fixPath(rawHeroPath);
      
      eventHero.src = heroPath;
      eventHero.alt = `Banner do evento ${finalTitle}`;
      eventHero.style.display = 'block';
      heroBannerContainer.style.display = 'block'; 

      // 2. CARREGAR E EXIBIR O VÍDEO (SE HOUVER)
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
          
          if (youtubeVideoContainer) {
              youtubeVideoContainer.innerHTML = videoHtml;
          }
      } 

      /* --- FIM DA LÓGICA COEXISTENTE --- */
      
      const metaHtml = [ev.city_state, ev.start_date, ev.category_macro].filter(Boolean).join(' | ');
      eventMeta.textContent = metaHtml;
      
      eventDescription.innerHTML = ev.initial_description ? `<p>${ev.initial_description}</p>` : `<p>${ev.subtitle || 'Descrição não disponível.'}</p>`;
      
      // CTA (WhatsApp)
      const defaultWhatsapp = "https://wa.me/5541999450111?text=Ol%C3%A1!%20Tenho%20interesse%20no%20evento%20" + encodeURIComponent(finalTitle);
      const whatsappLink = ev.whatsapp_url || defaultWhatsapp;
      whatsappCta.href = whatsappLink;
      whatsappTopCta.href = whatsappLink;

      // 3. CARREGAR E RENDERIZAR HOTÉIS (VENUES)
      const venueSlug = ev.venue_slug || ''; // <== ESTA CHAVE DEVE EXISTIR NO SEU JSON DO EVENTO
      if (venueSlug) {
          await renderHotels(venueSlug, finalTitle);
      } else {
          hotelsSection.style.display = 'none';
      }

      // Motivos para Visitar (Carrossel Principal)
      // ... (restante do código de motivos e eventos similares) ...

      loading.hidden = true;
      eventContent.hidden = false;

    } catch (e) {
      console.error('Erro ao carregar evento:', e);
      renderError(e.message);
    }
  }

  document.addEventListener('DOMContentLoaded', loadEventData);
})();
