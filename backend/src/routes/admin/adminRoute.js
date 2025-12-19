import express from "express";
import { authMiddleware_cookie, userExistMiddleware } from "../../middlewares/auth/authMiddleware.js";
import { does_admin_exist } from "../../controllers/admin/adminController.js";

const router = express.Router();

router.get("/admin/:userId",authMiddleware_cookie,userExistMiddleware,does_admin_exist)

export default router;