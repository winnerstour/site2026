// render.js (Adaptado para Layout Grid/Sidebar com Filtro de Categoria)

(function () {
    const mainContent = document.getElementById('main-content');
    const categoryTabsContainer = document.getElementById('category-tabs');
    const eventsGrid = document.getElementById('events-grid');
    
    const DATA_URL = './events.json'; 
    const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
    let allEventsData = []; // Armazena todos os eventos carregados

    // Função que corrige o caminho absoluto para GitHub/Netlify
    function fixPath(path) {
        if (path && path.startsWith('/assets')) {
            return BASE_PATH + path;
        }
        return path;
    }

    function buildEventCard(ev) {
        const title = ev.title || 'Evento sem título';
        const subtitle = ev.subtitle || 'Detalhes do evento...';
        const slug = ev.slug; 
        const finalUrl = `evento.html?slug=${slug}`;
        
        const rawImagePath = ev.banner_path || ev.hero_image_path || '/assets/img/banners/placeholder.webp';
        const imagePath = fixPath(rawImagePath);

        const faviconRawPath = ev.favicon_image_path || `/assets/img/banners/${slug}-favicon.webp`;
        const faviconPath = fixPath(faviconRawPath);

        const faviconHtml = `<img class="favicon" src="${faviconPath}" alt="" aria-hidden="true" onerror="this.style.display='none';">`;
        
        // Determina a cor do chip (Usando a lógica de chip_color do JSON, senão usa padrão)
        const chipText = ev.category_macro || 'EVENTOS';
        const chipClass = ev.chip_color ? `style="background: ${ev.chip_color.split(' ')[0]}; color: ${ev.chip_color.split(' ')[1]};"` : '';


        return `
          <a href="${finalUrl}" class="event-card" aria-label="${title}" data-category="${ev.category_macro}">
            <div class="card-media">
              <img loading="lazy" src="${imagePath}" alt="${title}">
            </div>
            <div class="card-content">
                <span class="card-chip" ${chipClass}>${chipText.toUpperCase()}</span>
                <p class="card-title">
                  ${title}
                </p>
                <p class="card-subtitle">${subtitle}</p>
            </div>
          </a>
        `;
    }
    
    function getUniqueCategories(events) {
        const categories = new Set();
        events.forEach(event => {
            if (event.category_macro) {
                categories.add(event.category_macro);
            }
        });
        // Inclui "Todos" e ordena o resto
        const sortedCategories = ['Todos'].concat(Array.from(categories).sort());
        return sortedCategories;
    }

    function renderEventsGrid(categoryFilter) {
        eventsGrid.innerHTML = ''; // Limpa o grid
        let eventsToDisplay = allEventsData;

        if (categoryFilter !== 'Todos') {
            eventsToDisplay = allEventsData.filter(event => event.category_macro === categoryFilter);
        }
        
        // Ordena por data (mais recente primeiro)
        eventsToDisplay.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));


        if (eventsToDisplay.length === 0) {
            eventsGrid.innerHTML = '<p style="grid-column: 1 / -1; color: var(--muted);">Nenhum evento encontrado nesta categoria.</p>';
            return;
        }

        const cardsHTML = eventsToDisplay.map(buildEventCard).join('');
        eventsGrid.innerHTML = cardsHTML;
    }

    function renderCategories(categories) {
        categoryTabsContainer.innerHTML = '';
        categories.forEach((category, index) => {
            const link = document.createElement('a');
            link.href = '#';
            link.classList.add('tab-link');
            link.textContent = category.toUpperCase();
            
            // Define o primeiro como ativo e renderiza o grid inicial
            if (index === 0) {
                link.classList.add('active');
                renderEventsGrid(category);
            }
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove a classe ativa de todos
                document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
                // Adiciona a classe ativa no clicado
                link.classList.add('active');
                // Filtra e renderiza o grid
                renderEventsGrid(category);
                
                // Rola para o topo do conteúdo principal em telas menores, se necessário
                if (window.innerWidth < 1024) {
                    mainContent.scrollIntoView({ behavior: 'smooth' });
                }
            });
            
            categoryTabsContainer.appendChild(link);
        });
    }


    async function loadDataAndRender() {
        try {
            const res = await fetch(DATA_URL);
            if (!res.ok) {
                throw new Error(`Falha ao carregar eventos. Status: ${res.statusText}`);
            }
            
            allEventsData = await res.json(); 
            
            if (!Array.isArray(allEventsData) || allEventsData.length === 0) {
                eventsGrid.innerHTML = '<p style="grid-column: 1 / -1; color: red;">Nenhum evento encontrado.</p>';
                return;
            }
            
            const categories = getUniqueCategories(allEventsData);
            renderCategories(categories);
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            eventsGrid.innerHTML = `<p style="grid-column: 1 / -1; color: red;">Erro ao carregar os dados dos eventos: ${error.message}</p>`;
        }
    }

    document.addEventListener('DOMContentLoaded', loadDataAndRender);
})();
