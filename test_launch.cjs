// Verify instant shell launch while the network is unavailable, without caching dossiers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const handlers = {}, entries = new Map(), deleted = [], requests = [];
let offline = false;
const cache = {
  addAll: async items => {for (const request of items) entries.set(new URL(request.url).pathname, {shell: request.url});},
  match: async path => entries.get(path)
};
const context = {
  URL, Request: class {constructor(path, options) {this.url = 'https://app.test' + path; this.cache = options.cache;}},
  self: {location: {origin: 'https://app.test'}, addEventListener: (name, handler) => handlers[name] = handler,
    skipWaiting: async () => {}, clients: {claim: async () => {}}},
  caches: {open: async () => cache, keys: async () => ['mr-dmi-shell-old','unrelated'], delete: async name => deleted.push(name)},
  fetch: async request => {requests.push(request); if (offline) throw Error('offline'); return {network: true};}
};
vm.runInNewContext(fs.readFileSync('sw.js','utf8'), context);
async function lifecycle(name) {let pending; handlers[name]({waitUntil: p => pending=p}); await pending;}
async function get(path, method='GET') {
  let pending; handlers.fetch({request: {url: 'https://app.test'+path, method},respondWith: p => pending=p});
  return pending === undefined ? undefined : await pending;
}
(async () => {
  await lifecycle('install'); await lifecycle('activate');
  assert.deepEqual(deleted, ['mr-dmi-shell-old']);
  assert.equal(entries.size,5);
  offline=true;
  assert.ok((await get('/')).shell); assert.ok((await get('/identification.js')).shell);
  assert.equal(requests.length,0, 'cached launch must not wait for any network request');
  for (const path of ['/api/search?q=patient','/api/compare','/?patient=secret','/sw.js','/unknown']) {
    assert.equal(await get(path),undefined,'private or unknown URLs must bypass shell cache');
  }
  assert.equal(await get('/', 'POST'),undefined);
  entries.delete('/icon-192.png');
  await assert.rejects(get('/icon-192.png'),/offline/);
  const html=fs.readFileSync('index.html','utf8');
  assert.ok(!/<script src="https:\/\//.test(html),'OCR engines must not block initial page load');
  console.log('Launch checks passed: cached home and engine, offline, network-only API, no blocking OCR.');
})().catch(error => {console.error(error);process.exitCode=1;});
