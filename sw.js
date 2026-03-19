// sw.js
let virtualFiles = {};

self.addEventListener('message', (e) => {
    if (e.data.type === 'UPDATE_FILES') virtualFiles = e.data.files;
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const marker = '/virtual-project/';

    if (url.pathname.includes(marker)) {
        // Grab everything after '/virtual-project/' including subfolders
        const path = url.pathname.split(marker)[1] || 'index.html';
        const file = virtualFiles[path];

        if (file) {
            const ext = path.split('.').pop().toLowerCase();
            const mime = { 
                'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css',
                'png': 'image/png', 'jpg': 'image/jpeg', 'json': 'application/json'
            }[ext] || 'text/plain';

            event.respondWith(new Response(file, { headers: { 'Content-Type': mime } }));
        } else {
            event.respondWith(new Response('404: File Not Found', { status: 404 }));
        }
    }
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
