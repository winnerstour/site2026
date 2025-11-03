// evento-page-loader.js (Final com Carrosséis Isolados e Funcionamento Corrigido)

(function () {
  const DATA_BASE_PATH = './data/events/'; 
  const ALL_EVENTS_URL = './event.json'; 
  
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';

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

  function fixPath(path) {
      if (path && path.startsWith('/assets')) {
          return BASE_PATH + path;
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

  // Card TUTORIAL/CONTEXTO (para a página de evento)
  function buildContextCardMotivos(categoryId, eventTitle) {
      const description = `Navegue pelo carrossel para ver todos os diferenciais da sua missão corporativa neste evento.`;

      return `
          <div class="cl-slide context-slide">
              <div class="card motivo-item context-card">
                  <div class="context-content">
                      <p class="motivo-text-body" style="font-size: 14px !important; color: var(--muted) !important; margin-bottom: 20px;">
                          ${description}
                      </p>
                      <button class="btn-ver-mais" onclick="document.getElementById('${categoryId}').scrollBy({left: 318, behavior: 'smooth'})">
                          Ver Mais
                          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
                      </button>
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
  
  // Card de Evento Similar
  function buildSimilarEventCard(ev) {
    const title = ev.title || 'Evento sem título';
    const subtitle = ev.subtitle || 'Detalhes do evento...';
    const slug = ev.slug; 
    
    const finalUrl = `evento.html?slug=${slug}`;
    
    const rawImagePath = ev.image || ev.hero_image_path || ev.banner_path || 'placeholder.webp';
    const imagePath = fixPath(rawImagePath);

    const faviconRawPath = `/assets/img/banners/${slug}-favicon.webp`;
    const faviconPath = fixPath(faviconRawPath);

    const faviconHtml = `<img class="favicon" src="${faviconPath}" alt="" aria-hidden="true" onerror="this.style.display='none';">`;
    
    return `
      <div class="cl-slide">
        <a href="${finalUrl}" class="card" aria-label="${title}">
          <div class="thumb" style="height: 100px;">
            <img loading="lazy" src="${imagePath}" alt="${title}">
          </div>
          <div class="content">
            <h3 class="title" style="font-size: 1rem; line-height: 1.3; max-height: 1.3em;">
              ${faviconHtml}
              <span>${title}</span>
            </h3>
            <p class="subtitle" style="font-size: 14px; line-height: 1.3;">${subtitle}</p>
          </div>
        </a>
      </div>
    `;
  }
  
  // FUNÇÃO DE INICIALIZAÇÃO UNIVERSAL DE CARROSSEL
  function initCarousel(carouselId, wrapperId) {
      const carousel = document.getElementById(carouselId);
      const wrapper = document.getElementById(wrapperId);
      if (!carousel || !wrapper) return;

      let scrollInterval;
      let isPaused = false;
      const SCROLL_SPEED = 4000; 
      const cardWidth = 318; // 300px card + 18px gap

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
          
          // Lógica para desativar/travar setas no início/fim
          const checkScroll = () => {
              const currentScroll = carousel.scrollLeft;
              const maxScroll = carousel.scrollWidth - carousel.clientWidth;

              if (window.innerWidth > 1024) {
                  prevButton.style.display = currentScroll > 10 ? 'block' : 'none';
                  nextButton.style.display = currentScroll < maxScroll - 10 ? 'block' : 'none';
              }
          };
          
          carousel.addEventListener('scroll', checkScroll);
          window.addEventListener('resize', checkScroll);
          checkScroll(); 
      }
  }

  // Função para renderizar o Carrossel de Eventos Similares
  async function renderRelatedEvents(currentEventCategory, currentEventSlug) {
      try {
          const relatedCarouselId = 'relatedCarouselContainer';
          const relatedWrapperId = 'relatedWrapper';
          
          const res = await fetch(fixPath(ALL_EVENTS_URL));
          if (!res.ok) throw new Error("Falha ao carregar lista de eventos similares.");
          
          const allEvents = await res.json();
          
          // Filtra eventos pela categoria macro
          const relatedEvents = allEvents.filter(ev => 
              ev.category_macro === currentEventCategory
          );
          
          // Não mostra a seção se houver 1 ou menos eventos (só o atual)
          if (relatedEvents.length <= 1) {
              relatedEventsSection.hidden = true;
              return;
          }
          
          // Título do Carrossel de Sugestões
          relatedTitle.textContent = `Mais Eventos em ${currentEventCategory.toUpperCase()}`;
          
          // Renderiza os slides
          const relatedSlides = relatedEvents.map(buildSimilarEventCard).join('');
          relatedCarouselContainer.innerHTML = relatedSlides;

          // Inicializa o carrossel de Sugestões (passando o ID do wrapper)
          initCarousel(relatedCarouselId, relatedWrapperId); 

      } catch (e) {
          console.error("Erro ao carregar eventos relacionados:", e);
          relatedEventsSection.hidden = true;
      }
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
      
      const faviconRawPath = ev.favicon_image_path || `/assets/img/banners/${slug}-favicon.webp`;
      const faviconEl = document.querySelector('link[rel="icon"]'); 
      if (faviconEl) {
          faviconEl.href = fixPath(faviconRawPath);
      }
      
      eventTitle.textContent = finalTitle;
      
      // Prioridade BANNER_PATH
      const rawHeroPath = ev.banner_path || ev.hero_image_path || ev.image || 'placeholder.webp';
      const heroPath = fixPath(rawHeroPath);
      
      eventHero.src = heroPath;
      eventHero.alt = `Banner do evento ${finalTitle}`;
      
      const metaHtml = [ev.city_state, ev.start_date, ev.category_macro].filter(Boolean).join(' | ');
      eventMeta.textContent = metaHtml;
      
      eventDescription.innerHTML = ev.initial_description ? `<p>${ev.initial_description}</p>` : `<p>${ev.subtitle || 'Descrição não disponível.'}</p>`;
      
      // 3. CTA (WhatsApp)
      const defaultWhatsapp = "https://wa.me/5541999450111?text=Ol%C3%A1!%20Tenho%20interesse%20no%20evento%20" + encodeURIComponent(finalTitle);
      const whatsappLink = ev.whatsapp_url || defaultWhatsapp;
      whatsappCta.href = whatsappLink;
      whatsappTopCta.href = whatsappLink;

      // 4. Motivos para Visitar (Carrossel Principal)
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

      const motivosCarouselId = 'motivosCarousel';
      const motivosWrapperId = 'motivosWrapper';

      if (finalMotivos.length > 0) {
        const contextCard = buildContextCardMotivos(motivosCarouselId, finalTitle);
        const motivoSlides = finalMotivos.map(renderMotivo).join('');
        
        motivosContainer.innerHTML = contextCard + motivoSlides;
        motivosContainer.classList.add('cl-track');
        motivosContainer.id = motivosCarouselId;
        
        document.querySelector('.motivos-wrapper').id = motivosWrapperId;
        
        initCarousel(motivosCarouselId, motivosWrapperId);
        
        // Renderiza as setas de navegação (apenas o HTML)
        document.getElementById(motivosWrapperId).insertAdjacentHTML('beforeend', `
              <button class="carousel-nav prev" id="prev-motivosCarousel">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
              </button>
              <button class="carousel-nav next" id="next-motivosCarousel">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
              </button>
          `);
        
      } else {
        document.querySelector('.motivos-section h2').hidden = true;
        document.querySelector('.motivos-wrapper').hidden = true;
      }

      // 5. Renderiza Eventos Similares
      if (ev.category_macro) {
          renderRelatedEvents(ev.category_macro, slug);
      } else {
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
