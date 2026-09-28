import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { requireAuth } from './auth';

const router = Router();
router.use(requireAuth);

const STORAGE_ROOT = path.join(process.cwd(), 'private_storage');
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/plain',
  'text/markdown',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

// Upload a private file (base64 encoded payload)
router.post('/upload', (req: Request, res: Response) => {
  try {
    const { fileName, mimeType, base64Data, category } = req.body;
    const userId = req.user!.id;

    if (!fileName || !base64Data || !mimeType) {
      return res.status(400).json({ error: 'fileName, mimeType, and base64Data are required' });
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({ error: `Unsupported file type: ${mimeType}. Allowed: PDF, PNG, JPG, TXT` });
    }

    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeCategory = ['certificates', 'documents', 'projects'].includes(category) ? category : 'documents';

    const userDir = path.join(STORAGE_ROOT, userId, safeCategory);
    fs.mkdirSync(userDir, { recursive: true });

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File exceeds 10MB size limit' });
    }

    const uniquePrefix = crypto.randomUUID().slice(0, 8);
    const targetFileName = `${uniquePrefix}_${safeName}`;
    const targetFilePath = path.join(userDir, targetFileName);

    fs.writeFileSync(targetFilePath, buffer);

    const relativeStoragePath = `private_storage/${userId}/${safeCategory}/${targetFileName}`;

    return res.status(201).json({
      success: true,
      storagePath: relativeStoragePath,
      fileName: safeName,
      fileSize: buffer.length,
      mimeType,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

export default router;
