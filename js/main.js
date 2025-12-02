/*
  main.js - Versión con Facebook Comments
  - Carga posts desde posts/posts.json
  - Renderiza tarjetas, aplica filtros y abre modal con contenido completo
  - URLs únicas con hash (#slug) para compartir posts específicos
  - Botón "Copiar enlace" en cada post
  - Soporte para arrays de estrofas en poesía
  - Procesamiento de Markdown básico (## títulos, **negrita**)
  - Integración con Facebook Comments
  - Ordena por fecha (más recientes primero)
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

  // Escapa HTML para prevenir XSS
  function escapeHTML(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  // Procesa Markdown básico: ## para h2, ** para negrita, * para cursiva
  function parseMarkdown(text){
    return text
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')  // ## Título
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // **negrita**
      .replace(/\*(.+?)\*/g, '<em>$1</em>');  // *cursiva*
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

  // Renderiza el contenido del post en el modal
  function renderContent(post){
    modalBody.innerHTML = '';
    
    if(Array.isArray(post.content)){
      // Cada elemento puede ser una string (párrafo) o un array de líneas (estrofa)
      post.content.forEach(item => {
        if(Array.isArray(item)){
          // Es una estrofa (array de versos)
          const stanza = document.createElement('p');
          stanza.className = 'poem-stanza';
          stanza.innerHTML = item.map(line => escapeHTML(line)).join('<br>');
          modalBody.appendChild(stanza);
        } else {
          // Es un párrafo simple - procesar Markdown
          const para = document.createElement('div');
          para.innerHTML = parseMarkdown(item);
          modalBody.appendChild(para);
        }
      });
    } else if(typeof post.content === 'string'){
      // Contenido como string simple
      const para = document.createElement('div');
      para.innerHTML = parseMarkdown(post.content);
      modalBody.appendChild(para);
    }
  }

  // Crea el botón de compartir
  function createShareButton(post){
    const shareBtn = document.createElement('button');
    shareBtn.className = 'share-btn';
    shareBtn.innerHTML = '🔗 Copiar enlace';
    shareBtn.title = 'Copiar enlace para compartir';
    
    shareBtn.addEventListener('click', async ()=>{
      const url = `${window.location.origin}${window.location.pathname}#${post.slug}`;
      
      try {
        await navigator.clipboard.writeText(url);
        shareBtn.innerHTML = '✓ ¡Enlace copiado!';
        shareBtn.style.background = '#4CAF50';
        
        setTimeout(()=>{
          shareBtn.innerHTML = '🔗 Copiar enlace';
          shareBtn.style.background = '';
        }, 2000);
      } catch(err) {
        // Fallback para navegadores antiguos
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        
        shareBtn.innerHTML = '✓ ¡Enlace copiado!';
        setTimeout(()=>{
          shareBtn.innerHTML = '🔗 Copiar enlace';
        }, 2000);
      }
    });
    
    return shareBtn;
  }

  // Recargar widget de Facebook Comments
  function loadFacebookComments(postUrl){
    const fbComments = document.querySelector('.fb-comments');
    if(fbComments){
      // Actualizar el atributo data-href con la URL del post
      fbComments.setAttribute('data-href', postUrl);
      
      // Reparsear el widget de Facebook si el SDK está disponible
      if(typeof FB !== 'undefined'){
        FB.XFBML.parse();
      }
    }
  }

  // Abrir modal y llenar contenido
  function openModal(post){
    // Construir URL completa del post
    const postUrl = `${window.location.origin}${window.location.pathname}#${post.slug}`;
    
    // Actualizar URL sin recargar la página
    if(post.slug){
      window.history.pushState({postSlug: post.slug}, '', `#${post.slug}`);
    }
    
    modal.setAttribute('aria-hidden','false');
    modalTitle.textContent = post.title;
    modalDate.textContent = formatDate(post.date);
    
    // Renderizar contenido
    renderContent(post);
    
    // Agregar botón de compartir si no existe
    let shareBtn = modal.querySelector('.share-btn');
    if(!shareBtn && post.slug){
      shareBtn = createShareButton(post);
      const modalHeader = modal.querySelector('.modal-header');
      modalHeader.appendChild(shareBtn);
    } else if(shareBtn && post.slug){
      // Actualizar botón existente
      const newShareBtn = createShareButton(post);
      shareBtn.replaceWith(newShareBtn);
    }
    
    // Imagen
    if(post.image){
      modalImage.src = post.image;
      modalImage.alt = post.title;
      document.getElementById('modal-figure').classList.remove('hidden');
    } else {
      document.getElementById('modal-figure').classList.add('hidden');
    }
    
    // Cargar comentarios de Facebook para este post específico
    loadFacebookComments(postUrl);
    
    document.body.style.overflow = 'hidden';
    
    // Foco accesible
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.focus();
  }

  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    
    // Limpiar hash de la URL
    window.history.pushState('', document.title, window.location.pathname);
  }

  // Aplicar filtro actual
  function applyFilter(){
    let filtered = allPosts.slice();
    if(currentFilter !== 'all'){
      filtered = filtered.filter(p=>p.type === currentFilter);
    }
    render(filtered);
  }

  // Buscar post por slug
  function findPostBySlug(slug){
    return allPosts.find(p => p.slug === slug);
  }

  // Verificar si hay un hash en la URL al cargar
  function checkHashOnLoad(){
    const hash = window.location.hash.slice(1); // Quitar el #
    if(hash){
      const post = findPostBySlug(hash);
      if(post){
        openModal(post);
      }
    }
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
          checkHashOnLoad();
        }
      }catch(e){
        console.warn('embedded-posts presente pero no válido JSON:', e.message);
      }
    }

    // Luego intentar obtener la versión real desde posts/posts.json
    try{
      const res = await fetch(POSTS_JSON);
      if(!res.ok) throw new Error('No se pudo cargar posts.json');
      const data = await res.json();
      if(!Array.isArray(data.posts)) throw new Error('Estructura inválida en posts.json');
      
      // Ordenar por fecha (desc) y actualizar vista
      allPosts = data.posts.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
      applyFilter();
      checkHashOnLoad();
    }catch(err){
      // No mostrar el error al usuario si ya hay posts embebidos
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

  // Eventos modal (cerrar al fondo o al botón)
  modal.addEventListener('click', (e)=>{
    if(e.target.matches('[data-close]')) closeModal();
  });
  
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });

  // Manejar navegación con botones del navegador (atrás/adelante)
  window.addEventListener('popstate', (e)=>{
    if(modal.getAttribute('aria-hidden') === 'false'){
      closeModal();
    } else {
      checkHashOnLoad();
    }
  });

  // Inicializar
  document.addEventListener('DOMContentLoaded', ()=>{
    loadPosts();
  });

})();