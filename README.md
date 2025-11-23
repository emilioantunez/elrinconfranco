# El Rincón Franco

Blog literario moderno y responsive para GitHub Pages.

Estructura del proyecto:

```
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── posts/
│   └── posts.json
├── images/
│   └── (tus imágenes existentes)
└── README.md
```

Cómo funciona:

- El contenido del blog se gestiona desde `posts/posts.json`. Añade nuevos relatos o poemas appending objetos al array `posts` con la estructura:

```json
{
  "id": 3,
  "title": "Título del relato",
  "type": "relato", // o "poesia"
  "date": "2025-01-15",
  "excerpt": "Breve resumen...",
  "content": "Contenido completo...",
  "image": "images/nombre-imagen.jpg"
}
```

- El archivo `index.html` carga `js/main.js` que realiza un `fetch('posts/posts.json')` y renderiza automáticamente las tarjetas.
- No necesitas tocar HTML/CSS/JS para publicar nuevas entradas: solo editar `posts/posts.json`.

Despliegue en GitHub Pages:

1. Crea un repositorio llamado `elrinconfranco` en la cuenta `emilioantunez`.
2. Sube todos los archivos al repositorio (root con `index.html`).
3. En la configuración del repo, activa GitHub Pages desde la rama `main` (o `gh-pages`) y la carpeta `/(root)`.
4. La URL esperada: `https://emilioantunez.github.io/elrinconfranco/`

Notas técnicas:

- Fuentes: Google Fonts (Lora para títulos, Open Sans para texto).
- Diseño mobile-first, responsive en breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px).
- Modal accesible con cierre por Escape y clic en el fondo.
- SEO: meta tags y Open Graph incluidos en `index.html`.

¿Quieres que cree un `CNAME`, ejemplo de workflow para deploy automático o que suba todo a git y cree el primer commit por ti?
