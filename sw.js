// sw.js
let virtualFiles = {};

// Listen for files sent from the main UI
self.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_FILES') {
    virtualFiles = event.data.files;
    console.log('Service Worker: Files Updated');
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // We only intercept requests going to our "fake" folder
  if (url.pathname.includes('/virtual-project/')) {
    const fileName = url.pathname.split('/').pop() || 'index.html';
    const content = virtualFiles[fileName];

    if (content !== undefined) {
      // Determine MIME type based on extension
      const extension = fileName.split('.').pop();
      const mimeTypes = {
          'html': 'text/html',
          'js': 'text/javascript',
          'css': 'text/css',
          'json': 'application/json'
      };

      event.respondWith(
        new Response(content, {
          headers: { 'Content-Type': mimeTypes[extension] || 'text/plain' }
        })
      );
    } else {
      event.respondWith(new Response('File Not Found', { status: 404 }));
    }
  }
});

// Force the SW to take control immediately
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
