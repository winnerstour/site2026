// evento-page-loader.js (COMPLETO E FINALIZADO - CORRIGIDO ERRO CRÍTICO DE DECLARAÇÃO E LÓGICA DO BOTÃO BATE-VOLTA)

(function () {
  // DOMAIN_BASE: Definido no escopo da IIFE para evitar erro de declaração dupla.
  const DOMAIN_BASE = 'https://www.comprarviagem.com.br/winnerstour'; 
  const DATA_BASE_PATH = './data/events/'; 
  const ALL_EVENTS_URL = './event.json'; 
  const VENUE_DATA_PATH = './venue-data/'; 
  
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
  const SCROLL_SPEED = 8000; 

  // Mapeamento Tailwind para HEX (necessário para aplicar a cor do botão via CSS inline)
  const TAILWIND_HEX_MAP = {
      'amber-500': '#fbbf24', 
      'orange-500': '#f97316', 
      'orange-700': '#c2410c',
      'rose-600': '#e11d48',
      'default': '#10b981', // Fallback
  };

  // --- TEXTOS FIXOS PARA CATEGORIAS 2 E 3 (NOVO BLOCO) ---
  const CATEGORY_TEXT_OVERRIDES = {
      2: '<strong>Só pra dormir e economizar?</strong> Opção enxuta para descansar bem entre um dia e outro de feira, com ótimo custo-benefício. Ideal para quem quer praticidade e foco total no evento.',
      3: '<strong>Mais conforto para estadias de duas noites ou mais.</strong> Categoria superior, com quartos aconchegantes, pensada para quem quer descansar melhor e aproveitar cada dia de feira.'
  };

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
  
  // NOVO ELEMENTO DO BOTÃO DE SIMULAÇÃO (Mantido no JS para referência, mas ignorado no DOM)
  const simulationCta = document.getElementById('simulationCta');


  // --- CONFIGURAÇÕES PADRÃO DE PAX ---
  const PAX_CONFIG = {
      adults: 1, // Fixado em 1 adulto
      children: 0,
      infants: 0,
      teenagers: 0,
      isRoundTrip: true,
      departureIata: "CWB" 
  };
  const DEFAULT_ROOMS_COUNT = 1;
  const DEFAULT_ADULTS = PAX_CONFIG.adults; // 1
  const ROOM_ICON = '🏠'; // Declaração ÚNICA VÁLIDA MANTIDA

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
  
  // NOVO OBJETO DE TEMA PARA HOTÉIS (Tailwind Classes)
  const HOTEL_THEME = {
      1: {
          cardBorder: "border-amber-500",
          cardRing: "focus-within:ring-amber-500",
          button: "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          chip: "bg-amber-100 text-amber-800",
      },
      2: {
          cardBorder: "border-orange-500",
          cardRing: "focus-within:ring-orange-500",
          button: "bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          chip: "bg-orange-100 text-orange-800",
      },
      3: {
          cardBorder: "border-orange-700",
          cardRing: "focus-within:ring-orange-700",
          button: "bg-orange-700 hover:bg-orange-800 focus-visible:ring-orange-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          chip: "bg-orange-100 text-orange-900",
      },
      4: {
          cardBorder: "border-rose-600",
          cardRing: "focus-within:ring-rose-600",
          button: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          chip: "bg-rose-100 text-rose-800",
      },
  };
  function getHotelTheme(category) {
      // Fallback para Categoria 2 (Econômico)
      return HOTEL_THEME[category] || HOTEL_THEME[2]; 
  }

  // Lógica para determinar o nível de preço dinâmico ($$, $$$, $$$$, $$$$$$)
  function calculatePriceLevel(price, priceData) {
      if (typeof price !== 'number' || priceData.prices.length === 0) return '';
      
      const prices = priceData.prices;
      
      // Funcao para calcular o percentil
      const getPercentile = (arr, p) => {
          if (arr.length === 0) return 0;
          const pos = (arr.length - 1) * p;
          const base = Math.floor(pos);
          const rest = pos - base;
          if (base >= arr.length - 1) return arr[arr.length - 1];
          return arr[base] + rest * (arr[base + 1] - arr[base]);
      };

      const q25 = getPercentile(prices, 0.25);
      const q50 = getPercentile(prices, 0.50);
      const q75 = getPercentile(prices, 0.75);

      // Mapeamento para 2, 3, 4, 6 cifrões baseados em quartis
      if (price <= q25) return '$$';
      if (price <= q50) return '$$$';
      if (price <= q75) return '$$$$';
      return '$$$$$$'; 
  }

  // ***************************************************************
  // Funções de Geração de Links Dinâmicos da ComprarViagem
  // ***************************************************************

  function generateRoomsJson(adults, children, infants, childrenAges, roomsCount) {
      const rooms = [];
      for (let i = 0; i < roomsCount; i++) {
          rooms.push({
              "numberOfAdults": adults,
              "numberOfInfant": infants,
              "numberOfChilds": children,
              "agesOfChild": childrenAges || [],
              "roomNum": i
          });
          break; // Garante apenas 1 quarto no JSON rooms
      }
      return JSON.stringify(rooms);
  }
  
  /**
   * Monta o link para a tela de Seleção de Voos (Passo 1 do fluxo combinado).
   * @param {object} eventData - Contém start_date, end_date, cityIata.
   * @param {object} paxConfig - Contém adults, departureIata, isRoundTrip, etc.
   * @returns {string} URL completa.
   */
  function buildCombinedFlightUrl(eventData, paxConfig) {
      const BASE_URL = DOMAIN_BASE;
      
      // CORRIGIDO: Garante que só anexe T00:00:00Z se a data existir (para evitar 0001-01-01)
      const departureDate = eventData.start_date ? `${eventData.start_date}T00:00:00Z` : '';
      const returnDate = eventData.end_date ? `${eventData.end_date}T00:00:00Z` : '';

      // NOTA: O destinationIata deve vir do JSON do evento (cityIata)
      const destinationIata = eventData.cityIata || 'SAO';
      
      const params = new URLSearchParams({
          departureDate: departureDate,
          returnDate: returnDate,
          departureIata: paxConfig.departureIata,
          arrivalIata: destinationIata,
          adultsCount: paxConfig.adults, // CORRIGIDO: Usa 1 adulto (PAX_CONFIG)
          childCount: paxConfig.children,
          infantCount: paxConfig.infants,
          teenagerCount: paxConfig.teenagers,
          isRoundTrip: paxConfig.isRoundTrip,
          isPackage: 'false',
          source: 'f'
      }).toString();

      // CORREÇÃO CRÍTICA: Descodifica os caracteres necessários na data
      const correctedParams = params.replace(/%3A/g, ':').replace(/%2B/g, '+').replace(/%2C/g, ',');

      return `${BASE_URL}/public/combined/flight?${correctedParams}`;
  }


  function buildHotelDetailUrl(hotel, theme, evData) {
      const BASE_URL = DOMAIN_BASE;
      
      // Ocupação padrão: 1 Adulto (como solicitado)
      const adults = PAX_CONFIG.adults; // 1
      const children = PAX_CONFIG.children;
      const infants = PAX_CONFIG.infants;
      const roomsCount = DEFAULT_ROOMS_COUNT; 
      
      const checkInDate = evData.start_date; 
      const checkOutDate = evData.end_date || evData.start_date;
      
      // Formatos ISO
      // CORRIGIDO: Garante que só anexe T00:00:00.000Z se a data existir
      const startDateDetail = checkInDate ? `${checkInDate}T00:00:00.000Z` : '';
      const endDateDetail = checkOutDate ? `${checkOutDate}T00:00:00.000Z` : '';
      const encodedRooms = generateRoomsJson(adults, children, infants, hotel.childrenAges, roomsCount);
      
      // Obtém o ID interno do hotel (usa 'id' ou 'id-name' do JSON do hotel)
      const hotelIdLink = hotel.id || hotel['id-name'] || 'N/A';
      
      // --- ENDPOINT 1: DETALHES DO HOTEL ---
      const detailParams = new URLSearchParams({
          rooms: encodedRooms,
          numberOfAdults: adults, // CORRIGIDO: 1 adulto
          numberOfChild: children,
          numberOfInfant: infants,
          numberOfRooms: roomsCount,
          hotelId: hotelIdLink, 
          type: 3, 
          startDate: startDateDetail,
          endDate: endDateDetail,
          source: 'h',
          scrollToBeds: 'true'
      }).toString();

      // CORREÇÃO CRÍTICA: Descodifica os caracteres necessários na data e no rooms
      const correctedDetailParams = detailParams.replace(/%3A/g, ':').replace(/%2B/g, '+').replace(/%2C/g, ',');
      const hotelDetailUrl = `${BASE_URL}/hotel-detail?${correctedDetailParams}`;
      
      // Botão Detalhes: Usa a cor da borda do card (theme.cardBorder) como cor do texto
      // A classe text-{color}-500/700 deve estar disponível via Tailwind
      const detailTextColor = theme.cardBorder.replace('border-', 'text-');

      // Botão Secundário: Ver Detalhes do Hotel
      const hotelDetailButtonHtml = `
          <a href="${hotelDetailUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary w-full ${detailTextColor} border-2 ${theme.cardBorder}">Ver detalhes do hotel</a>
      `;

      return { hotelDetailUrl, hotelDetailButtonHtml };
  }
  
  /**
   * Monta o botão de WhatsApp para solicitação de pacote.
   */
  function buildWhatsAppPackageButton(hotel, evData, theme, themeHexColor, isDayTrip = false) {
      const eventTitle = evData.title || 'Evento';
      
      // Função para formatar a data
      const formatDateBR = (dateStr) => {
          if (!dateStr || dateStr.length !== 10) return "[DATA INDEFINIDA]";
          const [year, month, day] = dateStr.split('-');
          return `${day}/${month}/${year}`;
      };

      const checkInBR = evData.start_date ? formatDateBR(evData.start_date) : '[DATA DE ENTRADA]';
      const checkOutBR = evData.end_date ? formatDateBR(evData.end_date) : '[DATA DE SAÍDA]';

      let message, label;

      if (isDayTrip) {
          // Lógica para Bate e Volta (Somente Voo)
          label = 'Receber Voos no WhatsApp';
          // NOVO TEXTO: Exclui menção ao hotel
          message = `Olá! Quero um orçamento de Voos bate e volta para o evento ${eventTitle}, de ${checkInBR} a ${checkOutBR}. Saindo do aeroporto mais próximo da minha cidade.`;
      } else {
          // Lógica para Hotel Padrão (Voo + Hotel)
          const hotelName = hotel.name || 'Hotel Selecionado';
          label = 'Receber pacote no WhatsApp';
          message = `Olá! Quero um orçamento de voo + hotel para o evento ${eventTitle}, no hotel ${hotelName}, de ${checkInBR} a ${checkOutBR}. Saindo do aeroporto mais próximo da minha cidade.`;
      }

      const whatsappUrl = `https://wa.me/5541999450111?text=${encodeURIComponent(message)}`;

      // O estilo primário (fundo sólido) é forçado aqui
      // Adicionado justify-content: center para centralizar o texto do botão
      const style = `
          background-color: ${themeHexColor} !important;
          border-color: ${themeHexColor} !important;
          color: white !important;
          font-weight: 700 !important; 
          padding: 8px 12px !important;
          border-radius: 999px;
          font-size: 14px;
          display: flex; /* Garante que o display seja flexível para alinhamento */
          justify-content: center; /* Centraliza o conteúdo horizontalmente */
      `;

      // Ícone removido para manter o alinhamento centralizado
      const whatsappSvgOnlyText = '';

      return `
          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" 
             class="btn btn-primary w-full" style="${style}">
              ${whatsappSvgOnlyText}
              <span class="label">${label}</span>
          </a>
      `;
  }
  
  /**
   * Monta o botão de voo para o Card Bate e Volta com URL FIXA.
   * Este botão se torna o SECUNDÁRIO, com link fixo e estilo de borda.
   */
  function buildDayTripFlightButtonFixedUrl(theme, themeHexColor) {
    // Link Fixo para a Home da Loja Virtual
    const fixedFlightUrl = 'https://www.comprarviagem.com.br/winnerstour/home'; 
    
    // A classe text-{color}-500/700 deve estar disponível via Tailwind
    const detailTextColor = theme.cardBorder.replace('border-', 'text-');

    return `
        <a href="${fixedFlightUrl}" target="_blank" rel="noopener noreferrer" 
           class="btn btn-secondary w-full ${detailTextColor} border-2 ${theme.cardBorder}">Ver Voos Disponíveis</a>
    `;
  }
  
  // FUNÇÃO PARA CRIAR CARDS DE HOTEL
  function buildHotelCard(hotel, priceData, evData) {
      const isDayTrip = hotel.type === 'daytrip';
      const category = hotel.category || (isDayTrip ? 1 : 2);
      const theme = getHotelTheme(category);
      
      // NOVO: Mapeia a classe da borda (Ex: border-amber-500) para o HEX
      const themeColorName = theme.cardBorder.replace('border-', ''); 
      const themeHexColor = TAILWIND_HEX_MAP[themeColorName] || TAILWIND_HEX_MAP['default']; 
      
      // NOVO: Aplica a SOBRESCRITA do texto se for Categoria 2 ou 3
      let hotelDescription = hotel.description;
      if (CATEGORY_TEXT_OVERRIDES[category]) {
          hotelDescription = CATEGORY_TEXT_OVERRIDES[category];
      }
      
      // NOVO: Usa distance_min para o chip
      const distanceMin = hotel.distance_min ? `${hotel.distance_min} MIN DE DISTÂNCIA` : 'OPÇÃO DE VIAGEM';
      
      const priceLevel = calculatePriceLevel(hotel.nightly_from_brl, priceData);
      
      // Monta as partes da linha secundária
      const starsHtml = isDayTrip ? '' : `<span class="stars">${'★'.repeat(hotel.stars)}</span>`;
      
      const roomSpaceText = hotel.roomspace ? `${hotel.roomspace}m²` : '';

      // Constrói a linha de infos secundárias
      const roomInfoHtml = roomSpaceText ? 
          `<span class="room-info"><span class="emoji">${ROOM_ICON}</span> ${roomSpaceText}</span>` : '';
      
      const priceLevelHtml = priceLevel ? 
          `<span class="price-level">${priceLevel}</span>` : '';

      const separator = `<span class="info-separator">|</span>`;
      
      // Ordem: Tamanho | Preço | Estrelas
      let infoParts = [];
      if (roomInfoHtml) infoParts.push(roomInfoHtml);
      if (priceLevelHtml) infoParts.push(priceLevelHtml);
      if (starsHtml) infoParts.push(starsHtml);
      
      const infoLine = infoParts.join(separator); // Junta as partes com o pipe

      const hotelImage = fixPath(hotel.image || `/assets/hotels/default.webp`); 

      // Geração de links e botões dinâmicos
      const detailLink = buildHotelDetailUrl(hotel, theme, evData);
      
      let primaryButtonHtml;
      let secondaryButtonHtml; 

      if (isDayTrip) {
          // Card Bate e Volta:
          // 1. Botão PRIMÁRIO (sólido) é o de WhatsApp (com texto 'Voos')
          primaryButtonHtml = buildWhatsAppPackageButton(hotel, evData, theme, themeHexColor, true); // Passa isDayTrip=true
          // 2. Botão SECUNDÁRIO (borda) é o de Voo com URL Fixa (apontando para a Home)
          secondaryButtonHtml = buildDayTripFlightButtonFixedUrl(theme, themeHexColor);
      } else {
          // Card de Hotel Padrão:
          // 1. Botão PRIMÁRIO (sólido) é o de WhatsApp (pacote)
          primaryButtonHtml = buildWhatsAppPackageButton(hotel, evData, theme, themeHexColor, false); // Passa isDayTrip=false
          // 2. Botão SECUNDÁRIO (borda) é o de Detalhes do Hotel
          secondaryButtonHtml = detailLink.hotelDetailButtonHtml;
      }


      // Classes do Card: Base + Borda/Ring Dinâmicos (Tailwind)
      const cardClasses = `hotel-card rounded-2xl border-2 bg-white hover:shadow-lg transition focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-white ${theme.cardBorder} ${theme.cardRing}`;

      // Usa a nova variável hotelDescription, que pode conter o override
      return `
          <div class="cl-slide">
              <div class="${cardClasses}">
                  <div class="thumb">
                      <img loading="lazy" src="${hotelImage}" alt="${hotel.name}">
                  </div>
                  <div class="content">
                      <div class="category ${theme.chip}">${distanceMin.toUpperCase()}</div>
                      
                      <h3 class="title text-slate-900">
                          ${hotel.name}
                      </h3>
                      
                      <div class="secondary-info">
                          ${infoLine}
                      </div>

                      <p class="text-slate-600">${hotelDescription}</p>
                      
                      <div class="btn-group">
                          ${primaryButtonHtml}
                          ${secondaryButtonHtml}
                      </div>
                  </div>
              </div>
          </div>
      `;
  }
  
  // FUNÇÃO PARA CARREGAR E RENDERIZAR HOTÉIS
  async function renderHotels(venueSlug, eventTitle, evData) {
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
          
          // 1. Coleta e ordena os preços dos hotéis
          const prices = hotels
              .map(h => h.nightly_from_brl)
              .filter(p => typeof p === 'number' && p > 0)
              .sort((a, b) => a - b);
              
          let priceData = { prices: prices }; // Passamos o array ordenado completo
          
          // 2. Filtra e constrói os cards
          const filteredHotels = hotels.filter(h => h.type === 'hotel' || h.type === 'daytrip').slice(0, 8);
          
          // Passa priceData e evData para buildHotelCard
          const hotelSlides = filteredHotels.map(hotel => buildHotelCard(hotel, priceData, evData)).join('');
          hotelsCarouselContainer.innerHTML = hotelSlides;
          
          // Configura o link de simulação na sub-headline da seção de hotéis (NOVA LÓGICA)
          const simulationLink = document.querySelector('#hotelsSection .section-lead a');
          if(simulationLink) {
             simulationLink.href = 'https://www.comprarviagem.com.br/winnerstour/home';
             simulationLink.innerHTML = '<strong>clique aqui para simular voos + outros hotéis disponíveis na nossa loja virtual</strong>';
          }
          
          // O link do WhatsApp (hotelsWhatsLink) que era o anterior será atualizado no JS:
          const whatsLinkElement = document.getElementById('hotelsWhatsLink');
          if (whatsLinkElement && !simulationLink) { // Se o novo link de simulação foi criado, ignoramos o antigo hotelsWhatsLink (que é o mesmo elemento no HTML atual)
             // Manter o link do roteiro detalhado, mas garantir que a URL do Simular Voos esteja definida
             const whatsText = encodeURIComponent(`Olá! Gostaria de receber a proposta detalhada de roteiros de viagem para o evento ${eventTitle} (${venueData.name}).`);
             const baseWhats = 'https://wa.me/5541999450111?text=';
             whatsLinkElement.href = baseWhats + whatsText;
             // Nota: O HTML foi atualizado para que este elemento seja o link de simulação.
          }
          
          initCarousel('hotelsCarouselContainer', 'hotelsWrapper', false);

          hotelsSection.style.display = 'block'; // TORNA VISÍVEL APÓS O CARREGAMENTO

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
      
      const evData = ev; 
      
      const finalTitle = evData.title || 'Evento sem Título';
      const venueSlug = evData.venue_slug || evData.venue || evData.slug;
      
      // Formata o slug do local: retira traços e coloca em caixa alta
      const formattedVenueName = venueSlug
          .replace(/-/g, ' ') 
          .toUpperCase();
      
      // Pega a cor do JSON 
      const chipColor = evData.ChipColor || evData.chip_color || 'bg-slate-700'; 
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
      const categoryMacroSlug = evData.category_macro ? evData.category_macro.replace(/ /g, '-').replace(/&/g, 'e') : 'default';
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
          // CORRIGIDO: Removida a tag <br> para evitar quebra de linha indesejada.
          // Adicionado espaço antes do "resolvida" para evitar que fique grudado no nome do evento.
          const formattedTitle = `<small>Sua viagem para </small><span class="highlight">${finalTitle.toUpperCase()}</span> <small> resolvida em minutos.</small>`;
          heroTitle.innerHTML = formattedTitle;
      }
      if(heroSubheadline) {
          // Usa o nome do local formatado
          heroSubheadline.textContent = `Voos + hotéis próximos ao ${formattedVenueName} com tarifas corporativas e suporte completo.`;
      }
      if(heroBadge && evData.category_micro) {
          heroBadge.textContent = evData.category_micro.toUpperCase();
      } else if (heroBadge) {
          heroBadge.style.display = 'none';
      }

      // Oculta elementos antigos que foram substituídos pelo Hero
      if(eventTitle) eventTitle.style.display = 'none';
      if(eventMeta) eventTitle.style.display = 'none';


      // 3. CARREGAR E EXIBIR O VÍDEO (REDUZIDO PARA 70%)
      const rawVideoInput = evData.YouTubeVideo; 
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
      
      const metaHtml = [evData.city_state, evData.start_date, evData.category_macro].filter(Boolean).join(' | ');
      if(eventMeta) eventMeta.textContent = metaHtml;
      
      if(eventDescription) eventDescription.innerHTML = evData.initial_description ? `<p>${evData.initial_description}</p>` : `<p>${evData.subtitle || 'Descrição não disponível.'}</p>`;
      
      // CTA (WhatsApp)
      const defaultWhatsapp = "https://wa.me/5541999450111?text=Ol%C3%A1!%20Tenho%20interesse%20no%20pacote%20completo%20para%20" + encodeURIComponent(finalTitle);
      const whatsappLink = evData.whatsapp_url || defaultWhatsapp;
      if(whatsappCta) whatsappCta.href = whatsappLink;
      if(whatsappTopCta) whatsappTopCta.href = whatsappLink;
      if(heroWhatsappCta) heroWhatsappCta.href = whatsappLink; 
      if(footerWhatsappCta) footerWhatsappCta.href = whatsappLink; // CTA RODAPÉ

      // 4. CARREGAR E RENDERIZAR HOTÉIS (VENUES) - PASSANDO evData
      if (venueSlug) {
          await renderHotels(venueSlug, finalTitle, evData); 
      } else {
          if (hotelsSection) hotelsSection.style.display = 'none';
      }
      
      // Lógica do botão de simulação removida, apenas garantindo que o link do subtítulo seja configurado na renderHotels()

      // 5. Motivos para Visitar
      const extractedMotivos = Object.keys(evData)
          .filter(key => key.startsWith('motivo_titulo_'))
          .map(titleKey => {
            const index = titleKey.split('_')[2]; 
            return {
              motivo_emoji: evData[`motivo_emoji_${index}`],
              motivo_titulo: evData[titleKey],
              motivo_conteudo: evData[`motivo_conteudo_${index}`]
            };
          });
          
      const finalMotivos = extractedMotivos
          .filter(m => m.motivo_titulo)
          .concat(Array.isArray(evData.motivos) ? evData.motivos : []);

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
      if (evData.category_macro) {
          renderRelatedEvents(evData.category_macro, slug); 
      }

      // 7. PREENCHIMENTO DO RODAPÉ
      if (eventPageFooter) {

          if (footerCtaTitle) {
              footerCtaTitle.textContent = `Garanta Sua Vaga na ${finalTitle}!`;
          }

          // PREENCHIMENTO DA SEÇÃO AGENCY NAME (LOGO GRADIENTE)
          if (agencyNameMicro) {
              const categoryMicro = evData.category_micro ? `Especializada em viagens corporativas para profissionais de ${evData.category_micro.toLowerCase()}` : 'Especializada em viagens corporativas';
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
