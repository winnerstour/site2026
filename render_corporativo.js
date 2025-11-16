// render_corporativo.js (Script para renderizar artigos corporativos a partir de JSON)

(function () {
    const DATA_BASE_PATH = './artigos-corporativo/'; 
    const DEFAULT_DATA_SLUG = 'gestao_inteligente_viagens'; // Slug padrão
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

    function renderBlock(block) {
        switch (block.type) {
            case 'paragraph':
                return `<p>${block.content}</p>`;
            case 'heading':
                return `<h2>${block.content}</h2>`;
            case 'list':
                const tag = block.style === 'ordered' ? 'ol' : 'ul';
                let listHtml = `<${tag}>`;
                block.items.forEach(item => {
                    // Substitui a quebra de linha por <br> se for uma lista
                    listHtml += `<li>${item.replace(/\n/g, '<br>')}</li>`;
                });
                listHtml += `</${tag}>`;
                return listHtml;
            case 'blockquote':
                return `<blockquote><p>${block.content}</p></blockquote>`;
            case 'raw_html': 
                return block.content;
            default:
                return '';
        }
    }

    function renderContent(data) {
        // Renderiza o cabeçalho
        if (docTitle) docTitle.textContent = data.meta_title || `WinnersTour — ${data.title}`;
        if (articleTitle) articleTitle.textContent = data.title;
        if (articleMeta) articleMeta.textContent = data.author_meta;
        
        // Renderiza o CTA principal
        if (ctaHero) {
            ctaHero.href = data.cta_url_hero || WHATSAPP_BASE;
            ctaHero.textContent = data.cta_text_hero || 'FALE CONOSCO';
        }
        
        // Aplica a imagem de fundo no Hero
        if (heroArticle && data.image_path) {
            const imagePath = fixPath(data.image_path);
            heroArticle.style.backgroundImage = `url('${imagePath}')`;
        }

        // Renderiza o corpo do artigo
        let bodyHtml = '';
        if (data.intro && data.intro.blocks) {
            data.intro.blocks.forEach(block => {
                bodyHtml += renderBlock(block);
            });
        }

        if (data.sections) {
            data.sections.forEach(section => {
                // Renderiza o título da seção (se for conteúdo ou CTA)
                if (section.title && section.section_type !== 'intro') {
                     bodyHtml += `<h2>${section.title}</h2>`;
                }

                // Renderiza os blocos dentro da seção
                if (section.blocks) {
                    section.blocks.forEach(block => {
                        bodyHtml += renderBlock(block);
                    });
                }
            });
        }
        
        if (articleBody) articleBody.innerHTML = bodyHtml;
    }

    async function loadArticle() {
        const slug = getSlug();
        const jsonPath = `${DATA_BASE_PATH}${slug}.json`; 

        try {
            const finalJsonPath = fixPath(jsonPath);
            const response = await fetch(finalJsonPath);

            if (!response.ok) {
                // Tenta fallback para o diretório raiz
                const rootJsonPath = fixPath(`./${slug}.json`);
                const rootResponse = await fetch(rootJsonPath);
                if (!rootResponse.ok) {
                    throw new Error(`Arquivo JSON não encontrado para slug: ${slug} (Status: ${response.status})`);
                }
                var data = await rootResponse.json();
            } else {
                var data = await response.json();
            }
            
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
