const fs = require('fs');
const path = require('path');

// Leer el archivo posts.json
const postsData = JSON.parse(fs.readFileSync('./posts/posts.json', 'utf-8'));

// Template HTML base
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

// Crear directorio 'posts' si no existe
const postsDir = './posts';
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir);
}

// Generar archivo HTML para cada post
postsData.posts.forEach(post => {
  const html = getHTMLTemplate(post);
  const filename = `${post.slug}.html`;
  const filepath = path.join(postsDir, filename);
  
  fs.writeFileSync(filepath, html);
  console.log(`✓ Creado: ${filepath}`);
});

console.log(`\n✓ Se generaron ${postsData.posts.length} páginas estáticas`);
console.log('\nAhora puedes compartir URLs como:');
console.log('https://emilioantunez.github.io/elrinconfranco/posts/sin-buscarlo.html');
console.log('\nLas redes sociales leerán los meta tags correctos y luego redirigirán al usuario a la URL con hash.');
