// evento-page-loader.js

(function () {
  // Caminho onde você colocará seus 158 JSONs (slug.json)
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

  // Função para montar o HTML de um item de 'Motivo'
  function renderMotivo(m) {
    // Tenta extrair dados do JSON: usa motivo_titulo_1/motivo_conteudo_1 OU um array 'motivos'
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

  // Função principal para carregar e preencher a página
  async function loadEventData() {
    const slug = getSlug();
    if (!slug) {
      return renderError('Nenhum evento especificado na URL.');
    }
    
    try {
      // Tenta buscar o arquivo JSON com o nome do slug
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
      
      const heroPath = ev.hero_image_path || ev.banner_path || 'placeholder.webp'; 
    eventHero.src = heroPath;
    eventHero.alt = ev.title;
      
      // Metadados (Cidade, Data, Categoria)
      const metaHtml = [ev.city_state, ev.start_date, ev.category_macro]
          .filter(Boolean)
          .join(' | ');
      eventMeta.textContent = metaHtml;
      
      // Descrição inicial (aceita HTML simples, como <em> ou <strong>)
      eventDescription.innerHTML = ev.initial_description ? `<p>${ev.initial_description}</p>` : `<p>${ev.subtitle || 'Descrição não disponível.'}</p>`;
      
      // 3. CTA (WhatsApp)
      const defaultWhatsapp = "https://wa.me/5541999450111?text=Ol%C3%A1!%20Tenho%20interesse%20no%20evento%20" + encodeURIComponent(finalTitle);
      const whatsappLink = ev.whatsapp_url || defaultWhatsapp;
      
      whatsappCta.href = whatsappLink;
      whatsappTopCta.href = whatsappLink;

      // 4. Motivos para Visitar
      
      // Tenta extrair motivos do formato motivo_titulo_N (o formato do seu JSON)
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
          
      // Concatena com um possível array 'motivos'
      const finalMotivos = extractedMotivos
          .filter(m => m.motivo_titulo) // Garante que o título existe
          .concat(Array.isArray(ev.motivos) ? ev.motivos : []);

      if (finalMotivos.length > 0) {
        motivosContainer.innerHTML = finalMotivos.map(renderMotivo).join('');
      } else {
        // Se não houver motivos, esconde a seção
        document.querySelector('h2').hidden = true; 
        motivosContainer.hidden = true;
      }

      // Exibe o conteúdo e esconde o carregamento
      loading.hidden = true;
      eventContent.hidden = false;

    } catch (e) {
      console.error('Erro ao carregar evento:', e);
      renderError(e.message);
    }
  }

  document.addEventListener('DOMContentLoaded', loadEventData);
})();
