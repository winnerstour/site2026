// diretorio_lazer.js (DIRETÓRIO DE LAZER COM FILTROS DE CATEGORIA)

(function () {
    const INDEX_DATA_URL = './lazer_index.json';
    const ARTICLE_BASE_URL = 'artigo_lazer.html?slug=';
    
    const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';

    const directoryTitle = document.getElementById('directoryTitle');
    const filterTabsContainer = document.getElementById('filterTabsContainer');
    const cardsContainer = document.getElementById('cardsContainer');
    const loadingMessage = document.getElementById('loadingMessage');

    let allArticles = [];

    function fixPath(path) {
        if (!path) return path;
        if (path.startsWith('/')) {
            if (BASE_PATH) {
                return BASE_PATH + path;
            }
            return path;
        }
        return path;
    }

    // --- RENDERIZAÇÃO DE CARDS ---
    function buildArticleCard(article) {
        const finalUrl = `${ARTICLE_BASE_URL}${article.slug}`;
        const imagePath = fixPath(article.image_path || '/assets/artigos/default.webp');
        const macro = article.macro_category || 'Geral';
        const micro = article.micro_category ? ` / ${article.micro_category}` : '';

        return `
            <a href="${finalUrl}" class="article-card" data-macro="${macro}" data-micro="${article.micro_category}">
                <div class="card-thumb" style="background-image: url('${imagePath}');"></div>
                <div class="card-content">
                    <h3 class="card-title">${article.title}</h3>
                    <p class="card-meta">${macro}${micro}</p>
                    <p class="card-cta">Ver Pacote &rarr;</p>
                </div>
            </a>
        `;
    }

    // --- LÓGICA DE FILTROS E ABAS ---
    function applyFilter(macro) {
        const filteredArticles = allArticles.filter(article => {
            return macro === 'Todos' || article.macro_category === macro;
        });

        cardsContainer.innerHTML = filteredArticles.map(buildArticleCard).join('');
        
        // Atualiza o estado visual das abas
        document.querySelectorAll('.filter-tab').forEach(tab => {
            if (tab.dataset.macro === macro) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    function renderFilters() {
        const macroCategories = ['Todos'];
        allArticles.forEach(article => {
            if (article.macro_category && !macroCategories.includes(article.macro_category)) {
                macroCategories.push(article.macro_category);
            }
        });

        let tabsHtml = '';
        macroCategories.forEach(macro => {
            tabsHtml += `<button class="filter-tab" data-macro="${macro}">${macro.toUpperCase()}</button>`;
        });

        if (filterTabsContainer) {
            filterTabsContainer.innerHTML = tabsHtml;
            
            // Adiciona listeners
            filterTabsContainer.addEventListener('click', (e) => {
                const target = e.target.closest('.filter-tab');
                if (target) {
                    applyFilter(target.dataset.macro);
                }
            });
        }
        
        applyFilter('Todos');
    }

    async function loadDirectory() {
        try {
            const response = await fetch(fixPath(INDEX_DATA_URL));
            if (!response.ok) {
                throw new Error('Falha ao carregar o índice de artigos de lazer.');
            }
            
            allArticles = await response.json();
            
            if (allArticles.length === 0) {
                cardsContainer.innerHTML = '<p>Nenhum artigo de lazer encontrado.</p>';
            } else {
                renderFilters();
            }

        } catch (error) {
            console.error('Erro ao renderizar diretório de lazer:', error);
            cardsContainer.innerHTML = `<p style="color: red;">Erro ao carregar artigos: ${error.message}</p>`;
        } finally {
            if (loadingMessage) loadingMessage.style.display = 'none';
        }
    }

    if (directoryTitle) directoryTitle.textContent = 'Destinos de Lazer & Incentivo';
    document.addEventListener('DOMContentLoaded', loadDirectory);
})();
