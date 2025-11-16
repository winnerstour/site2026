// render_lazer.js (Script para renderizar artigos de lazer a partir de JSON)

(function () {
    const DATA_BASE_PATH = './artigos-lazer/'; // Assumindo uma pasta para os JSONs de Lazer
    const DEFAULT_DATA_SLUG = 'serhs-natal'; // Slug padrão se não houver um na URL
    const WHATSAPP_BASE = 'https://wa.me/5541999450111?text=';

    // Define o prefixo necessário APENAS para o ambiente GitHub Pages
    const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';

    // Seleção dos elementos do template
    const docTitle = document.getElementById('docTitle');
    const articleTitle = document.getElementById('articleTitle');
    const articleMeta = document.getElementById('articleMeta');
    const ctaHero = document.getElementById('ctaHero');
    const articleBody = document.getElementById('articleBody');
    const heroArticle = document.getElementById('heroArticle');

    function getSlug() {
        const params = new URLSearchParams(window.location.search);
        return params.get("slug") || DEFAULT_DATA_SLUG;
    }

    function fixPath(path) {
        if (!path) return path;

        // Se for um caminho absoluto (imagens, começa com /)
        if (path.startsWith('/')) {
            if (BASE_PATH) {
                return BASE_PATH + path;
            }
            return path;
        }
        return path;
    }

    function renderContent(data) {
        // Renderiza o cabeçalho
        if (docTitle) docTitle.textContent = `WinnersTour — ${data.title}`;
        if (articleTitle) articleTitle.textContent = data.title;
        if (articleMeta) articleMeta.textContent = data.author_meta;
        
        // Renderiza o CTA principal
        if (ctaHero) {
            ctaHero.href = data.cta_url_hero || WHATSAPP_BASE;
            ctaHero.textContent = data.cta_text_hero || 'FALE CONOSCO';
        }
        
        // Aplica a imagem de fundo no Hero
        if (heroArticle && data.hero_image) {
            const imagePath = fixPath(data.image_path);
            heroArticle.style.backgroundImage = `url('${imagePath}')`;
        }

        // Renderiza o corpo do artigo
        let bodyHtml = '';
        if (data.sections && articleBody) {
            data.sections.forEach(section => {
                if (section.section_type === 'intro' || section.section_type === 'content' || section.section_type === 'cta') {
                    if (section.title) {
                         bodyHtml += `<h2>${section.title}</h2>`;
                    }
                    
                    section.blocks.forEach(block => {
                        switch (block.type) {
                            case 'paragraph':
                                bodyHtml += `<p>${block.text}</p>`;
                                break;
                            case 'heading':
                                bodyHtml += `<h2>${block.content}</h2>`;
                                break;
                            case 'list':
                                const tag = block.style === 'ordered' ? 'ol' : 'ul';
                                bodyHtml += `<${tag}>`;
                                block.content.forEach(item => {
                                    bodyHtml += `<li>${item}</li>`;
                                });
                                bodyHtml += `</${tag}>`;
                                break;
                            case 'raw_html': // Para blocos HTML puros, se precisar
                                bodyHtml += block.content;
                                break;
                        }
                    });
                }
            });
            articleBody.innerHTML = bodyHtml;
        }
    }

    async function loadArticle() {
        const slug = getSlug();
        const jsonPath = `./artigos-lazer/${slug}.json`; 

        try {
            const finalJsonPath = fixPath(jsonPath);
            const response = await fetch(finalJsonPath);

            if (!response.ok) {
                throw new Error(`Arquivo JSON não encontrado para slug: ${slug} (${response.status})`);
            }

            const data = await response.json();
            renderContent(data);

        } catch (error) {
            console.error('Erro ao carregar artigo:', error);
            if (articleBody) {
                articleBody.innerHTML = `<h1>Erro ao carregar conteúdo</h1><p>Não foi possível encontrar o artigo solicitado (${slug}).</p>`;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', loadArticle);
})();
