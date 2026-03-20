let virtualFiles = {};

self.addEventListener('message', (event) => {
    if (event.data.type === 'UPDATE_FILES') {
        virtualFiles = event.data.files;
        if (event.ports && event.ports[0]) event.ports[0].postMessage('ACK');
    }
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const marker = '/virtual-project/';

    if (url.pathname.includes(marker)) {
        // Strip marker and query strings
        const path = url.pathname.split(marker)[1].split('?')[0] || 'index.html';
        
        // Find content or default to empty string if it's a "folder" entry
        let content = virtualFiles[path];

        if (content !== undefined) {
            const ext = path.split('.').pop().toLowerCase();
            if (ext === 'html') {
                const hook = `<script>
                    (function() {
                        const sendLog = (type, args) => {
                            window.parent.postMessage({ type: 'CONSOLE_LOG', logType: type, msg: Array.from(args).map(a => 
                                typeof a === 'object' ? JSON.stringify(a) : a
                            ).join(' ') }, '*');
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

            const mime = { 'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css' }[ext] || 'text/plain';
            event.respondWith(new Response(content, { headers: { 'Content-Type': mime } }));
        }
    }
});
