// render.js (FINAL - Corrigida a lógica de abreviação de MÊS)

(function () {
    const mainContent = document.getElementById('main-content');
    const categoryTabsContainer = document.getElementById('category-tabs');
    const eventsGrid = document.getElementById('events-grid');
    
    // DATA_URL: Usamos o arquivo principal 'events.json' como índice e fonte de dados completa para a INDEX.
    const DATA_URL = './events.json'; 
    const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';
    let allEventsData = []; // Armazena todos os eventos carregados

    // Mapeamento de meses para abreviação em Português (Três letras para meses longos, nome completo para curtos)
    const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    // Lista de abreviações (3 letras) para meses com nome longo
    const MONTH_ABBREVIATIONS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    // Função auxiliar para abreviar o nome do mês
    function getAbbreviatedMonth(monthIndex) {
        const name = MONTH_NAMES[monthIndex];
        // Se o nome tiver mais de 4 letras, abrevie
        if (name.length > 4) {
            return MONTH_ABBREVIATIONS[monthIndex];
        }
        return name.toUpperCase();
    }


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
     * Formata a exibição da data do evento do evento de acordo com a regra.
     * @param {string} startDate - Data de início (ISO string: YYYY-MM-DD).
     * @param {string} endDate - Data de fim (ISO string: YYYY-MM-DD).
     * @returns {string} String formatada para o chip de data, em caixa alta.
     */
    function formatEventDateRange(startDate, endDate) {
        if (!startDate || !endDate) return '';

        // Usamos T12:00:00Z para garantir que a data seja interpretada consistentemente (UTC).
        const d1 = new Date(startDate.replace(/-/g, '/') + 'T12:00:00Z'); 
        const d2 = new Date(endDate.replace(/-/g, '/') + 'T12:00:00Z'); 

        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
             // Fallback: se a data for inválida, exibe as datas originais no formato DD/MM
             const day1Fallback = startDate.split('-').reverse()[0];
             const month1Fallback = startDate.split('-')[1];
             const day2Fallback = endDate.split('-').reverse()[0];
             const month2Fallback = endDate.split('-')[1];
             return `${day1Fallback}/${month1Fallback} - ${day2Fallback}/${month2Fallback}`;
        }
        
        // Puxamos a data no formato UTC para consistência
        const day1 = d1.getUTCDate();
        const day2 = d2.getUTCDate();
        const month1 = d1.getUTCMonth();
        const month2 = d2.getUTCMonth();
        const year1 = d1.getUTCFullYear();
        const year2 = d2.getUTCFullYear();

        let dateString;
        
        // 1. Evento em dias no mesmo mês/ano
        if (month1 === month2 && year1 === year2) {
            const monthAbbrev = getAbbreviatedMonth(month1); // Usa a lógica condicional
            dateString = `${day1} A ${day2} DE ${monthAbbrev}`;
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
        const chipColor = ev.chip_color || 'bg-gray-700
