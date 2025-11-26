// artigos.js
// Diretório de artigos corporativos (cards) baseado em index-artigos-corporativos.json

(function(){
  const gridEl      = document.getElementById('articlesGrid');
  const errorEl     = document.getElementById('articlesError');
  const countEl     = document.getElementById('articlesCount');
  const chipsEl     = document.getElementById('categoryChips');

  const BASE_PATH = window.location.pathname.startsWith('/site2026')
    ? '/site2026'
    : '';

  function showError(msg){
    if (!errorEl) return;
    errorEl.innerHTML = '<div class="error-box">' + (msg || 'Erro ao carregar os artigos.') + '</div>';
  }

  function createCard(item){
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.category = item.categoria || '';

    const href = BASE_PATH + '/artigo-corporativo.html?slug=' + encodeURIComponent(item.slug);

    const imgWrap = document.createElement('a');
    imgWrap.className = 'card-image-wrap';
    imgWrap.href = href;

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = (item.card_image || '').replace(/^\.\//, BASE_PATH + '/');
    img.alt = item.titulo || '';
    imgWrap.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card-body';

    const cat = document.createElement('div');
    cat.className = 'card-category';
    cat.textContent = item.categoria || 'Artigo corporativo';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = item.titulo || item.titulo_curto || item.slug;

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.textContent = item.titulo_curto || '';

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const link = document.createElement('a');
    link.className = 'card-link';
    link.href = href;
    link.innerHTML = '<span>Ver artigo completo</span><span class="card-link-arrow">→</span>';

    footer.appendChild(link);

    body.appendChild(cat);
    body.appendChild(title);
    if (item.titulo_curto){
      body.appendChild(meta);
    }
    body.appendChild(footer);

    card.appendChild(imgWrap);
    card.appendChild(body);

    return card;
  }

  function renderList(list){
    if (!gridEl) return;
    gridEl.innerHTML = '';

    list.forEach(function(item){
      const card = createCard(item);
      gridEl.appendChild(card);
    });

    if (countEl){
      const total = list.length;
      if (total === 0){
        countEl.textContent = 'Nenhum artigo encontrado para este filtro.';
      } else if (total === 1){
        countEl.textContent = '1 artigo disponível.';
      } else {
        countEl.textContent = total + ' artigos disponíveis.';
      }
    }
  }

  function applyFilter(category, allItems){
    if (!category || category === 'todos'){
      renderList(allItems);
      return;
    }
    const filtered = allItems.filter(function(item){
      return (item.categoria || '').toLowerCase() === category.toLowerCase();
    });
    renderList(filtered);
  }

  function setupFilters(allItems){
    if (!chipsEl) return;

    chipsEl.addEventListener('click', function(ev){
      const target = ev.target;
      if (!target || !target.classList.contains('chip')) return;

      const cat = target.getAttribute('data-category') || 'todos';

      const chips = chipsEl.querySelectorAll('.chip');
      chips.forEach(function(btn){
        btn.classList.toggle('is-active', btn === target);
      });

      applyFilter(cat, allItems);
    });
  }

  async function init(){
    const url = BASE_PATH + '/index-artigos-corporativos.json';

    try{
      const res = await fetch(url, { cache:'no-store' });
      if (!res.ok){
        throw new Error('Não foi possível carregar ' + url);
      }

      const data = await res.json();
      if (!Array.isArray(data)){
        throw new Error('O arquivo de índice de artigos não está no formato esperado (array).');
      }

      setupFilters(data);
      applyFilter('todos', data);
    }catch(err){
      console.error('Erro ao carregar índice de artigos:', err);
      showError(err.message || 'Erro inesperado ao carregar os artigos.');
      if (countEl){
        countEl.textContent = 'Não foi possível carregar os artigos.';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
