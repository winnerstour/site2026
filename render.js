// render.js (Adaptado para Layout Grid/Sidebar com Filtro, Ordenação CORRIGIDA e Chip de Data/Cor)

(function () {
    const mainContent = document.getElementById('main-content');
    const categoryTabsContainer = document.getElementById('category-tabs');
    const eventsGrid = document.getElementById('events-grid');
    
    // DATA_URL: Usamos o arquivo principal 'events.json' como índice e fonte de dados completa para a INDEX.
    const DATA_URL = './events.json'; 
    const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
    let allEventsData = []; // Armazena todos os eventos carregados

    // Mapeamento de meses para abreviação em Português
    const MONTH_ABBREVIATIONS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Função que corrige o caminho absoluto para GitHub/Netlify
    function fixPath(path) {
        if (path && path.startsWith('/assets')) {
            return BASE_PATH + path;
        }
        return path;
    }

    /**
     * Formata a exibição da data do evento do evento de acordo com a regra:
     * - Mesmo mês: "29 A 30 DE NOV"
     * - Meses diferentes: "29/11 - 2/12"
     * @param {string} startDate - Data de início (ISO string: YYYY-MM-DD).
     * @param {string} endDate - Data de fim (ISO string: YYYY-MM-DD).
     * @returns {string} String formatada para o chip de data, em caixa alta.
     */
    function formatEventDateRange(startDate, endDate) {
        if (!startDate || !endDate) return '';

        // Corrigido para garantir que as datas sejam tratadas como UTC para evitar problemas de fuso horário
        const d1 = new Date(startDate.replace(/-/g, '/') + 'T00:00:00'); 
        const d2 = new Date(endDate.replace(/-/g, '/') + 'T00:00:00'); 

        const day1 = d1.getDate();
        const day2 = d2.getDate();
        const month1 = d1.getMonth();
        const month2 = d2.getMonth();
        const year1 = d1.getFullYear();
        const year2 = d2.getFullYear();

        let dateString;
        
        // 1. Evento em dias no mesmo mês/ano
        if (month1 === month2 && year1 === year2) {
            const monthAbbrev = MONTH_ABBREVIATIONS[month1];
            dateString = `${day1} a ${day2} de ${monthAbbrev}`;
        } else {
            // 2. Evento com quebra de mês ou ano (Formato reduzido: DD/MM - DD/MM)
            const month1Str = String(month1 + 1).padStart(2, '0');
            const month2Str = String(month2 + 1).padStart(2, '0');
            dateString = `${day1}/${month1Str} - ${day2}/${month2Str}`;
        }
        
        return dateString.toUpperCase();
    }

    /**
     * Constrói o HTML para o card de evento no Grid.
     * @param {object} ev - Dados do evento.
     * @returns {string} HTML do card.
     */
    function buildEventCard(ev) {
        // 1. TÍTULO EM CAIXA ALTA
        const title = (ev.title || 'Evento sem título').toUpperCase();
        const subtitle = ev.subtitle || 'Detalhes do evento...';
        const slug = ev.slug; 
        const finalUrl = `evento.html?slug=${slug}`;
        
        // 2. IMAGEM: Prioriza hero_image_path (hero.webp)
        const rawImagePath = ev.hero_image_path || ev.banner_path || '/assets/img/banners/placeholder.webp';
        const imagePath = fixPath(rawImagePath);

        // 3. CHIP DE CATEGORIA: Usa category_micro com COR CORRIGIDA
        const categoryText = (ev.category_micro || ev.category_macro || 'EVENTOS').toUpperCase();
        const chipColor = ev.chip_color || 'bg-gray-700 text-white';
        // Extrai a cor HEX/Class do JSON. O formato é 'bg-cor-NUM text-cor-NUM'
        const colorClass = chipColor.split(' ')[0]; // Ex: bg-rose-600
        const textColor = chipColor.split(' ')[1] || 'white'; // Ex: text-white
        
        // Aplica o estilo in-line para que o CSS do index.html não quebre a cor
        const categoryChipStyle = `style="background-color: var(--${colorClass.replace('bg-', 'color-')}, #333); color: ${textColor.includes('text-') ? '#fff' : textColor};"`;


        // 4. CHIP DE DATA: Usa a função de formatação
        const dateRangeText = formatEventDateRange(ev.start_date, ev.end_date);
        const dateChipHTML = dateRangeText ? `<span class="card-chip date-chip" style="background: var(--brand-shadow); color: #fff;">${dateRangeText}</span>` : '';
        
        const categoryChipHTML = `<span class="card-chip category-chip" ${categoryChipStyle}>${categoryText}</span>`;


        return `
          <a href="${finalUrl}" class="event-card" aria-label="${title}" data-category="${ev.category_macro}">
            <div class="card-media">
              <img loading="lazy" src="${imagePath}" alt="${title}">
            </div>
            <div class="card-content">
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${dateChipHTML}
                    ${categoryChipHTML}
                </div>
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

    /**
     * Renderiza os cards de eventos no Grid, aplicando filtro e ordenação CORRIGIDA.
     * @param {string} categoryFilter - Categoria macro para filtrar.
     */
    function renderEventsGrid(categoryFilter) {
        eventsGrid.innerHTML = ''; // Limpa o grid
        let eventsToDisplay = allEventsData;

        if (categoryFilter !== 'Todos') {
            eventsToDisplay = allEventsData.filter(event => event.category_macro === categoryFilter);
        }
        
        // ORDENAÇÃO CORRIGIDA: Crescente por data (evento mais próximo primeiro).
        eventsToDisplay.sort((a, b) => {
            // Usa .replace(/-/g, '/') para garantir que o Date() interprete corretamente no Chrome/Safari
            const dateA = a.start_date ? new Date(a.start_date.replace(/-/g, '/') + 'T00:00:00').getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date.replace(/-/g, '/') + 'T00:00:00').getTime() : 0;
            
            // Ordem crescente (mais antigo primeiro: A - B). Se A for menor que B, A vem antes.
            return dateA - dateB;
        });


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
