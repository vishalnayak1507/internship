import express from 'express';
import { updateAnalystPermission } from '../../controllers/admin/canuploadController.js';
// import { isAdmin } from '../middleware/auth.js'; // Optional: restrict to admin

const router = express.Router();

// ...existing routes...

// PATCH /api/users/:id/permission
router.patch('/:id/permission', /* isAdmin, */ updateAnalystPermission);

export default router;