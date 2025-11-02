// evento-page-loader.js (Final com Card Tutorial Discreto nos Motivos)

(function () {
  const DATA_BASE_PATH = './data/events/'; 
  // DETECÇÃO DE PATH UNIVERSAL
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
      const description = `Navegue pelo carrossel para ver todos os diferenciais da sua missão corporativa nesta categoria.`;

      return `
          <div class="cl-slide context-slide">
              <div class="card motivo-item context-card">
                  <div class="context-content">
                      <p class="motivo-text-body" style="font-size: 1rem; color: var(--text-charcoal); margin-bottom: 20px;">
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

  // Card de MOTIVO (agora dentro do cl-slide)
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

  // Lógica de inicialização do carrossel (para a página de evento)
  function initMotivosCarousel(containerId, eventName) {
      const carousel = document.getElementById(containerId);
      if (!carousel) return;

      let scrollInterval;
      let isPaused = false;
      const SCROLL_SPEED = 4000; 

      const cardWidth = 318; 

      const scrollRight = () => {
          if (isPaused) return;

          const currentScroll = carousel.scrollLeft;
          const maxScroll = carousel.scrollWidth - carousel.clientWidth;

          if (currentScroll >= maxScroll - 10) {
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
      
      const wrapper = document.querySelector('.motivos-wrapper');
      if (wrapper) {
           wrapper.insertAdjacentHTML('beforeend', `
              <button class="carousel-nav prev" onclick="document.getElementById('${containerId}').scrollBy({left: -${cardWidth}, behavior: 'smooth'})">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
              </button>
              <button class="carousel-nav next" onclick="document.getElementById('${containerId}').scrollBy({left: ${cardWidth}, behavior: 'smooth'})">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
              </button>
          `);
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
      
      // CORREÇÃO: PRIORIDADE PARA BANNER_PATH
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

      // 4. Motivos para Visitar (Carrossel)
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

      if (finalMotivos.length > 0) {
        // 🎯 PASSO 1: CRIA O CARD DE CONTEXTO
        const contextCard = buildContextCardMotivos('motivosCarousel', finalTitle);

        // 🎯 PASSO 2: CRIA OS CARDS DE MOTIVO E CONCATENA
        const motivoSlides = finalMotivos.map(renderMotivo).join('');
        
        motivosContainer.innerHTML = contextCard + motivoSlides;
        
        // Adiciona classe para Carrossel e ID
        motivosContainer.classList.add('cl-track');
        motivosContainer.classList.add('motivos-carousel-container');
        motivosContainer.id = 'motivosCarousel';
        
        // 🎯 INICIA O CARROSSEL (Rolagem automática e setas)
        initMotivosCarousel('motivosCarousel', finalTitle);
        
      } else {
        const motivosSectionTitle = document.querySelector('.motivos-section h2');
        if (motivosSectionTitle) motivosSectionTitle.hidden = true;
        motivosContainer.hidden = true;
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
