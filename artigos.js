// artigos.js
// Diretório dinâmico de artigos corporativos baseado em index-artigos-corporativos.json

(function () {
  const gridEl = document.getElementById('events-grid');

  const BASE_PATH = window.location.pathname.indexOf('/site2026') !== -1
    ? '/site2026'
    : '';

  function createCard(item) {
    const slug       = item.slug || '';
    const titulo     = item.titulo || item.titulo_curto || slug || 'Artigo corporativo';
    const tituloCurto = item.titulo_curto || '';
    let imgSrc       = item.card_image || '';

    if (!slug) return null;

    // Ajuste de caminho para funcionar em / e /site2026
    if (imgSrc.startsWith('./')) {
      imgSrc = BASE_PATH + imgSrc.slice(1); // remove o ponto e mantém /assets...
    } else if (imgSrc.startsWith('/')) {
      imgSrc = BASE_PATH + imgSrc;
    }

    const href = BASE_PATH + '/artigo-corporativo.html?slug=' + encodeURIComponent(slug);

    const link = document.createElement('a');
    link.className = 'event-card';
    link.href = href;
    link.setAttribute('aria-label', tituloCurto || titulo);

    const media = document.createElement('div');
    media.className = 'card-media';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = imgSrc;
    img.alt = titulo;
    media.appendChild(img);

    const content = document.createElement('div');
    content.className = 'card-content';

    const titleEl = document.createElement('p');
    titleEl.className = 'card-title';
    titleEl.textContent = titulo.toUpperCase();

    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'card-subtitle';
    // Se título curto for diferente, usamos como subtítulo; se for igual, deixamos vazio
    if (tituloCurto && tituloCurto !== titulo) {
      subtitleEl.textContent = tituloCurto;
    } else {
      subtitleEl.textContent = '';
    }

    content.appendChild(titleEl);
    if (subtitleEl.textContent.trim() !== '') {
      content.appendChild(subtitleEl);
    }

    link.appendChild(media);
    link.appendChild(content);

    return link;
  }

  function renderList(list) {
    if (!gridEl) return;
    gridEl.innerHTML = '';

    list.forEach(function (item) {
      const card = createCard(item);
      if (card) {
        gridEl.appendChild(card);
      }
    });
  }

  async function init() {
    const url = BASE_PATH + '/index-artigos-corporativos.json';

    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Não foi possível carregar ' + url);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('O arquivo de índice de artigos não está no formato esperado (array).');
      }

      renderList(data);
    } catch (err) {
      console.error('Erro ao carregar índice de artigos:', err);
      if (gridEl) {
        const div = document.createElement('div');
        div.textContent = 'Erro ao carregar os artigos corporativos. Tente novamente mais tarde.';
        gridEl.appendChild(div);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
