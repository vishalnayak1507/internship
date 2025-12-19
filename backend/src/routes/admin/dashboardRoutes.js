// backend/src/routes/dashboardRoutes.js
import express from 'express';
import { getTicketTrends, getDashboardOverview, getTicketsBySource, getTicketsByStatus } from '../../controllers/admin/dashboardController.js';
import { authMiddleware_cookie,adminMiddleware } from '../../middlewares/auth/authMiddleware.js';

const router = express.Router();

// Secure these routes to admin and managers only
router.get('/trend',authMiddleware_cookie, adminMiddleware,getTicketTrends);
// For testing, you can remove protect/authorize temporarily if needed:
// router.get('/trend', getTicketTrends);
router.get('/overview',authMiddleware_cookie,adminMiddleware, getDashboardOverview);
// router.get('/overview', protect, authorize('admin', 'manager'), getDashboardOverview);
router.get('/status-summary',authMiddleware_cookie,adminMiddleware, getTicketsByStatus);

router.get('/by-source', authMiddleware_cookie,adminMiddleware, getTicketsBySource);
export default router;