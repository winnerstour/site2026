// render.js

(function () {
  const container = document.getElementById('carouselsContainer');
  
  // URL do arquivo JSON de eventos
  const DATA_URL = './events.json';

  // Array de categorias que você quer exibir na página inicial.
  // A ordem aqui define a ordem dos carrosséis.
  const CATEGORIES_TO_DISPLAY = [
    "Beleza & Estética",
    "Casa & Decoração",
    "Agronegócio & Tecnologia"
    // Adicione mais categorias aqui conforme seu JSON cresce
  ];
  
  // Função para construir o HTML de um único card
  function buildCard(ev) {
    const title = ev.title || 'Evento sem título';
    const subtitle = ev.subtitle || 'Detalhes do evento...';
    
    // O slug é essencial para o link
    const slug = ev.slug; 
    
    // Tenta usar a URL pronta ou constrói o link para o nosso novo arquivo 'evento.html'
    const finalUrl = ev.url || (slug ? `evento.html?slug=${slug}` : '#');
    
    // Priorizo a imagem HERO (path deve ser completo, como no seu JSON de exemplo)
const imagePath = ev.image || ev.hero_image_path || ev.banner_path || 'placeholder.webp';

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

  // Função principal para carregar e renderizar
  async function renderCarousels() {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error('Falha ao carregar events.json');
      
      const allEvents = await res.json(); 
      
      if (!Array.isArray(allEvents) || allEvents.length === 0) {
        container.innerHTML = '<p class="wrap">Nenhum evento encontrado.</p>';
        return;
      }
      
      let finalHTML = '';

      // 1. Iterar sobre as categorias desejadas
      CATEGORIES_TO_DISPLAY.forEach(category => {
        
        // 2. Filtrar eventos por categoria
        const filteredEvents = allEvents.filter(ev => ev.category_macro === category);
        
        if (filteredEvents.length === 0) return; // Não renderiza carrossel vazio

        // 3. Montar o HTML dos slides
        const carouselSlides = filteredEvents.map(buildCard).join('');
        
        // 4. Montar o container do carrossel para a categoria
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

      // 5. Injetar tudo no DOM
      // Remove o padding lateral duplicado do wrap, já que o cat-section e cl-track já aplicam.
      if (document.querySelector('.wrap')) {
         document.querySelector('.wrap').style.padding = '0';
      }
      
      container.innerHTML = finalHTML;
      
    } catch (error) {
      console.error('Erro ao renderizar carrosséis:', error);
      container.innerHTML = '<p class="wrap">Erro ao carregar os dados dos eventos.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', renderCarousels);
})();
