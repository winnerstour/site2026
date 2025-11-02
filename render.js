// render.js (Versão Final: Correção Universal de Caminho)

(function () {
  const container = document.getElementById('carouselsContainer');
  
  const DATA_URL = './event.json'; 

  // NOVO: Detecta o caminho base automaticamente (ex: /site2026 ou /)
  // Isso resolve problemas com GitHub Pages e mantém compatibilidade com Netlify/Root Host
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';

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
  
  // Função que corrige o caminho absoluto
  function fixPath(path) {
      if (path.startsWith('/assets')) {
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

    // APLICAÇÃO DA CORREÇÃO:
    const imagePath = fixPath(rawImagePath);
    
    return `
      <div class="cl-slide">
        <a href="${finalUrl}" class="card" aria-label="${title}">
          <div class="thumb">
            <img loading="lazy" src="${imagePath}" alt="${title}">
          </div>
          <div class="content">
            <h3 class="title">${title}</h3>
            <p class="desc">${subtitle}</p>
          </div>
        </a>
      </div>
    `;
  }

  async function renderCarousels() {
    try {
      // ... (Resto da função de carregamento permanece o mesmo) ...
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
        const filteredEvents = allEvents.filter(ev => ev.category_macro === category);
        
        if (filteredEvents.length === 0) return; 

        const carouselSlides = filteredEvents.map(buildCard).join('');
        
        const carouselSection = `
          <section class="cat-section">
            <h2 class="cat-title" style="padding: 0 16px;">${category}</h2>
            <div class="cl-track" id="carousel-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" role="region" aria-label="Eventos na categoria ${category}">
              ${carouselSlides}
            </div>
          </section>
        `;
        
        finalHTML += carouselSection;
      });

      if (document.querySelector('.wrap')) {
         document.querySelector('.wrap').style.padding = '0';
      }
      
      container.innerHTML = finalHTML;
      
    } catch (error) {
      console.error('Erro ao renderizar carrosséis:', error);
      container.innerHTML = `<p class="wrap" style="color: red;">Erro ao carregar os dados dos eventos: ${error.message}</p>`;
    }
  }

  document.addEventListener('DOMContentLoaded', renderCarousels);
})();
