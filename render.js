// render.js (FINAL - Corrigido bug do Chip de Data e Altura da Imagem)

(function () {
    const mainContent = document.getElementById('main-content');
    const categoryTabsContainer = document.getElementById('category-tabs');
    const eventsGrid = document.getElementById('events-grid');
    
    // DATA_URL: Usamos o arquivo principal 'events.json' como índice e fonte de dados completa para a INDEX.
    const DATA_URL = './events.json'; 
    const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
    let allEventsData = []; // Armazena todos os eventos carregados

    // Nomes longos serão abreviados (JAN, FEV, MAR, AGO, SET, OUT, NOV, DEZ)
    const MONTH_ABBREVIATIONS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const MONTH_FULL_NAMES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO']; 


    // --- MAPA DE CONSOLIDAÇÃO DE CATEGORIAS ---
    function mapToSimplifiedCategory(macroCategory) {
        switch (macroCategory) {
            case 'Automotivo & Autopeças & Motos':
                return 'AUTOMOTIVO';
            case 'Beleza & Estética':
                return 'ESTÉTICA';
            case 'Construção & Arquitetura':
                return 'CONSTRUÇÃO';
            case 'Entretenimento & Cultura':
                return 'CULTURA';
            case 'Outros/Nichados':
                return 'NICHADOS';
            case 'Saúde & Medicina & Farma':
            case 'Pets & Veterinária':
                return 'MEDICINA';
            case 'Tecnologia & Telecom':
            case 'Logística & Supply Chain':
                return 'TEC';
            // Todas as demais categorias (Foodservice, Agro, Franquias, Turismo, etc.)
            default:
                return 'OUTROS';
        }
    }
    // --- FIM DO MAPA DE CONSOLIDAÇÃO ---

    // Função que corrige o caminho absoluto para GitHub/Netlify
    function fixPath(path) {
        if (path && path.startsWith('/assets')) {
            return BASE_PATH + path;
        }
        return path;
    }

    /**
     * Formata a exibição da data do evento, implementando a lógica de abreviação/nome completo.
     * @param {string} startDate - Data de início (ISO string: YYYY-MM-DD).
     * @param {string} endDate - Data de fim (ISO string: YYYY-MM-DD).
     * @returns {string} String formatada para o chip de data, em caixa alta.
     */
    function formatEventDateRange(startDate, endDate) {
        if (!startDate || !endDate) return '';

        // Usamos T12:00:00Z para garantir que a data seja interpretada consistentemente (UTC).
        const d1 = new Date(startDate.replace(/-/g, '/') + 'T12:00:00Z'); 
        const d2 = new Date(endDate.replace(/-/g, '/') + 'T12:00:00Z'); 

        // Se a data for inválida (FALLBACK SIMPLES)
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
             const [y1, m1, d1_day] = startDate.split('-');
             const [y2, m2, d2_day] = endDate.split('-');
             return `${d1_day}/${m1} - ${d2_day}/${m2}`.toUpperCase();
        }
        
        const day1 = d1.getUTCDate();
        const day2 = d2.getUTCDate();
        const month1 = d1.getUTCMonth();
        const month2 = d2.getUTCMonth();
        const year1 = d1.getUTCFullYear();
        const year2 = d2.getUTCFullYear();

        let dateString;
        
        // Função auxiliar para obter a abreviação/nome (Máximo 3 letras para meses longos)
        const getMonthName = (monthIndex) => {
            const fullName = MONTH_FULL_NAMES[monthIndex];
            // Junho, Julho, Agosto, Setembro, Outubro, Novembro, Dezembro, Janeiro, Fevereiro, Março
            if (fullName.length > 4) {
                 return MONTH_ABBREVIATIONS[monthIndex]; // Usa a abreviação de 3 letras
            }
            return MONTH_ABBREVIATIONS[monthIndex]; // Usa abreviação de 3 letras para ABR, MAI
        };
        
        // 1. Evento NO MESMO MÊS/ANO: "11 A 14 AGO"
        if (month1 === month2 && year1 === year2) {
            const monthAbbrev = getMonthName(month1);
            // Retorna o formato: DD A DD MÊS
            dateString = `${day1} A ${day2} ${monthAbbrev}`;
        } else {
            // 2. Evento COM QUEBRA DE MÊS/ANO: "DD/MM - DD/MM"
            const month1Str = String(month1 + 1).padStart(2, '0');
            const month2Str = String(month2 + 1).padStart(2, '0');
            const day1Str = String(day1).padStart(2, '0');
            const day2Str = String(day2).padStart(2, '0');

            dateString = `${day1Str}/${month1Str} - ${day2Str}/${month2Str}`;
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
        
        // Mapeamento para variáveis CSS injetadas no index.html
        const colorClass = chipColor.split(' ')[0]; // Ex: bg-rose-600
        const textColor = chipColor.split(' ')[1] || 'white'; // Ex: text-white
        
        // Aplica o estilo in-line para que o CSS do index.html não quebre a cor
        const categoryChipStyle = `style="background-color: var(--${colorClass.replace('bg-', 'color-')}, #333); color: ${textColor.includes('text-') ? '#fff' : textColor};"`;


        // 4. CHIP DE DATA: Usa a função de formatação (CORRIGIDA)
        const dateRangeText = formatEventDateRange(ev.start_date, ev.end_date);
        // O estilo do chip de data é herdado do CSS (.card-chip.date-chip)
        const dateChipHTML = dateRangeText ? `<span class="card-chip date-chip">${dateRangeText}</span>` : '';
        
        const categoryChipHTML = `<span class="card-chip category-chip" ${categoryChipStyle}>${categoryText}</span>`;

        // 5. Mapeia a categoria macro para a categoria simplificada para o filtro
        const simplifiedCategory = mapToSimplifiedCategory(ev.category_macro);


        return `
          <a href="${finalUrl}" class="event-card" aria-label="${title}" data-category="${simplifiedCategory}">
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
    
    /**
     * Obtém as categorias únicas simplificadas a serem exibidas nas abas.
     */
    function getUniqueCategories(events) {
        const categories = new Set();
        events.forEach(event => {
            if (event.category_macro) {
                categories.add(mapToSimplifiedCategory(event.category_macro));
            }
        });
        
        // Define a ordem das abas conforme solicitado
        const finalOrder = ['TODOS', 'AUTOMOTIVO', 'ESTÉTICA', 'CONSTRUÇÃO', 'CULTURA', 'NICHADOS', 'MEDICINA', 'TEC', 'OUTROS'];
        
        // Filtra a lista final para incluir apenas as categorias mapeadas que realmente existem
        const uniqueAndOrderedCategories = finalOrder.filter(cat => cat === 'TODOS' || categories.has(cat));

        return uniqueAndOrderedCategories;
    }

    /**
     * Renderiza os cards de eventos no Grid, aplicando filtro e ordenação CORRIGIDA.
     * @param {string} categoryFilter - Categoria simplificada para filtrar (ex: 'CONSTRUÇÃO').
     */
    function renderEventsGrid(categoryFilter) {
        eventsGrid.innerHTML = ''; // Limpa o grid
        let eventsToDisplay = allEventsData;

        // Filtra usando a categoria simplificada (o card armazena 'data-category' com a versão simplificada)
        if (categoryFilter !== 'TODOS') {
            eventsToDisplay = allEventsData.filter(event => mapToSimplifiedCategory(event.category_macro) === categoryFilter);
        }
        
        // ORDENAÇÃO: Crescente por data (evento mais próximo primeiro).
        eventsToDisplay.sort((a, b) => {
            // Usa T12:00:00Z para mitigar erros de fuso horário na ordenação.
            const dateA = a.start_date ? new Date(a.start_date.replace(/-/g, '/') + 'T12:00:00Z').getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date.replace(/-/g, '/') + 'T12:00:00Z').getTime() : 0;
            
            // Ordem crescente (mais próximo primeiro: A - B)
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
            // O texto do link é a categoria simplificada (ex: AUTOMOTIVO)
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
