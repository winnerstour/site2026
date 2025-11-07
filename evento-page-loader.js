// evento-page-loader.js (COMPLETO E FINALIZADO - AGORA COM HOTÉIS)

(function () {
  const DATA_BASE_PATH = './data/events/'; 
  const ALL_EVENTS_URL = './event.json'; 
  const VENUE_DATA_PATH = './venue-data/'; 
  
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
  const SCROLL_SPEED = 8000; 

  // Seleção de Elementos 
  const eventContent = document.getElementById('eventContent');
  const loading = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const pageTitle = document.getElementById('pageTitle');
  const eventTitle = document.getElementById('eventTitle');
  
  // ELEMENTOS DO NOVO HERO DE TELA CHEIA
  const heroSection = document.getElementById('eventHeroSection'); 
  const heroTitle = document.getElementById('heroTitle');         
  const heroSubheadline = document.getElementById('heroSubheadline'); 
  const heroBadge = document.getElementById('heroBadge');         
  const heroWhatsappCta = document.getElementById('heroWhatsappCta'); 

  // ELEMENTOS DO NOVO RODAPÉ
  const eventPageFooter = document.getElementById('eventPageFooter');
  const footerCtaTitle = document.getElementById('footerCtaTitle');
  const footerWhatsappCta = document.getElementById('footerWhatsappCta');
  const footerBottomRelated = document.getElementById('footerBottomRelated'); 
  const agencyNameTitle = document.getElementById('agencyNameTitle'); 
  const agencyNameMicro = document.getElementById('agencyNameMicro'); 
  const currentYear = document.getElementById('currentYear'); 

  // OUTROS ELEMENTOS
  const eventMeta = document.getElementById('eventMeta');
  const eventDescription = document.getElementById('eventDescription');
  const motivosContainer = document.getElementById('motivosContainer');
  const whatsappCta = document.getElementById('whatsappCta');
  const whatsappTopCta = document.getElementById('whatsappTopCta');

  const youtubeVideoContainer = document.getElementById('youtubeVideoContainer');
  
  // ELEMENTOS DO CARROSSEL DE HOTÉIS
  const hotelsSection = document.getElementById('hotelsSection');
  const hotelsCarouselContainer = document.getElementById('hotelsCarouselContainer');
  const hotelsWrapper = document.getElementById('hotelsWrapper');
  const hotelsWhatsLink = document.getElementById('hotelsWhatsLink');

  // --- FUNÇÕES AUXILIARES ---

  function fixPath(path) {
      if (!path) return path;

      if (path.startsWith('./') || path.startsWith(DATA_BASE_PATH.substring(2))) {
          if (BASE_PATH) {
              return BASE_PATH + path.substring(1); 
          }
          return path; 
      }
      
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
    if (loading) loading.hidden = true;
    if (errorDiv) {
        errorDiv.hidden = false;
        errorDiv.innerHTML = '<h2 style="color:var(--brand)">Erro</h2><p>' + (message || 'Não foi possível carregar os detalhes do evento.') + '</p>';
    }
  }

  function extractVideoId(input) {
      if (!input) return null;
      try {
          const url = new URL(input);
          const urlParams = new URLSearchParams(url.search);
          const idFromQuery = urlParams.get('v');
          if (idFromQuery) return idFromQuery;
      } catch (e) {}
      return input.split('/').pop().split('=').pop();
  }

  // Converte HEX para RGB 
  function hexToRgb(hex) {
    if (!hex || hex.length < 7) return [249, 115, 22]; 
    var r = parseInt(hex.substring(1, 3), 16);
    var g = parseInt(hex.substring(3, 5), 16);
    var b = parseInt(hex.substring(5, 7), 16);
    return [r, g, b];
  }

  // Função auxiliar para definir cores e gradiente do Hero/Footer
  function getHeroGradient(chipColorClass) {
      const colorMap = {
          'bg-amber-500': '#fbbf24', 
          'bg-red-500': '#ef4444', 
          'bg-green-500': '#10b981', 
          'bg-blue-500': '#3b82f6', 
          'bg-indigo-700': '#4338ca', 
          'bg-slate-700': '#334155', 
          'default': '#f97316' 
      };

      const baseColor = colorMap[chipColorClass.split(' ')[0]] || colorMap['default'];
      const gradientEnd = '#6b21a8'; 
      
      function blendColors(c1, c2, ratio) {
          const hexToRgb = hex => [parseInt(hex.substring(1, 3), 16), parseInt(hex.substring(3, 5), 16), parseInt(hex.substring(5, 7), 16)];
          const rgb1 = hexToRgb(c1);
          const rgb2 = hexToRgb(c2);
          const r = Math.round(rgb1[0] * ratio + rgb2[0] * (1 - ratio));
          const g = Math.round(rgb1[1] * ratio + rgb2[1] * (1 - ratio));
          const b = Math.round(rgb1[2] * ratio + rgb2[2] * (1 - ratio));
          return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
      }

      // Ajuste: Mistura 90% Branco + 10% Cor Base para um toque muito sutil da cor do chip (mais próximo do branco)
      const highlightLight = blendColors(baseColor, '#FFFFFF', 0.1); 
      
      return {
          highlight: baseColor,
          highlightLight: highlightLight, 
          gradientStart: baseColor,
          gradientEnd: gradientEnd
      };
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
  
  // Card de Evento Similar
  function buildSimilarEventCard(ev) {
    const title = ev.title || 'Evento sem título';
    const subtitle = ev.slug; 
    const slug = ev.slug; 
    
    const finalUrl = `evento.html?slug=${slug}`;
    
    const rawImagePath = `/assets/img/banners/${slug}-hero.webp`; 
    const imagePath = fixPath(rawImagePath);

    const faviconRawPath = `/assets/img/banners/${slug}-favicon.webp`;
    const faviconPath = fixPath(faviconRawPath);

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
  
  // Mapeamento de cor da borda do hotel baseado na Categoria (1 a 4)
  const hotelCategoryColors = {
      1: 'border: 2px solid #3b82f6;', // Bate e Volta (Azul)
      2: 'border: 2px solid #10b981;', // Econômico (Verde)
      3: 'border: 2px solid #f97316;', // Conforto/Produtividade (Laranja)
      4: 'border: 2px solid #ef4444;', // VIP/Diretoria (Vermelho)
  };

  // FUNÇÃO PARA CRIAR CARDS DE HOTEL
  function buildHotelCard(hotel) {
      const isDayTrip = hotel.type === 'daytrip';
      const category = hotel.category || (isDayTrip ? 1 : 2); // Usa 1 p/ daytrip, fallback 2
      const categoryText = isDayTrip ? 'BATE E VOLTA' : hotel.description.match(/<strong[^>]*>([^<]+)<\/strong>/)?.[1] || `Opção ${category}`;
      const priceHtml = isDayTrip ? 'CONSULTE' : `R$ ${hotel.nightly_from_brl || '---'},00 <small>/noite</small>`;
      const starsHtml = isDayTrip ? '' : '★'.repeat(hotel.stars);
      const ctaLabel = hotel.cta || (isDayTrip ? 'RESERVAR VOO' : 'RESERVAR HOTEL');
      
      const hotelImage = fixPath(hotel.image || `/assets/hotels/default.webp`); 
      const coverStyleInline = hotelCategoryColors[category] || hotelCategoryColors[2];

      return `
          <div class="cl-slide">
              <div class="hotel-card" style="${coverStyleInline}">
                  <div class="thumb">
                      <img loading="lazy" src="${hotelImage}" alt="${hotel.name}">
                  </div>
                  <div class="content">
                      <div class="category">${categoryText.toUpperCase()}</div>
                      <h3 class="title">${hotel.name} <span class="stars">${starsHtml}</span></h3>
                      <p>${hotel.description}</p>
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
          
          // Filtra e pega até 8 hotéis/daytrips
          const filteredHotels = hotels.filter(h => h.type === 'hotel' || h.type === 'daytrip').slice(0, 8);
          
          const hotelSlides = filteredHotels.map(buildHotelCard).join('');
          hotelsCarouselContainer.innerHTML = hotelSlides;
          
          const whatsText = encodeURIComponent(`Olá! Gostaria de receber a proposta detalhada de roteiros de viagem para o evento ${eventTitle} (${venueData.name}).`);
          const baseWhats = 'https://wa.me/5541999450111?text=';
          if(hotelsWhatsLink) hotelsWhatsLink.href = baseWhats + whatsText;
          
          initCarousel('hotelsCarouselContainer', 'hotelsWrapper', false);

          hotelsSection.style.display = 'block';

      } catch (e) {
          console.error("Erro ao carregar ou renderizar hotéis:", e);
          hotelsSection.style.display = 'none';
      }
  }


  // Função para renderizar o Carrossel de Eventos Similares
  async function renderRelatedEvents(currentEventCategory, currentEventSlug) {
    if(!footerBottomRelated) return;
    
    try {
        const finalAllEventsUrl = fixPath(ALL_EVENTS_URL);
        const res = await fetch(finalAllEventsUrl);
        
        if (!res.ok) throw new Error("Falha ao carregar lista de eventos similares.");
        
        const allEvents = await res.json();
        const relatedEvents = allEvents.filter(ev => 
            ev.category_macro === currentEventCategory && ev.slug !== currentEventSlug
        );

        if (relatedEvents.length === 0) {
            footerBottomRelated.style.display = 'none';
            return;
        }
        
        const relatedTitleText = `Mais Eventos em ${currentEventCategory.toUpperCase()}`;
        const relatedSlides = relatedEvents.map(buildSimilarEventCard).join('');
        
        // NOVO: Injeta a estrutura completa do carrossel no footerBottomRelated
        const relatedHtml = `
            <div id="relatedEventsSection" class="motivos-section" style="margin-top: 30px !important;">
                <h2 id="relatedTitle" class="wrap">${relatedTitleText}</h2>
                <div id="relatedWrapper" class="motivos-wrapper">
                    <div id="relatedCarouselContainer" class="cl-track">
                        ${relatedSlides}
                    </div>
                    <button class="carousel-nav prev" id="prevRelated">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
                    </button>
                    <button class="carousel-nav next" id="nextRelated">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
                    </button>
                </div>
            </div>
        `;
        
        footerBottomRelated.innerHTML = relatedHtml;
        footerBottomRelated.style.display = 'block';

        // Inicializa o carrossel, usando os novos IDs injetados
        initCarousel('relatedCarouselContainer', 'relatedWrapper', false); 

    } catch (e) {
        console.error("Erro FINAL no processo de renderização de similares:", e);
        if(footerBottomRelated) footerBottomRelated.style.display = 'none';
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
      const venueSlug = ev.venue_slug || ev.venue || ev.slug;
      
      // Formata o slug do local: retira traços e coloca em caixa alta
      const formattedVenueName = venueSlug
          .replace(/-/g, ' ') 
          .toUpperCase();
      
      // Pega a cor do JSON 
      const chipColor = ev.ChipColor || ev.chip_color || 'bg-slate-700'; 
      const colors = getHeroGradient(chipColor);
      
      // ******* 1. ATUALIZAÇÃO DA PÁGINA E FAVICON *******
      if (pageTitle) pageTitle.textContent = `${finalTitle} — WinnersTour`;
      
      const faviconRawPath = `/assets/img/banners/${slug}-favicon.webp`;
      const faviconPath = fixPath(faviconRawPath);
      const faviconEl = document.querySelector('link[rel="icon"]'); 
      if (faviconEl) {
          faviconEl.href = faviconPath; 
      }
      
      // ******* 2. CARREGAR E EXIBIR O NOVO HERO DE TELA CHEIA *******
      
      // 2.1. Caminho da Imagem de Fundo (nova convenção)
      const categoryMacroSlug = ev.category_macro ? ev.category_macro.replace(/ /g, '-').replace(/&/g, 'e') : 'default';
      const rawHeroBgPath = `/assets/img/banners/${categoryMacroSlug}-bannerhero.webp`;
      const heroBgPath = fixPath(rawHeroBgPath);
      
      // 2.2. Preencher a Seção Hero de Tela Cheia (heroSection)
      if(heroSection) {
          heroSection.style.backgroundImage = `url('${heroBgPath}')`;
          heroSection.style.display = 'flex';

          // Configura a cor de destaque CLARA e a cor BRAND principal via CSS Variables (para o gradiente)
          heroSection.style.setProperty('--highlight-color-light', colors.highlightLight);
          document.documentElement.style.setProperty('--brand', colors.highlight);
          
          const overlay = heroSection.querySelector('.hero-overlay');
          if (overlay) {
              overlay.style.background = `linear-gradient(135deg, ${colors.gradientStart}AA 0%, ${colors.gradientEnd}DD 100%)`;
          }
      }
      if(heroTitle) {
          // NOVO: Aplica a tag <small> para as partes que devem ter o tamanho reduzido (75%)
          const formattedTitle = `<small>Sua viagem para</small><br><span class="highlight">${finalTitle.toUpperCase()}</span> <small>resolvida em minutos.</small>`;
          heroTitle.innerHTML = formattedTitle;
      }
      if(heroSubheadline) {
          // Usa o nome do local formatado
          heroSubheadline.textContent = `Voos + hotéis próximos ao ${formattedVenueName} com tarifas corporativas e suporte completo.`;
      }
      if(heroBadge && ev.category_micro) {
          heroBadge.textContent = ev.category_micro.toUpperCase();
      } else if (heroBadge) {
          heroBadge.style.display = 'none';
      }

      // Oculta elementos antigos que foram substituídos pelo Hero
      if(eventTitle) eventTitle.style.display = 'none';
      if(eventMeta) eventMeta.style.display = 'none';


      // 3. CARREGAR E EXIBIR O VÍDEO (REDUZIDO PARA 70%)
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
      
      // CTA (WhatsApp)
      const defaultWhatsapp = "https://wa.me/5541999450111?text=Ol%C3%A1!%20Tenho%20interesse%20no%20pacote%20completo%20para%20" + encodeURIComponent(finalTitle);
      const whatsappLink = ev.whatsapp_url || defaultWhatsapp;
      if(whatsappCta) whatsappCta.href = whatsappLink;
      if(whatsappTopCta) whatsappTopCta.href = whatsappLink;
      if(heroWhatsappCta) heroWhatsappCta.href = whatsappLink; 
      if(footerWhatsappCta) footerWhatsappCta.href = whatsappLink; // CTA RODAPÉ

      // 4. CARREGAR E RENDERIZAR HOTÉIS (VENUES)
      if (venueSlug) {
          await renderHotels(venueSlug, finalTitle);
      } else {
          if (hotelsSection) hotelsSection.style.display = 'none';
      }

      // 5. Motivos para Visitar
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
            motivosContainer.classList.add('cl-track'); 
        }
        
        if(motivosWrapperEl) motivosWrapperEl.insertAdjacentHTML('beforeend', `
              <button class="carousel-nav prev">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
              </button>
              <button class="carousel-nav next">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
              </button>
          `);
        
        initCarousel(motivosCarouselId, motivosWrapperId, true); 
        
      } else {
        if(document.querySelector('.motivos-section h2')) document.querySelector('.motivos-section h2').hidden = true;
        if(motivosWrapperEl) motivosWrapperEl.hidden = true;
      }

      // 6. Renderiza Eventos Similares (AGORA NO RODAPÉ)
      if (ev.category_macro) {
          renderRelatedEvents(ev.category_macro, slug); 
      }

      // 7. PREENCHIMENTO DO RODAPÉ
      if (eventPageFooter) {

          if (footerCtaTitle) {
              footerCtaTitle.textContent = `Garanta Sua Vaga na ${finalTitle}!`;
          }

          // PREENCHIMENTO DA SEÇÃO AGENCY NAME (LOGO GRADIENTE)
          if (agencyNameMicro) {
              const categoryMicro = ev.category_micro ? `Especializada em viagens corporativas para profissionais de ${ev.category_micro.toLowerCase()}` : 'Especializada em viagens corporativas';
              agencyNameMicro.textContent = `${categoryMicro}. Sua parceira de confiança para ${finalTitle}.`;
          }
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
