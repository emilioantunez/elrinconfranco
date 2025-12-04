const fs = require('fs');
const path = require('path');

// Template HTML base para páginas estáticas
const getHTMLTemplate = (post) => {
  const contentPreview = Array.isArray(post.content) 
    ? (Array.isArray(post.content[0]) 
        ? post.content[0].join(' ').substring(0, 150)
        : post.content[0].substring(0, 150))
    : post.content.substring(0, 150);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  
  <!-- Meta tags específicos del post -->
  <title>${post.title} - El Rincón Franco</title>
  <meta name="description" content="${post.excerpt}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${post.title}">
  <meta property="og:description" content="${post.excerpt}">
  <meta property="og:url" content="https://emilioantunez.github.io/elrinconfranco/#${post.slug}">
  <meta property="og:site_name" content="El Rincón Franco">
  <meta property="og:image" content="https://emilioantunez.github.io/elrinconfranco/${post.image}">
  <meta property="article:published_time" content="${post.date}">
  <meta property="article:author" content="Emilio Antúnez">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.title}">
  <meta name="twitter:description" content="${post.excerpt}">
  <meta name="twitter:image" content="https://emilioantunez.github.io/elrinconfranco/${post.image}">
  
  <!-- Redirección inmediata al hash correcto -->
  <script>
    window.location.href = "https://emilioantunez.github.io/elrinconfranco/#${post.slug}";
  </script>
  
  <!-- Fallback si JavaScript está deshabilitado -->
  <meta http-equiv="refresh" content="0;url=https://emilioantunez.github.io/elrinconfranco/#${post.slug}">
</head>
<body>
  <p>Redirigiendo a <a href="https://emilioantunez.github.io/elrinconfranco/#${post.slug}">${post.title}</a>...</p>
</body>
</html>`;
};

function generateStaticPages() {
  console.log('=== Generador de Páginas Estáticas ===\n');
  
  const postsDir = path.join(__dirname, 'posts');
  const staticDir = path.join(postsDir, 'static');
  
  // Crear directorio 'posts/static' si no existe
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir);
    console.log('✓ Directorio posts/static/ creado');
  }
  
  let allPosts = [];
  let generatedCount = 0;
  
  // 1. Cargar posts desde posts.json
  const postsJsonPath = path.join(postsDir, 'posts.json');
  if (fs.existsSync(postsJsonPath)) {
    try {
      const postsData = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
      if (Array.isArray(postsData.posts)) {
        allPosts.push(...postsData.posts);
        console.log(`✓ Cargados ${postsData.posts.length} posts desde posts.json`);
      }
    } catch (err) {
      console.error('✗ Error leyendo posts.json:', err.message);
    }
  }
  
  // 2. Cargar posts individuales desde archivos JSON
  const individualFiles = fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.json') && f !== 'posts.json' && f !== 'individual-posts-index.json');
  
  if (individualFiles.length > 0) {
    console.log(`✓ Encontrados ${individualFiles.length} posts individuales`);
    
    individualFiles.forEach(filename => {
      try {
        const filepath = path.join(postsDir, filename);
        const postData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        allPosts.push(postData);
      } catch (err) {
        console.error(`✗ Error leyendo ${filename}:`, err.message);
      }
    });
  }
  
  // 3. Generar archivo HTML estático para cada post
  console.log(`\nGenerando páginas estáticas para ${allPosts.length} posts...\n`);
  
  allPosts.forEach(post => {
    if (!post.slug) {
      console.warn(`⚠ Post sin slug: "${post.title}" - saltando`);
      return;
    }
    
    const html = getHTMLTemplate(post);
    const filename = `${post.slug}.html`;
    const filepath = path.join(staticDir, filename);
    
    fs.writeFileSync(filepath, html);
    generatedCount++;
    console.log(`  ✓ ${filename}`);
  });
  
  console.log(`\n✓ Se generaron ${generatedCount} páginas estáticas en posts/static/`);
  console.log('\n=== URLs para compartir en redes sociales ===');
  allPosts.forEach(post => {
    if (post.slug) {
      console.log(`• ${post.title}`);
      console.log(`  https://emilioantunez.github.io/elrinconfranco/posts/static/${post.slug}.html\n`);
    }
  });
}

// Ejecutar
try {
  generateStaticPages();
} catch (err) {
  console.error('Error fatal:', err);
  process.exit(1);
}