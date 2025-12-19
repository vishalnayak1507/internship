import express from "express";
import { authMiddleware_cookie } from "../../middlewares/auth/authMiddleware.js";
import { maker_entry, access_maker_route,get_my_tickets} from "../../controllers/maker/makerController.js";

const router = express.Router();

// Token verification (for admin/analyst)
router.get("/verify", authMiddleware_cookie, access_maker_route);

// Ticket creation
router.post("/my-tickets-admin", authMiddleware_cookie, maker_entry);
router.get("/my-tickets-admin", authMiddleware_cookie, get_my_tickets);

export default router;