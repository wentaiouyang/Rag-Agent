const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { index } = require('../utils/pineconeClient');
const { chunkText } = require('../utils/textChunker');
const { embedInBatches } = require('../utils/embeddingService');
const {
  readRegistry,
  addDocument,
  removeDocument,
  getDocument,
} = require('../utils/documentRegistry');
const { clearCache } = require('../controllers/agentController');

const router = express.Router();

const UPSERT_BATCH_SIZE = 100;

// Multer config: disk storage with sanitized filenames, 10MB limit
const uploadDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.md', '.txt', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('UNSUPPORTED_TYPE'));
    }
  },
});

// Extract text from uploaded file
async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.md' || ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }
  throw new Error('UNSUPPORTED_TYPE');
}

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const text = await extractText(req.file.path, req.file.originalname);

    // Guard against empty/unreadable PDFs
    if (!text || text.trim().length < 50) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Could not extract meaningful text from this file',
        code: 'PARSE_FAILED',
      });
    }

    const documentId = crypto.randomUUID();
    const chunks = chunkText(text);

    console.log(`Uploading "${req.file.originalname}": ${chunks.length} chunks`);

    const embeddings = await embedInBatches(chunks);

    const vectorIds = [];
    const vectors = chunks.map((chunk, i) => {
      const id = `${documentId}-chunk-${i}`;
      vectorIds.push(id);
      return {
        id,
        values: embeddings[i],
        metadata: {
          text: chunk,
          source: req.file.originalname,
          documentId,
        },
      };
    });

    // Batch upserts
    for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
      const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);
      await index.namespace('my-company-docs').upsert({ records: batch });
    }

    await addDocument({
      documentId,
      filename: req.file.originalname,
      filePath: req.file.path,
      chunkCount: chunks.length,
      vectorIds,
      createdAt: new Date().toISOString(),
      status: 'ready',
    });

    clearCache();

    res.status(200).json({
      documentId,
      filename: req.file.originalname,
      chunkCount: chunks.length,
      status: 'ready',
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up uploaded file on failure
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (error.message === 'EMBEDDING_FAILED') {
      return res
        .status(500)
        .json({ error: 'Embedding generation failed', code: 'EMBEDDING_FAILED' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/documents
router.get('/', (_req, res) => {
  const docs = readRegistry();
  res.status(200).json(
    docs.map((d) => ({
      documentId: d.documentId,
      filename: d.filename,
      chunkCount: d.chunkCount,
      createdAt: d.createdAt,
      status: d.status,
    })),
  );
});

// DELETE /api/documents/:documentId
router.delete('/:documentId', async (req, res) => {
  const { documentId } = req.params;
  const doc = getDocument(documentId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  try {
    // Delete vectors from Pinecone by ID array (Starter plan compatible)
    if (doc.vectorIds && doc.vectorIds.length > 0) {
      await index.namespace('my-company-docs').deleteMany(doc.vectorIds);
    }

    // Delete file from disk (soft failure on ENOENT)
    if (doc.filePath) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
        console.warn(`File already deleted: ${doc.filePath}`);
      }
    }

    await removeDocument(documentId);
    clearCache();

    res.status(200).json({ deleted: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Multer error handler
router.use((err, _req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File exceeds 10MB limit', code: 'FILE_TOO_LARGE' });
  }
  if (err.message === 'UNSUPPORTED_TYPE') {
    return res.status(400).json({
      error: 'Only .md, .txt, and .pdf files are supported',
      code: 'UNSUPPORTED_TYPE',
    });
  }
  next(err);
});

module.exports = router;
