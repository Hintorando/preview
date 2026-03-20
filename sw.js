// sw.js
let virtualFiles = {};

self.addEventListener('message', (event) => {
    if (event.data.type === 'UPDATE_FILES') {
        virtualFiles = event.data.files;
        // Tell the IDE we are ready!
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage('ACK');
        }
    }
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const marker = '/virtual-project/';

    if (url.pathname.includes(marker)) {
        // Extract the path and strip any query parameters (like ?t=12345)
        let rawPath = url.pathname.split(marker)[1] || 'index.html';
        const cleanPath = rawPath.split('?')[0]; 
        
        let content = virtualFiles[cleanPath];

        if (content !== undefined) {
            const ext = cleanPath.split('.').pop().toLowerCase();
            
            // CONSOLE FIX: If it's the HTML file, inject the hook immediately
            if (ext === 'html') {
                const hook = `
                <script>
                    (function() {
                        const sendLog = (type, args) => {
                            window.parent.postMessage({ type: 'CONSOLE_LOG', logType: type, msg: Array.from(args).join(' ') }, '*');
                        };
                        ['log','warn','error'].forEach(t => {
                            const orig = console[t];
                            console[t] = function() { sendLog(t, arguments); orig.apply(console, arguments); };
                        });
                        window.onerror = (m, s, l, c, e) => { sendLog('error', [m + ' at line ' + l]); };
                    })();
                <\/script>`;
                content = hook + content;
            }

            const mimeTypes = { 'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css', 'json': 'application/json' };
            const mime = mimeTypes[ext] || 'text/plain';
            
            event.respondWith(new Response(content, { headers: { 'Content-Type': mime } }));
        } else {
            // Return 404 if the virtual file doesn't exist
            event.respondWith(new Response('File not found in virtual system', { status: 404 }));
        }
    }
});
