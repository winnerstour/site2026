// evento-page-loader.js (Versão Final e Corrigida)

(function () {
  // O caminho onde você colocou os JSONs individuais (os 158 arquivos "pesados")
  const DATA_BASE_PATH = './data/events/'; 

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
        throw new Error(`Arquivo ${slug}.json não encontrado ou erro de rede.`);
      }
      
      const ev = await res.json();
      
      // 1. Preencher SEO e Título
      const finalTitle = ev.title || 'Evento sem Título';
      pageTitle.textContent = `${finalTitle} — WinnersTour`;
      
      // 2. Preencher Conteúdo Principal
      eventTitle.textContent = finalTitle;
      
      // Tenta hero_image_path (do JSON individual) ou fallback
      const heroPath = ev.hero_image_path || ev.banner_path || ev.image || 'placeholder.webp';
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
      // Extrai motivos no formato 'motivo_titulo_N' (do seu JSON individual)
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
        document.querySelector('h2[style*="margin-top"]').hidden = true; 
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
