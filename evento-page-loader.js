// evento-page-loader.js (FINAL - LÓGICA DE BANNER SIMPLIFICADA)

(function () {
  const DATA_BASE_PATH = './data/events/'; 
  const ALL_EVENTS_URL = './event.json'; 
  
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

  // FUNÇÃO REVISADA E SIMPLIFICADA: Adiciona BASE_PATH somente se o caminho não for relativo (começar com /)
  function fixPath(path) {
      if (!path) return path;

      // Normaliza: remove barras inicial/final e BASE_PATH existente
      let normalizedPath = path.replace(BASE_PATH, '').replace(/^\/|\/$/g, '');
      
      if (BASE_PATH) {
          // Garante que o path comece com BASE_PATH, exceto se for um caminho relativo de arquivo (ex: 'event.json')
          if (normalizedPath.startsWith('assets') || normalizedPath.startsWith('data')) {
            return BASE_PATH + '/' + normalizedPath;
          }
      }
      // Para Netlify ou paths não afetados pelo BASE_PATH (ou paths relativos como './event.json')
      return normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath;
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
    const subtitle = ev.subtitle || 'Detalhes do evento...';
    const slug = ev.slug; 
    
    const finalUrl = `evento.html?slug=${slug}`;
    
    // NOVO CAMINHO SIMPLIFICADO para a thumb do card
    const rawImagePath = `/assets/img/banners/${slug}-thumb.webp`; 
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
          // Adiciona 1px para evitar problemas de arredondamento em navegadores
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
      
      // Conecta os botões do WRAPPER específico
      const prevButton = wrapper.querySelector('.carousel-nav.prev');
      const nextButton = wrapper.querySelector('.carousel-nav.next');

      if (prevButton && nextButton) {
          prevButton.addEventListener('click', () => {
              carousel.scrollBy({left: -cardWidth, behavior: 'smooth'});
          });
          nextButton.addEventListener('click', () => {
              carousel.scrollBy({left: cardWidth, behavior: 'smooth'});
          });
          
          // Lógica para Ocultar/Mostrar setas (Desktop)
          const checkScroll = () => {
              const currentScroll = carousel.scrollLeft;
              const maxScroll = carousel.scrollWidth - carousel.clientWidth;

              // Só roda a lógica de display em telas maiores que 1024px
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

  // Função para renderizar o Carrossel de Eventos Similares
  async function renderRelatedEvents(currentEventCategory, currentEventSlug) {
      console.log(`[DEBUG RELATED] Iniciando renderização para Categoria: ${currentEventCategory}, Slug: ${currentEventSlug}`);
      try {
          // Garante que a seção esteja visível ao iniciar a tentativa de carregamento
          relatedEventsSection.hidden = false;
          
          const relatedCarouselId = 'relatedCarouselContainer';
          const relatedWrapperId = 'relatedWrapper';
          
          console.log(`[DEBUG RELATED] Tentando carregar lista de todos os eventos de: ${fixPath(ALL_EVENTS_URL)}`);
          const res = await fetch(fixPath(ALL_EVENTS_URL));

          if (!res.ok) {
              console.error(`[DEBUG RELATED] Falha no FETCH! Status: ${res.status} para URL: ${fixPath(ALL_EVENTS_URL)}`);
              throw new Error("Falha ao carregar lista de eventos similares (Erro de Rede).");
          }
          
          const allEvents = await res.json();
          console.log(`[DEBUG RELATED] Lista de eventos carregada. Total: ${allEvents.length}`);
          
          // Filtra por category_macro E exclui o evento que está sendo visualizado (pelo slug)
          const relatedEvents = allEvents.filter(ev => 
              ev.category_macro === currentEventCategory && ev.slug !== currentEventSlug
          );

          console.log(`[DEBUG RELATED] Eventos similares encontrados (após filtro): ${relatedEvents.length}`);
          
          // Oculta APENAS se a lista filtrada estiver vazia (tamanho 0)
          if (relatedEvents.length === 0) {
              console.log("[DEBUG RELATED] NENHUM evento similar encontrado. Ocultando seção.");
              relatedEventsSection.hidden = true;
              return;
          }
          
          relatedTitle.textContent = `Mais Eventos em ${currentEventCategory.toUpperCase()}`;
          
          const relatedSlides = relatedEvents.map(buildSimilarEventCard).join('');
          relatedCarouselContainer.innerHTML = relatedSlides;

          console.log("[DEBUG RELATED] Carrossel populado e inicializado com sucesso.");
          // Inicializa o carrossel de Sugestões
          initCarousel(relatedCarouselId, relatedWrapperId, false); 

      } catch (e) {
          console.error("[DEBUG RELATED] Erro FINAL no processo de renderização de similares:", e);
          // Oculta apenas se houver um erro grave (rede/JSON inválido)
          relatedEventsSection.hidden = true; 
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


  async function loadEventData() {
    const slug = getSlug();
    if (!slug) {
      return renderError('Nenhum evento especificado na URL.');
    }
    
    try {
      const jsonPath = `${DATA_BASE_PATH}${slug}.json`;
      const res = await fetch(jsonPath);

      if (!res.ok) {
        const rootRes = await fetch(`./${slug}.json`);
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
      const faviconRawPath = ev.favicon_image_path || `/assets/img/banners/${slug}-favicon.webp`;
      const faviconPath = fixPath(faviconRawPath);
      const faviconEl = document.querySelector('link[rel="icon"]'); 
      if (faviconEl) {
          faviconEl.href = faviconPath; 
      }
      
      eventTitle.textContent = finalTitle;
      
      // Lógica para carregar o vídeo do YouTube (<iframe>) ou o Banner (<img>)
      const rawVideoInput = ev.YouTubeVideo; 
      const youtubeVideoId = extractVideoId(rawVideoInput);

      if (youtubeVideoId) {
          // SE HOUVER VÍDEO:
          heroBannerContainer.style.display = 'none';

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
          
      } else {
          // SE NÃO HOUVER VÍDEO (Exibe o banner no topo como padrão):
          heroBannerContainer.style.display = 'block'; 

          // LÓGICA SIMPLIFICADA E PURA PARA O BANNER HERO: [slug]-hero.webp
          // Ignora qualquer fallback complexo e usa a convenção padrão.
          const rawHeroPath = `/assets/img/banners/${slug}-hero.webp`;
          const heroPath = fixPath(rawHeroPath);
          
          eventHero.src = heroPath;
          eventHero.alt = `Banner do evento ${finalTitle}`;
          eventHero.style.display = 'block';
      }
      
      const metaHtml = [ev.city_state, ev.start_date, ev.category_macro].filter(Boolean).join(' | ');
      eventMeta.textContent = metaHtml;
      
      eventDescription.innerHTML = ev.initial_description ? `<p>${ev.initial_description}</p>` : `<p>${ev.subtitle || 'Descrição não disponível.'}</p>`;
      
      // CTA (WhatsApp)
      const defaultWhatsapp = "https://wa.me/5541999450111?text=Ol%C3%A1!%20Tenho%20interesse%20no%20evento%20" + encodeURIComponent(finalTitle);
      const whatsappLink = ev.whatsapp_url || defaultWhatsapp;
      whatsappCta.href = whatsappLink;
      whatsappTopCta.href = whatsappLink;

      // Motivos para Visitar (Carrossel Principal)
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
        
        motivosContainer.innerHTML = motivoSlides;
        motivosContainer.classList.add('cl-track'); // Garante que o container use o cl-track
        
        // Renderiza as setas de navegação (HTML) no wrapper
        motivosWrapperEl.insertAdjacentHTML('beforeend', `
              <button class="carousel-nav prev">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
              </button>
              <button class="carousel-nav next">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
              </button>
          `);
        
        initCarousel(motivosCarouselId, motivosWrapperId, true); // Inicializa Motivos
        
      } else {
        document.querySelector('.motivos-section h2').hidden = true;
        motivosWrapperEl.hidden = true;
      }

      // 5. Renderiza Eventos Similares
      if (ev.category_macro) {
          console.log(`[DEBUG RELATED] category_macro encontrada: ${ev.category_macro}`);
          renderRelatedEvents(ev.category_macro, slug); 
      } else {
          console.log("[DEBUG RELATED] category_macro AUSENTE no JSON do evento. Ocultando seção.");
          relatedEventsSection.hidden = true;
      }

      loading.hidden = true;
      eventContent.hidden = false;

    } catch (e) {
      console.error('Erro ao carregar evento:', e);
      renderError(e.message);
    }
  }

  document.addEventListener('DOMContentLoaded', loadEventData);
})();
