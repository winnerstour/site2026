// evento-page-loader.js (Versão Final: Correção de Path e Fonte Montserrat)

(function () {
  const DATA_BASE_PATH = './data/events/'; 

  // DETECÇÃO DE PATH UNIVERSAL: Usa '/site2026' se estiver no GitHub Pages, ou '' para Netlify/Root
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';

  const eventContent = document.getElementById('eventContent');
  const loading = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  
  // Elementos do DOM a preencher
  const pageTitle = document.getElementById('pageTitle');
  const eventTitle = document.getElementById('eventTitle');
  const eventHero = document.getElementById('eventHero');
  const eventMeta = document.getElementById('eventMeta');
  const eventDescription = document.getElementById('eventDescription');
  const motivosContainer = document.getElementById('motivosContainer');
  const whatsappCta = document.getElementById('whatsappCta');
  const whatsappTopCta = document.getElementById('whatsappTopCta');
  
  // 🎯 INCLUINDO MONTSERRAT NA PÁGINA DE EVENTO (Para garantir que funcione)
  function injectMontserrat() {
    if (document.querySelector('link[href*="Montserrat"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap';
    document.head.appendChild(link);
    // Aplicar Montserrat no body/títulos da página de evento se necessário
    document.body.style.fontFamily = "'Montserrat', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
  }
  injectMontserrat();

  // Função que corrige o caminho absoluto para GitHub/Netlify
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
    errorDiv.innerHTML = '<h2 style="color:var(--brand)">Erro</h2><p>' + (message || 'Não foi possível carregar os detalhes do evento. Verifique a URL e o arquivo JSON.') + '</p>';
  }

  function renderMotivo(m) {
    const emoji = m.motivo_emoji || m.emoji || '✨';
    const title = m.motivo_titulo || m.title || 'Atração';
    const text = m.motivo_conteudo || m.text || '';
    
    return `
      <li class="motivo-item">
        <strong style="display:flex; align-items:center;">
          <span class="emoji" aria-hidden="true">${emoji}</span>
          ${title}
        </strong>
        <p>${text}</p>
      </li>
    `;
  }

  async function loadEventData() {
    const slug = getSlug();
    if (!slug) {
      return renderError('Nenhum evento especificado na URL.');
    }
    
    try {
      // Busca o arquivo "pesado" (completo) na pasta /data/events/
      const jsonPath = `${DATA_BASE_PATH}${slug}.json`;
      const res = await fetch(jsonPath);

      if (!res.ok) {
        // Tenta buscar no diretório raiz se o slug não funcionar
        const rootRes = await fetch(`./${slug}.json`);
        if (!rootRes.ok) {
             throw new Error(`Arquivo ${slug}.json não encontrado ou erro de rede.`);
        }
        ev = await rootRes.json();
      } else {
        var ev = await res.json();
      }
      
      // 1. Preencher SEO e Título
      const finalTitle = ev.title || 'Evento sem Título';
      pageTitle.textContent = `${finalTitle} — WinnersTour`;
      
      // Tenta usar o favicon na página de detalhes também
      const faviconRawPath = ev.favicon_image_path || `/assets/img/banners/${slug}-favicon.webp`;
      const faviconEl = document.querySelector('link[rel="icon"]'); // Tenta achar o favicon padrão
      if (faviconEl) {
          faviconEl.href = fixPath(faviconRawPath);
      }
      
      // 2. Preencher Conteúdo Principal
      eventTitle.textContent = finalTitle;
      
      // CORREÇÃO: Aplica fixPath() no caminho da imagem Hero
      const rawHeroPath = ev.hero_image_path || ev.banner_path || ev.image || 'placeholder.webp';
      const heroPath = fixPath(rawHeroPath);
      
      eventHero.src = heroPath;
      eventHero.alt = `Imagem principal do evento ${finalTitle}`;
      
      // Metadados (Cidade, Data, Categoria)
      const metaHtml = [ev.city_state, ev.start_date, ev.category_macro]
          .filter(Boolean)
          .join(' | ');
      eventMeta.textContent = metaHtml;
      
      // Descrição inicial
      eventDescription.innerHTML = ev.initial_description ? `<p>${ev.initial_description}</p>` : `<p>${ev.subtitle || 'Descrição não disponível.'}</p>`;
      
      // 3. CTA (WhatsApp)
      const defaultWhatsapp = "https://wa.me/5541999450111?text=Ol%C3%A1!%20Tenho%20interesse%20no%20evento%20" + encodeURIComponent(finalTitle);
      const whatsappLink = ev.whatsapp_url || defaultWhatsapp;
      
      whatsappCta.href = whatsappLink;
      whatsappTopCta.href = whatsappLink;

      // 4. Motivos para Visitar
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
        motivosContainer.innerHTML = finalMotivos.map(renderMotivo).join('');
      } else {
        const motivosSectionTitle = document.querySelector('h2[style*="margin-top"]');
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
