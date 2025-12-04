const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Función para generar slug desde el título
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Función para obtener el siguiente ID
function getNextId() {
  const postsDir = path.join(__dirname, 'posts');
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.json') && f !== 'posts.json' && f !== 'individual-posts-index.json');
  
  if (files.length === 0) return 100; // Empezar desde 100 para posts individuales
  
  const ids = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(postsDir, f), 'utf-8'));
    return data.id || 0;
  });
  
  return Math.max(...ids) + 1;
}

// Template del post individual
function createPostTemplate(postData) {
  return JSON.stringify(postData, null, 2);
}

// Actualizar índice de posts individuales
function updatePostsIndex() {
  const postsDir = path.join(__dirname, 'posts');
  const indexPath = path.join(postsDir, 'individual-posts-index.json');
  
  const files = fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.json') && f !== 'posts.json' && f !== 'individual-posts-index.json');
  
  const index = {
    posts: files,
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`✓ Índice actualizado con ${files.length} post(s) individual(es)`);
}

async function main() {
  console.log('=== Crear Nuevo Post ===\n');
  
  const title = await prompt('Título del post: ');
  const type = await prompt('Tipo (relato/poesia): ');
  const excerpt = await prompt('Resumen/excerpt: ');
  const date = await prompt('Fecha (YYYY-MM-DD, Enter para hoy): ') || new Date().toISOString().split('T')[0];
  const image = await prompt('Ruta de la imagen (ej: images/mi-imagen.jpg): ');
  
  console.log('\nAhora ingresa el contenido del post.');
  console.log('Para relatos: escribe cada párrafo y presiona Enter. Escribe "FIN" cuando termines.');
  console.log('Para poesía: escribe cada estrofa separada, luego "---" entre estrofas, y "FIN" al final.\n');
  
  const content = [];
  let currentStanza = [];
  let line;
  
  while (true) {
    line = await prompt('> ');
    
    if (line === 'FIN') {
      if (type === 'poesia' && currentStanza.length > 0) {
        content.push(currentStanza);
      }
      break;
    }
    
    if (type === 'poesia') {
      if (line === '---') {
        if (currentStanza.length > 0) {
          content.push(currentStanza);
          currentStanza = [];
        }
      } else {
        currentStanza.push(line);
      }
    } else {
      content.push(line);
    }
  }
  
  const slug = generateSlug(title);
  const id = getNextId();
  
  const postData = {
    id,
    title,
    type,
    slug,
    date,
    excerpt,
    content,
    image
  };
  
  // Guardar como archivo JSON individual
  const filename = `${slug}.json`;
  const filepath = path.join(__dirname, 'posts', filename);
  
  fs.writeFileSync(filepath, createPostTemplate(postData));
  
  // Actualizar el índice de posts individuales
  updatePostsIndex();
  
  console.log(`\n✓ Post creado exitosamente!`);
  console.log(`  Archivo: posts/${filename}`);
  console.log(`  ID: ${id}`);
  console.log(`  Slug: ${slug}`);
  console.log(`\nURL del post: https://emilioantunez.github.io/elrinconfranco/#${slug}`);
  
  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});