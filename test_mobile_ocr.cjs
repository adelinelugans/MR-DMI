// Offline regression tests for browser-side decoding and lazy PDF OCR.
// These mocks verify control flow, not recognition accuracy on real phones.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const html = fs.readFileSync('index.html', 'utf8');
const functions = [
  ['loadEngine', '  let installPrompt;'],
  ['ocrErrorMessage', '  async function createOcrWorker'],
  ['prepareOcrImage', '  function evidenceScore'],
  ['readPdf', "  $('read').addEventListener"]
].map(([name, end]) => {
  const start = html.indexOf('function ' + name);
  assert.ok(start >= 0 && html.indexOf(end, start) > start);
  return (['ocrErrorMessage','loadEngine'].includes(name) ? '' : 'async ') + html.slice(start, html.indexOf(end, start));
}).join('\n');
let dimensions = [4800, 2400], decodeFails = false, readFails = false, hasContext = true;
const draws = [];
const context = {
  engineLoads: new Map(), setTimeout, clearTimeout,
  window: {}, documentEpoch: 7,
  $: () => ({textContent: ''}),
  FileReader: class {
    readAsDataURL() { if (readFails) this.onerror(); else {this.result='data:image/jpeg;base64,fake'; this.onload();} }
  },
  Image: class {
    set src(value) { this.naturalWidth=dimensions[0]; this.naturalHeight=dimensions[1]; decodeFails ? this.onerror() : this.onload(); }
  },
  document: {createElement: () => ({
    width: 0, height: 0,
    getContext: () => hasContext ? {fillRect() {}, drawImage(...args) {draws.push(args);}} : null
  })},
  recognizeImage: async () => 'SCANNED TEST MODEL',
};
vm.createContext(context); vm.runInContext(functions, context);
(async () => {
  let canvas = await context.prepareOcrImage({});
  assert.equal(canvas.width, 2400); assert.equal(canvas.height, 1200);
  assert.equal(draws.length, 1);
  dimensions=[600, 300]; canvas=await context.prepareOcrImage({});
  assert.equal(canvas.width, 600); assert.equal(canvas.height, 300);
  decodeFails=true; await assert.rejects(context.prepareOcrImage({}), /JPEG ou PNG/); decodeFails=false;
  readFails=true; await assert.rejects(context.prepareOcrImage({}), /Impossible de lire/); readFails=false;
  dimensions=[0, 0]; await assert.rejects(context.prepareOcrImage({}), /vide/); dimensions=[600,300];
  hasContext=false; await assert.rejects(context.prepareOcrImage({}), /préparer/); hasContext=true;
  assert.match(context.ocrErrorMessage(undefined), /sans préciser/);
  assert.match(context.ocrErrorMessage('undefined'), /sans préciser/);
  assert.equal(context.ocrErrorMessage('worker failed'), 'worker failed');
  let workers=0, renders=0, scanned=false, pages=1;
  context.pdfjsLib = context.window.pdfjsLib = {
    GlobalWorkerOptions: {}, getDocument: () => ({promise: Promise.resolve({
      numPages: pages, getPage: async () => ({
        getTextContent: async () => ({items: [{str: scanned ? '' : 'FICTIONAL TEST DOCUMENT WITH ENOUGH EMBEDDED TEXT'}]}),
        getViewport: () => ({width: 600,height: 300}), render: () => {renders++; return {promise: Promise.resolve()};}
      })
    })})
  };
  const file={arrayBuffer: async () => new ArrayBuffer(0)};
  const worker=async () => {workers++; return {};};
  assert.match(await context.readPdf(file,worker,7), /FICTIONAL/);
  assert.equal(workers,0); assert.equal(renders,0);
  scanned=true; assert.equal(await context.readPdf(file,worker,7),'SCANNED TEST MODEL');
  assert.equal(workers,1); assert.equal(renders,1);
  context.documentEpoch=8; assert.equal(await context.readPdf(file,worker,7),''); assert.equal(workers,1);
  context.documentEpoch=7; pages=11; await assert.rejects(context.readPdf(file,worker,7), /10 pages/);
  console.log('Mobile OCR regression checks passed (decoding, errors, lazy PDF, stale dossier).');
})().catch(error => {console.error(error);process.exitCode=1;});

require('./test_launch.cjs');
