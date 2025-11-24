// lazer-oferta.js
// Página de detalhe das ofertas de lazer (usa slug + JSON completo)

(function () {
  const titleEl = document.getElementById('offerTitle');
  const categoryEl = document.getElementById('offerCategory');
  const metaEl = document.getElementById('offerMeta');
  const imgEl = document.getElementById('offerImage');
  const introContainer = document.getElementById('offerIntro');
  const sectionsContainer = document.getElementById('offerSections');
  const errorContainer = document.getElementById('offerError');

  const pageTitleTag = document.getElementById('pageTitle') || document.title;

  // Detecta /site2026 ou raiz
  const BASE_PATH = window.location.pathname.startsWith('/site2026') ? '/site2026' : '';

  function showError(msg) {
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-box">
          ${msg}
        </div>
      `;
    }
  }

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    return slug ? slug.trim() : '';
  }

  // Converte um texto markdown simples em array de blocks [{ text }]
  function mdToBlocks(md) {
    if (!md || typeof md !== 'string') return [];
    return md
      .split(/\n\s*\n/) // quebra por parágrafo (linha em branco)
      .map(chunk => chunk.replace(/\r/g, '').trim())
      .filter(Boolean)
      .map(text => ({ text }));
  }

  // Adapta o NOVO formato de JSON (titulo, titulo_curto, categoria, sections[id, titulo_secao, conteudo_markdown])
  // para o formato "antigo" esperado por renderOffer/buildIntro/buildSections
  function convertNewJsonToOld(raw, slug) {
    if (!raw || !raw.titulo || !Array.isArray(raw.sections)) {
      throw new Error('O JSON desta oferta não está no formato esperado (novo modelo).');
    }

    const allSections = raw.sections;

    // Separa CTA1 / CTA2
    const ctaSections = allSections.filter(s => s && (s.id === 'CTA1' || s.id === 'CTA2'));

    // Seção de introdução: prioriza id === 1; se não tiver, pega a primeira que NÃO é CTA
    let introSection = allSections.find(s => s && s.id === 1);
    if (!introSection) {
      introSection = allSections.find(s => s && s.id !== 'CTA1' && s.id !== 'CTA2') || allSections[0];
    }

    // Demais seções de conteúdo (id numérico 2,3,4,...)
    const contentSections = allSections.filter(
      s =>
        s &&
        s !== introSection &&
        s.id !== 'CTA1' &&
        s.id !== 'CTA2'
    );

    // Intro = introdução + CTA1/CTA2 ao final
    let introBlocks = mdToBlocks(introSection && introSection.conteudo_markdown);
    ctaSections.forEach(sec => {
      introBlocks = introBlocks.concat(mdToBlocks(sec.conteudo_markdown));
    });

    const intro = { blocks: introBlocks };

    // Seções no formato antigo: { title, blocks: [{text}] }
    const sections = contentSections.map(sec => ({
      title: sec.titulo_secao || '',
      blocks: mdToBlocks(sec.conteudo_markdown)
    }));

    return {
      slug: slug,
      title: raw.titulo,
      meta_title: raw.titulo,
      image_path: raw.image_path || '/assets/misc/placeholder-lazer.webp',
      category_macro: raw.categoria || 'Lazer',
      category_micro: '',
      intro,
      sections
    };
  }

  function buildIntro(intro) {
    introContainer.innerHTML = '';

    if (!intro || !Array.isArray(intro.blocks)) {
      const p = document.createElement('p');
      p.textContent = 'Conteúdo introdutório indisponível para esta oferta.';
      introContainer.appendChild(p);
      return;
    }

    intro.blocks.forEach((block) => {
      if (!block || !block.text) return;
      const p = document.createElement('p');
      p.textContent = block.text;
      introContainer.appendChild(p);
    });
  }

  function buildSections(sections) {
    sectionsContainer.innerHTML = '';

    if (!Array.isArray(sections) || !sections.length) {
      const p = document.createElement('p');
      p.textContent = 'Detalhes adicionais não disponíveis para esta oferta.';
      sectionsContainer.appendChild(p);
      return;
    }

    // Mantém a ORDEM EXATA das seções do JSON (sem ordenar)
    sections.forEach((section) => {
      const wrapper = document.createElement('article');
      wrapper.className = 'content-section';

      if (section.title) {
        const h2 = document.createElement('h2');
        h2.textContent = section.title;
        wrapper.appendChild(h2);
      }

      if (Array.isArray(section.blocks)) {
        section.blocks.forEach((block) => {
          if (!block || !block.text) return;
          const p = document.createElement('p');
          p.textContent = block.text;
          wrapper.appendChild(p);
        });
      }

      sectionsContainer.appendChild(wrapper);
    });
  }

  function renderOffer(data) {
    const {
      meta_title,
      title,
      image_path,
      category_macro,
      category_micro,
      intro,
      sections
    } = data;

    // Título da aba
    const finalTitle = meta_title || title || 'Oferta de Lazer — WinnersTour';
    if (pageTitleTag instanceof HTMLElement) {
      pageTitleTag.textContent = finalTitle;
    } else {
      document.title = finalTitle;
    }

    // Hero: título
    if (titleEl) {
      titleEl.textContent = title || 'Oferta sem título definido';
    }

    // Hero: categoria
    const macro = category_macro || '';
    const micro = category_micro || '';
    const catText = [macro, micro].filter(Boolean).join(' · ');
    if (categoryEl) {
      categoryEl.textContent = catText || 'Lazer';
    }

    // Hero: meta (linha fina)
    if (metaEl) {
      metaEl.textContent = 'Oferta de viagem de lazer cuidadosamente curada pela WinnersTour.';
    }

    // Imagem principal
    if (imgEl) {
      let src = '';

      if (image_path) {
        // Se vier "/assets/..." prefixa BASE_PATH
        if (image_path.startsWith('/')) {
          src = BASE_PATH + image_path;
        } else {
          src = BASE_PATH + '/' + image_path;
        }
      }

      imgEl.src = src || (BASE_PATH + '/assets/misc/placeholder-lazer.webp');
      imgEl.alt = title || 'Imagem da oferta de lazer';
    }

    // Intro
    buildIntro(intro);

    // Seções
    buildSections(sections);
  }

  async function init() {
    const slug = getSlugFromUrl();

    if (!slug) {
      showError('Nenhuma oferta foi selecionada. Acesse a página de lazer e escolha um resort.');
      if (titleEl) titleEl.textContent = 'Oferta não encontrada';
      return;
    }

    // JSON COMPLETO SEMPRE BUSCADO NA PASTA /lazer
    const dataUrl = `${BASE_PATH}/lazer/${encodeURIComponent(slug)}.json`;

    try {
      const response = await fetch(dataUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Não foi possível carregar o arquivo ${dataUrl}`);
      }

      const raw = await response.json();
      console.log('[DEBUG JSON OFERTA RAW]', raw);

      let data;

      // Formato ANTIGO (slug, title, intro, sections já prontos)
      if (raw && raw.slug && raw.title && raw.intro && raw.sections) {
        data = raw;
      }
      // Novo formato (titulo, titulo_curto, categoria, sections[id, titulo_secao, conteudo_markdown])
      else if (raw && raw.titulo && Array.isArray(raw.sections)) {
        data = convertNewJsonToOld(raw, slug);
      } else {
        throw new Error('O JSON desta oferta não está no formato esperado.');
      }

      renderOffer(data);
    } catch (err) {
      console.error('Erro ao carregar oferta de lazer:', err);
      if (titleEl) titleEl.textContent = 'Erro ao carregar oferta';
      showError(err.message || 'Erro inesperado ao carregar esta oferta.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
