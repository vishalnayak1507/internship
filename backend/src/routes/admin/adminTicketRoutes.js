import express from "express";
import { adminExportTickets } from "../../controllers/admin/adminTicketController.js";
import { authMiddleware_cookie } from "../../middlewares/auth/authMiddleware.js";

const router = express.Router();

router.get("/export", authMiddleware_cookie, adminExportTickets);

export default router;