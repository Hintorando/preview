// sw.js
const DB_NAME = 'IDE_Storage';
const STORE_NAME = 'scripts';

// Helper to get user code from IndexedDB
async function getUserCode() {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get('user-sw-logic');
      getReq.onsuccess = () => resolve(getReq.result);
    };
    request.onerror = () => resolve(null);
  });
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', (event) => {
  // We only want to intercept dummy API calls, not our own IDE files
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      (async () => {
        const userCode = await getUserCode();
        if (!userCode) return new Response("No user code found in IDE storage.");

        try {
          // Create a function from the user's string
          // We pass 'event' and 'Response' so they can use them
          const userHandler = new Function('event', 'Response', userCode);
          const result = userHandler(event, Response);
          
          return result instanceof Response ? result : new Response("User script didn't return a Response object.");
        } catch (err) {
          return new Response("Error in User Script: " + err.stack, { status: 500 });
        }
      })()
    );
  }
});
