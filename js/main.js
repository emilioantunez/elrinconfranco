/*
  main.js
  - Carga posts desde posts/posts.json
  - Renderiza tarjetas, aplica filtros y abre modal con contenido completo
  - Ordena por fecha (más recientes primero)
  - Vanilla JS, sin dependencias externas
*/
(function(){
  'use strict'

  const POSTS_JSON = 'posts/posts.json';
  const postsList = document.getElementById('posts-list');
  const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
  const modal = document.getElementById('post-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDate = document.getElementById('modal-date');
  const modalBody = document.getElementById('modal-body');
  const modalImage = document.getElementById('modal-image');

  let allPosts = [];
  let currentFilter = 'all';

  // Formatea fecha ISO a un formato legible
  function formatDate(iso){
    try{
      const d = new Date(iso);
      return d.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'});
    }catch(e){return iso}
  }

  // Crea tarjeta de post
  function createCard(post){
    const card = document.createElement('article');
    card.className = 'post-card';

    // Imagen
    if(post.image){
      const img = document.createElement('img');
      img.className = 'post-media';
      img.src = post.image;
      img.alt = post.title || 'Imagen del post';
      card.appendChild(img);
    }

    const body = document.createElement('div');
    body.className = 'post-body';

    const meta = document.createElement('div');
    meta.className = 'post-meta';
    meta.innerHTML = `<span>${post.type === 'poesia' ? 'Poesía' : 'Relato'}</span><span>${formatDate(post.date)}</span>`;

    const h3 = document.createElement('h3');
    h3.className = 'post-title';
    h3.textContent = post.title;

    const excerpt = document.createElement('p');
    excerpt.className = 'post-excerpt';
    excerpt.textContent = post.excerpt;

    const read = document.createElement('button');
    read.className = 'read-btn';
    read.textContent = 'Leer';
    read.addEventListener('click',()=>openModal(post));

    body.appendChild(meta);
    body.appendChild(h3);
    body.appendChild(excerpt);
    body.appendChild(read);

    card.appendChild(body);

    return card;
  }

  // Renderiza lista según filtro
  function render(posts){
    postsList.innerHTML = '';
    if(posts.length===0){
      postsList.innerHTML = '<p class="muted">No hay entradas para mostrar.</p>';
      return;
    }
    posts.forEach(p=>{
      postsList.appendChild(createCard(p));
    });
  }

  // Abrir modal y llenar contenido
  function openModal(post){
    modal.setAttribute('aria-hidden','false');
    modalTitle.textContent = post.title;
    modalDate.textContent = formatDate(post.date);
    // El contenido puede ser string, array de párrafos o array de estrofas (arrays de líneas)
    modalBody.innerHTML = '';
    function escapeHTML(s){
      return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    }

    if(Array.isArray(post.content)){
      // Cada elemento puede ser una string (párrafo) o un array de líneas (estrofa)
      post.content.forEach(item => {
        const para = document.createElement('p');
        if(Array.isArray(item)){
          // unir líneas con <br>, escapando el contenido
          para.innerHTML = item.map(line => escapeHTML(line)).join('<br>');
        } else {
          // si es string, convertir secuencias literales a saltos y usar <br> para respetar líneas
          let text = String(item);
          text = text.replace(/\\r\\n/g,'\r\n').replace(/\\n/g,'\n');
          text = text.replace(/\r\n/g,'\n');
          // si tiene doble salto, dividir en párrafos adicionales
          const parts = text.split(/\n\s*\n+/);
          if(parts.length > 1){
            parts.forEach((pPart, idx)=>{
              const pEl = document.createElement('p');
              pEl.innerHTML = escapeHTML(pPart.trim()).replace(/\n/g,'<br>');
              modalBody.appendChild(pEl);
            });
            return; // ya añadimos los párrafos
          }
          para.innerHTML = escapeHTML(text).replace(/\n/g,'<br>');
        }
        modalBody.appendChild(para);
      });
    } else if(typeof post.content === 'string'){
      // Normalizar contenido: convertir secuencias literales "\\n" en saltos reales,
      // luego dividir por dobles saltos de línea para crear párrafos.
      let text = post.content;
      text = text.replace(/\\r\\n/g, '\r\n').replace(/\\n/g, '\n');
      text = text.replace(/\r\n/g, '\n');
      const parts = text.split(/\n\s*\n+/);
      parts.forEach(p => {
        const para = document.createElement('p');
        para.innerHTML = escapeHTML(p.trim()).replace(/\n/g,'<br>');
        modalBody.appendChild(para);
      });
    } else {
      modalBody.textContent = String(post.content);
    }
    if(post.image){
      modalImage.src = post.image;
      modalImage.alt = post.title;
      document.getElementById('modal-figure').classList.remove('hidden');
    } else {
      document.getElementById('modal-figure').classList.add('hidden');
    }
    document.body.style.overflow = 'hidden';
    // foco accesible
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.focus();
  }

  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  // Aplicar filtro actual
  function applyFilter(){
    let filtered = allPosts.slice();
    if(currentFilter !== 'all'){
      filtered = filtered.filter(p=>p.type === currentFilter);
    }
    render(filtered);
  }

  // Cargar posts.json
  async function loadPosts(){
    // Primero intentar usar los posts embebidos en el HTML (fallback offline)
    const embedded = document.getElementById('embedded-posts');
    if(embedded){
      try{
        const data = JSON.parse(embedded.textContent);
        if(Array.isArray(data.posts)){
          allPosts = data.posts.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
          applyFilter();
          if(allPosts.length > 0) openModal(allPosts[0]);
        }
      }catch(e){
        console.warn('embedded-posts presente pero no válido JSON:', e.message);
      }
    }

    // Luego intentar obtener la versión real desde posts/posts.json y sobrescribir si es exitosa
    try{
      const res = await fetch(POSTS_JSON);
      if(!res.ok) throw new Error('No se pudo cargar posts.json');
      const data = await res.json();
      if(!Array.isArray(data.posts)) throw new Error('Estructura inválida en posts.json');
      // Ordenar por fecha (desc) y actualizar vista
      allPosts = data.posts.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
      applyFilter();
      if(allPosts.length > 0) openModal(allPosts[0]);
    }catch(err){
      // No mostrar el error al usuario si ya hay posts embebidos; loguear para depuración.
      if(!allPosts || allPosts.length === 0){
        postsList.innerHTML = `<p class="muted">Error cargando entradas: ${err.message}</p>`;
      }
      console.warn('No se pudo sincronizar posts desde posts.json:', err.message);
    }
  }

  // Eventos filtros
  filterBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      filterBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFilter();
    });
  });

  // Eventos modal (cerrar al fondo o al boton)
  modal.addEventListener('click', (e)=>{
    if(e.target.matches('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });

  // Inicializar
  document.addEventListener('DOMContentLoaded', ()=>{
    loadPosts();
  });

})();
