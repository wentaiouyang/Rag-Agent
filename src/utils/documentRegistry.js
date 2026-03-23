const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = process.env.VERCEL
  ? '/tmp/documents.json'
  : path.join(__dirname, '../../data/documents.json');

// Promise-chain write queue to prevent concurrent write races
let writeQueue = Promise.resolve();

function readRegistry() {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read document registry, returning empty:', err.message);
    return [];
  }
}

function writeRegistrySync(documents) {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = REGISTRY_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(documents, null, 2), 'utf-8');
  fs.renameSync(tmpPath, REGISTRY_PATH);
}

function addDocument(entry) {
  writeQueue = writeQueue.then(() => {
    const docs = readRegistry();
    docs.push(entry);
    writeRegistrySync(docs);
  });
  return writeQueue;
}

function removeDocument(documentId) {
  writeQueue = writeQueue.then(() => {
    const docs = readRegistry();
    const filtered = docs.filter((d) => d.documentId !== documentId);
    writeRegistrySync(filtered);
  });
  return writeQueue;
}

function getDocument(documentId) {
  const docs = readRegistry();
  return docs.find((d) => d.documentId === documentId) || null;
}

module.exports = { readRegistry, addDocument, removeDocument, getDocument };
