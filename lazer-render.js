// lazer-render.js
// Script para carregar e renderizar o diretório de ofertas de lazer
// consumindo exatamente o formato de lazer/index.json (slug completo).

(function () {
  const categoryTabsContainer = document.getElementById('category-tabs');
  const eventsGrid = document.getElementById('events-grid');

  // Detecta se o site está sob /site2026 e ajusta o caminho do JSON
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
  const DATA_URL = BASE_PATH + '/lazer/index.json';

  let allOffers = []; // guarda todas as ofertas carregadas
  let currentCategory = 'TODOS';

  /**
   * Cria a lista de categorias a partir do campo category_macro,
   * preservando a ordem de primeira aparição no JSON.
   * Sempre inclui "TODOS" como primeira aba.
   */
  function getCategories(data) {
    const macros = [];
    data.forEach((item) => {
      const macro = item.category_macro || 'Outros';
      if (!macros.includes(macro)) {
        macros.push(macro);
      }
    });

    return ['TODOS', ...macros];
  }

  /**
   * Renderiza as abas de categoria (tabs).
   */
  function renderCategories(categories) {
    if (!categoryTabsContainer) return;

    categoryTabsContainer.innerHTML = '';

    categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'tab-link' + (cat === currentCategory ? ' active' : '');
      btn.textContent = cat;
      btn.setAttribute('data-category', cat);

      btn.addEventListener('click', () => {
        currentCategory = cat;
        // Atualiza estado visual das abas
        const allTabs = categoryTabsContainer.querySelectorAll('.tab-link');
        allTabs.forEach((t) => t.classList.remove('active'));
        btn.classList.add('active');

        renderOffers();
      });

      categoryTabsContainer.appendChild(btn);
    });
  }

  /**
   * Constrói o HTML de um card de oferta de lazer.
   * Usa apenas os campos definidos no index.json:
   * slug, title, subtitle, category_macro, category_micro, card_image, href.
   */
  function buildOfferCard(offer) {
    const link = document.createElement('a');
    link.className = 'event-card';
    link.href = offer.href || '#';
    link.setAttribute('aria-label', offer.title || 'Oferta de lazer');

    // Área da imagem
    const media = document.createElement('div');
    media.className = 'card-media';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = offer.card_image || '';
    img.alt = offer.title || '';
    img.style.objectFit = 'cover';

    media.appendChild(img);

    // Conteúdo textual
    const content = document.createElement('div');
    content.className = 'card-content';

    const titleEl = document.createElement('p');
    titleEl.className = 'card-title';
    titleEl.textContent = offer.title || '';

    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'card-subtitle';
    subtitleEl.textContent = offer.subtitle || '';

    content.appendChild(titleEl);
    content.appendChild(subtitleEl);

    link.appendChild(media);
    link.appendChild(content);

    return link;
  }

  /**
   * Renderiza os cards de ofertas no grid, aplicando o filtro de categoria.
   * - Não altera a ordem original do JSON.
   */
  function renderOffers() {
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';

    let filtered = allOffers;

    if (currentCategory && currentCategory !== 'TODOS') {
      filtered = allOffers.filter((item) => (item.category_macro || 'Outros') === currentCategory);
    }

    if (!filtered.length) {
      const msg = document.createElement('p');
      msg.textContent = 'Nenhuma oferta encontrada para este filtro.';
      msg.style.gridColumn = '1 / -1';
      eventsGrid.appendChild(msg);
      return;
    }

    // Mantém a ordem EXATA do index.json (nenhum sort aqui)
    filtered.forEach((offer) => {
      const card = buildOfferCard(offer);
      eventsGrid.appendChild(card);
    });
  }

  /**
   * Carrega o index.json de lazer e inicializa a tela.
   */
  async function loadDataAndRender() {
    if (!eventsGrid) return;

    // Estado inicial de "Carregando..."
    eventsGrid.innerHTML = `
      <div class="event-card">
        <div class="card-media"></div>
        <div class="card-content">
          <p class="card-title">Carregando ofertas de lazer...</p>
          <p class="card-subtitle">Por favor, aguarde alguns instantes.</p>
        </div>
      </div>
    `;

    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Não foi possível carregar o arquivo lazer/index.json');
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('O formato de lazer/index.json não é um array.');
      }

      // Aqui assumimos exatamente o formato:
      // slug, title, subtitle, category_macro, category_micro, card_image, href
      allOffers = data;

      const categories = getCategories(allOffers);
      renderCategories(categories);
      renderOffers();
    } catch (err) {
      console.error('Erro ao carregar dados de lazer:', err);
      eventsGrid.innerHTML = `
        <p style="grid-column: 1 / -1;">
          Erro ao carregar as ofertas de lazer: ${err.message}
        </p>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', loadDataAndRender);
})();
