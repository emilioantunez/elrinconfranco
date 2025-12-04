const fs = require('fs');
const path = require('path');

// Actualizar el índice de posts individuales
function updateIndex() {
  const postsDir = path.join(__dirname, 'posts');
  const indexPath = path.join(postsDir, 'individual-posts-index.json');
  
  // Buscar todos los archivos .json excepto posts.json y el índice mismo
  const files = fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.json') && f !== 'posts.json' && f !== 'individual-posts-index.json');
  
  const index = {
    posts: files,
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`✓ Índice actualizado con ${files.length} posts individuales:`);
  files.forEach(f => console.log(`  - ${f}`));
}

updateIndex();