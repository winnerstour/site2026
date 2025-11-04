// evento-page-loader.js (FINAL - Corrigido para Exibir Banner/Placeholder)

(function () {
  const DATA_BASE_PATH = './data/events/'; 
  const ALL_EVENTS_URL = './event.json'; 
  
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
  const SCROLL_SPEED = 8000; // 8 segundos para autoplay

  // ... (elementos e funções auxiliares permanecem iguais) ...
  
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

  function fixPath(path) {
      if (path && path.startsWith('/assets')) {
          return BASE_PATH + path;
      }
      return path;
  }
  
  // ... (renderMotivo, buildSimilarEventCard, initCarousel, renderRelatedEvents, extractVideoId, etc. são omitidos para brevidade) ...

  async function loadEventData() {
    const slug = getSlug();
    if (!slug) {
      return renderError('Nenhum evento especificado na URL.');
    }
    
    try {
      // ... (lógica de carregamento de JSON) ...
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
      
      // Corrigindo o caminho do favicon para usar o fixPath
      const faviconRawPath = ev.favicon_image_path || `/assets/img/banners/${slug}-favicon.webp`;
      const faviconEl = document.querySelector('link[rel="icon"]'); 
      if (faviconEl) {
          faviconEl.href = fixPath(faviconRawPath);
      }
      
      eventTitle.textContent = finalTitle;
      
      // Lógica para carregar o vídeo do YouTube (<iframe>) ou o Banner (<img>)
      const rawVideoInput = ev.YouTubeVideo; 
      const youtubeVideoId = extractVideoId(rawVideoInput);

      if (youtubeVideoId) {
          // SE HOUVER VÍDEO: (Lógica anterior permanece)
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

          const rawHeroPath = ev.banner_path || ev.hero_image_path || ev.image || 'placeholder.webp';
          // **AJUSTE CRÍTICO AQUI**: Garante que o caminho base (fixPath) seja aplicado ao banner.
          const heroPath = fixPath(rawHeroPath);
          
          eventHero.src = heroPath;
          eventHero.alt = `Banner do evento ${finalTitle}`;
          eventHero.style.display = 'block';
      }
      
      // ... (Restante da lógica do loadEventData permanece inalterada) ...

    } catch (e) {
      // ... (renderError) ...
    }
  }

  // ... (funções auxiliares e loadEventData completo) ...

  document.addEventListener('DOMContentLoaded', loadEventData);
})();
