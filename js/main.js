/*
  main.js - Sistema híbrido
  - Carga posts desde posts.json (posts antiguos)
  - Carga posts individuales desde posts/*.json (posts nuevos)
  - Combina ambas fuentes y renderiza todo junto
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

  // Actualizar meta tags para compartir en redes sociales
  function updateMetaTags(post){
    const baseUrl = 'https://emilioantunez.github.io/elrinconfranco';
    const postUrl = `${baseUrl}/#${post.slug}`;
    const imageUrl = `${baseUrl}/${post.image}`;
    
    const updateOrCreateMeta = (property, content, isProperty = true) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateOrCreateMeta('og:title', `${post.title} - El Rincón Franco`);
    updateOrCreateMeta('og:description', post.excerpt);
    updateOrCreateMeta('og:url', postUrl);
    updateOrCreateMeta('og:image', imageUrl);
    updateOrCreateMeta('og:type', 'article');
    
    updateOrCreateMeta('twitter:card', 'summary_large_image', false);
    updateOrCreateMeta('twitter:title', post.title, false);
    updateOrCreateMeta('twitter:description', post.excerpt, false);
    updateOrCreateMeta('twitter:image', imageUrl, false);
    
    document.title = `${post.title} - El Rincón Franco`;
  }

  function restoreDefaultMetaTags(){
    const baseUrl = 'https://emilioantunez.github.io/elrinconfranco';
    
    const updateOrCreateMeta = (property, content, isProperty = true) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateOrCreateMeta('og:title', 'El Rincón Franco — Relatos y Poesía');
    updateOrCreateMeta('og:description', 'Literatura desde mi verdad. Relatos y poesía del corazón.');
    updateOrCreateMeta('og:url', baseUrl);
    updateOrCreateMeta('og:image', `${baseUrl}/images/og-image.jpg`);
    updateOrCreateMeta('og:type', 'website');
    
    document.title = 'El Rincón Franco — Relatos y Poesía';
  }

  function formatDate(iso){
    try{
      const d = new Date(iso);
      return d.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'});
    }catch(e){return iso}
  }

  function escapeHTML(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function parseMarkdown(text){
    return text
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  function createCard(post){
    const card = document.createElement('article');
    card.className = 'post-card';

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

  function renderContent(post){
    modalBody.innerHTML = '';
    
    if(Array.isArray(post.content)){
      post.content.forEach(item => {
        if(Array.isArray(item)){
          const stanza = document.createElement('p');
          stanza.className = 'poem-stanza';
          stanza.innerHTML = item.map(line => escapeHTML(line)).join('<br>');
          modalBody.appendChild(stanza);
        } else {
          const para = document.createElement('div');
          para.innerHTML = parseMarkdown(item);
          modalBody.appendChild(para);
        }
      });
    } else if(typeof post.content === 'string'){
      const para = document.createElement('div');
      para.innerHTML = parseMarkdown(post.content);
      modalBody.appendChild(para);
    }
  }

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

  function loadFacebookComments(postUrl){
    const fbComments = document.querySelector('.fb-comments');
    if(fbComments){
      fbComments.setAttribute('data-href', postUrl);
      if(typeof FB !== 'undefined'){
        FB.XFBML.parse();
      }
    }
  }

  function openModal(post){
    const postUrl = `${window.location.origin}${window.location.pathname}#${post.slug}`;
    
    if(post.slug){
      window.history.pushState({postSlug: post.slug}, '', `#${post.slug}`);
    }
    
    updateMetaTags(post);
    
    modal.setAttribute('aria-hidden','false');
    modalTitle.textContent = post.title;
    modalDate.textContent = formatDate(post.date);
    
    renderContent(post);
    
    let shareBtn = modal.querySelector('.share-btn');
    if(!shareBtn && post.slug){
      shareBtn = createShareButton(post);
      const modalHeader = modal.querySelector('.modal-header');
      modalHeader.appendChild(shareBtn);
    } else if(shareBtn && post.slug){
      const newShareBtn = createShareButton(post);
      shareBtn.replaceWith(newShareBtn);
    }
    
    if(post.image){
      modalImage.src = post.image;
      modalImage.alt = post.title;
      document.getElementById('modal-figure').classList.remove('hidden');
    } else {
      document.getElementById('modal-figure').classList.add('hidden');
    }
    
    loadFacebookComments(postUrl);
    
    document.body.style.overflow = 'hidden';
    
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.focus();
  }

  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    
    restoreDefaultMetaTags();
    
    window.history.pushState('', document.title, window.location.pathname);
  }

  function applyFilter(){
    let filtered = allPosts.slice();
    if(currentFilter !== 'all'){
      filtered = filtered.filter(p=>p.type === currentFilter);
    }
    render(filtered);
  }

  function findPostBySlug(slug){
    return allPosts.find(p => p.slug === slug);
  }

  function checkHashOnLoad(){
    const hash = window.location.hash.slice(1);
    if(hash){
      const post = findPostBySlug(hash);
      if(post){
        openModal(post);
      }
    }
  }

  // Cargar posts individuales desde posts/*.json
  async function loadIndividualPosts(){
    const individualPosts = [];
    
    // Lista de archivos individuales conocidos (puedes mantener esto actualizado manualmente
    // o usar un archivo index.json que liste los posts individuales)
    const individualFiles = [
      // Aquí se agregarán automáticamente cuando uses el generador
      // Ejemplo: 'mi-nuevo-post.json'
    ];
    
    // Intentar cargar un archivo índice si existe
    try {
      const indexRes = await fetch('posts/individual-posts-index.json');
      if(indexRes.ok){
        const indexData = await indexRes.json();
        individualFiles.push(...(indexData.posts || []));
      }
    } catch(e) {
      console.log('No se encontró índice de posts individuales');
    }
    
    // Cargar cada post individual
    for(const filename of individualFiles){
      try {
        const res = await fetch(`posts/${filename}`);
        if(res.ok){
          const postData = await res.json();
          individualPosts.push(postData);
        }
      } catch(err) {
        console.warn(`No se pudo cargar post individual: ${filename}`);
      }
    }
    
    return individualPosts;
  }

  async function loadPosts(){
    // Primero cargar posts embebidos como fallback
    const embedded = document.getElementById('embedded-posts');
    if(embedded){
      try{
        const data = JSON.parse(embedded.textContent);
        if(Array.isArray(data.posts)){
          allPosts = data.posts.slice();
        }
      }catch(e){
        console.warn('embedded-posts presente pero no válido JSON:', e.message);
      }
    }

    // Cargar posts desde posts.json
    try{
      const res = await fetch(POSTS_JSON);
      if(res.ok){
        const data = await res.json();
        if(Array.isArray(data.posts)){
          allPosts = data.posts.slice();
        }
      }
    }catch(err){
      console.warn('No se pudo cargar posts.json:', err.message);
    }
    
    // Cargar posts individuales y combinarlos
    const individualPosts = await loadIndividualPosts();
    allPosts = [...allPosts, ...individualPosts];
    
    // Ordenar por fecha (más recientes primero)
    allPosts.sort((a,b)=> new Date(b.date) - new Date(a.date));
    
    applyFilter();
    checkHashOnLoad();
  }

  filterBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      filterBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFilter();
    });
  });

  modal.addEventListener('click', (e)=>{
    if(e.target.matches('[data-close]')) closeModal();
  });
  
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });

  window.addEventListener('popstate', (e)=>{
    if(modal.getAttribute('aria-hidden') === 'false'){
      closeModal();
    } else {
      checkHashOnLoad();
    }
  });

  document.addEventListener('DOMContentLoaded', ()=>{
    loadPosts();
  });

})();