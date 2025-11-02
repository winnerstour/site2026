// render.js (Versão Final com Carrossel e Autoplay)

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

  function buildCard(ev) {
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

  // NOVO: Lógica de inicialização do carrossel com autoplay e setas
  function initCarousel(carouselId) {
      const carousel = document.getElementById(carouselId);
      if (!carousel) return;

      let scrollInterval;
      const cardWidth = 318; // 300px card + 18px gap

      const scrollRight = () => {
          const currentScroll = carousel.scrollLeft;
          const maxScroll = carousel.scrollWidth - carousel.clientWidth;

          // Se estiver no final, volta suavemente para o início
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
      
      // Setas manuais (implementadas via JS para melhor controle)
      const prevButton = document.getElementById(`prev-${carouselId}`);
      const nextButton = document.getElementById(`next-${carouselId}`);

      if (prevButton && nextButton) {
          prevButton.addEventListener('click', () => {
              carousel.scrollBy({left: -cardWidth, behavior: 'smooth'});
          });
          nextButton.addEventListener('click', () => {
              carousel.scrollBy({left: cardWidth, behavior: 'smooth'});
          });
          
          // Lógica para desativar/travar setas no início/fim
          // Isso é difícil com autoplay e scroll-snap, mas podemos ocultar
          const checkScroll = () => {
              const currentScroll = carousel.scrollLeft;
              const maxScroll = carousel.scrollWidth - carousel.clientWidth;

              // Oculta/mostra setas (Desktop view)
              prevButton.style.display = currentScroll === 0 ? 'none' : 'block';
              nextButton.style.display = currentScroll >= maxScroll - 1 ? 'none' : 'block';
          };
          
          // Inicializa e monitora
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

      CATEGORIES_TO_DISPLAY.forEach(category => {
        const categoryId = `carousel-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const filteredEvents = allEvents.filter(ev => ev.category_macro === category);
        
        if (filteredEvents.length === 0) return; 

        const carouselSlides = filteredEvents.map(buildCard).join('');
        
        // NOVO: Adiciona a estrutura do wrapper e os botões
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

      // Renderiza todos os carrosséis
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
