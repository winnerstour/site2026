// render.js (Versão Final com Autoplay, Setas e Card de Contexto no 1º Carrossel)

(function () {
  const container = document.getElementById('carouselsContainer');
  
  const DATA_URL = './event.json'; 

  // DETECÇÃO DE PATH UNIVERSAL
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
  const SCROLL_SPEED = 4000; // 4 segundos para rolagem automática

  const CATEGORIES_TO_DISPLAY = [
    "Saúde & Medicina & Farma",
    "Automotivo & Autopeças & Motos",
    "Construção & Arquitetura",
    "Tecnologia & Telecom",
    "Foodservice & Bebidas",
    "Entretenimento & Cultura",
    "Logística & Supply Chain",
    "Outros/Nichados"
  ];
  
  // Função que corrige o caminho absoluto para GitHub/Netlify
  function fixPath(path) {
      if (path && path.startsWith('/assets')) {
          return BASE_PATH + path;
      }
      return path;
  }
  
  // Função para criar o CARD TUTORIAL/CONTEXTO para a index.html
  function buildContextCard(categoryId, categoryName) {
      const description = `Navegue pelo carrossel para ver todas as feiras e encontros desta categoria.`;

      return `
          <div class="cl-slide context-slide">
              <div class="card context-card">
                  <div class="context-content">
                      <p class="subtitle" style="font-size: 14px !important; color: var(--muted) !important; margin-bottom: 20px;">
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

  function buildEventCard(ev) {
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

  // Lógica de inicialização do carrossel com autoplay e setas
  function initCarousel(carouselId) {
      const carousel = document.getElementById(carouselId);
      if (!carousel) return;

      let scrollInterval;
      let isPaused = false;
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
      
      // Pausa e retoma a rolagem automática (melhora a usabilidade)
      carousel.addEventListener('mouseover', () => clearInterval(scrollInterval));
      carousel.addEventListener('mouseleave', startAutoplay);
      
      const prevButton = document.getElementById(`prev-${carouselId}`);
      const nextButton = document.getElementById(`next-${carouselId}`);

      if (prevButton && nextButton) {
          // Oculta/mostra setas ao carregar/redimensionar
          const checkScroll = () => {
              const currentScroll = carousel.scrollLeft;
              const maxScroll = carousel.scrollWidth - carousel.clientWidth;

              if (window.innerWidth > 1024) {
                  // Trava no início/fim para visualização desktop
                  prevButton.style.display = currentScroll > 10 ? 'block' : 'none';
                  nextButton.style.display = currentScroll < maxScroll - 10 ? 'block' : 'none';
              }
          };
          
          prevButton.addEventListener('click', () => {
              carousel.scrollBy({left: -cardWidth, behavior: 'smooth'});
              checkScroll();
          });
          nextButton.addEventListener('click', () => {
              carousel.scrollBy({left: cardWidth, behavior: 'smooth'});
              checkScroll();
          });
          
          carousel.addEventListener('scroll', checkScroll);
          window.addEventListener('resize', checkScroll);
          checkScroll(); 
      }
      
      startAutoplay();
  }


  async function renderCarousels() {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) {
          throw new Error(`Falha ao carregar ${DATA_URL}. Status: ${res.statusText}`);
      }
      
      const allEvents = await res.json(); 
      
      if (!Array.isArray(allEvents) || allEvents.length === 0) {
        container.innerHTML = '<p class="wrap">Nenhum evento encontrado.</p>';
        return;
      }
      
      let finalHTML = '';

      // NOVO: Adicionamos o índice para injetar o Card de Contexto APENAS no primeiro carrossel (index 0)
      CATEGORIES_TO_DISPLAY.forEach((category, index) => {
        const categoryId = `carousel-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const filteredEvents = allEvents.filter(ev => ev.category_macro === category);
        
        if (filteredEvents.length === 0) return; 

        // 🎯 LÓGICA DE INJEÇÃO INTELIGENTE: SÓ INJETA SE FOR O PRIMEIRO CARROSSEL (index === 0)
        const contextCard = index === 0 ? buildContextCard(categoryId, category) : '';
        
        const eventSlides = filteredEvents.map(buildEventCard).join('');
        
        const carouselSlides = contextCard + eventSlides; // Concatena o card de contexto (se existir) com os eventos
        
        const carouselSection = `
          <section class="cat-section">
            <h2 class="cat-title">${category}</h2>
            <div class="carousel-wrapper-container">
                <div class="cl-track" id="${categoryId}" role="region" aria-label="Eventos na categoria ${category}">
                    ${carouselSlides}
                </div>
                
                <button class="carousel-nav prev" id="prev-${categoryId}">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
                </button>
                <button class="carousel-nav next" id="next-${categoryId}">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
                </button>
            </div>
          </section>
        `;
        
        finalHTML += carouselSection;
      });

      container.innerHTML = finalHTML;
      
      // INICIALIZA A LÓGICA DE CARROSSEL PARA CADA CATEGORIA
      CATEGORIES_TO_DISPLAY.forEach(category => {
          const categoryId = `carousel-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          initCarousel(categoryId);
      });
      
    } catch (error) {
      console.error('Erro ao renderizar carrosséis:', error);
      container.innerHTML = `<p class="wrap" style="color: red;">Erro ao carregar os dados dos eventos: ${error.message}</p>`;
    }
  }

  document.addEventListener('DOMContentLoaded', renderCarousels);
})();
