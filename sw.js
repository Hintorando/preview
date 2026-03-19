let virtualFiles = {};

self.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_FILES') {
    virtualFiles = event.data.files;
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.includes('/virtual-project/')) {
    // Extract filename (e.g., "scripts/main.js")
    const parts = url.pathname.split('/virtual-project/');
    const fileName = parts[1] || 'index.html';
    
    const fileData = virtualFiles[fileName];

    if (fileData) {
      const extension = fileName.split('.').pop().toLowerCase();
      const mimeTypes = {
        'html': 'text/html',
        'js': 'text/javascript',
        'css': 'text/css',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'svg': 'image/svg+xml'
      };

      // Handle binary files (images) vs text files
      let body = fileData;
      if (fileData instanceof Blob) {
          body = fileData;
      }

      event.respondWith(
        new Response(body, {
          headers: { 'Content-Type': mimeTypes[extension] || 'text/plain' }
        })
      );
    } else {
      event.respondWith(new Response('File Not Found', { status: 404 }));
    }
  }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
