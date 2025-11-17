// diretorio_corporativo.js (DIRETÓRIO CORPORATIVO ADAPTADO PARA O NOVO DESIGN)

(function () {
    const INDEX_DATA_URL = './corporativo_index.json';
    const ARTICLE_BASE_URL = 'artigo_corporativo.html?slug=';
    
    const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';

    const cardsContainer = document.getElementById('cardsContainer');
    const loadingMessage = document.getElementById('loadingMessage');


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
        // O image_path vem do JSON, assumindo que ele aponta para a imagem de thumbnail do artigo
        const imagePath = fixPath(article.image_path || '/assets/artigos/default.webp'); 
        const metaText = article.meta_text || 'Leitura Estratégica';

        return `
            <a href="${finalUrl}" class="article-card">
                <div class="card-thumb-bg" style="background-image: url('${imagePath}');"></div>
                <div class="card-content">
                    <h3 class="card-title">${article.title}</h3>
                    <p class="card-meta">${metaText}</p>
                    <p class="card-cta">Acessar Artigo →</p>
                </div>
            </a>
        `;
    }

    async function loadDirectory() {
        try {
            const response = await fetch(fixPath(INDEX_DATA_URL));
            if (!response.ok) {
                throw new Error('Falha ao carregar o índice de artigos corporativos.');
            }
            
            const allArticles = await response.json();
            
            if (allArticles.length === 0) {
                cardsContainer.innerHTML = '<p>Nenhum artigo corporativo encontrado.</p>';
            } else {
                cardsContainer.innerHTML = allArticles.map(buildArticleCard).join('');
            }

        } catch (error) {
            console.error('Erro ao renderizar diretório corporativo:', error);
            cardsContainer.innerHTML = `<p style="color: red;">Erro ao carregar artigos: ${error.message}</p>`;
        } finally {
            if (loadingMessage) loadingMessage.style.display = 'none';
        }
    }

    document.addEventListener('DOMContentLoaded', loadDirectory);
})();
