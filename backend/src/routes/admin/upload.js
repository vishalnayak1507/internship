import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { handleExcelUpload } from '../../controllers/admin/uploadController.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only .csv, .xlsx, .xls files are allowed!'), false);
};
const upload = multer({ storage, fileFilter });

// POST /api/upload
router.post('/', upload.single('file'), handleExcelUpload);

export default router;