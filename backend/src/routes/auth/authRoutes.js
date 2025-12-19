import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  getAllAnalysts
} from '../../controllers/auth/authController.js';
import { getAllTickets } from "../../controllers/admin/ticketController.js";
import { adminMiddleware, authMiddleware_cookie } from '../../middlewares/auth/authMiddleware.js';
import {
  validateRegistration,
  validateLogin
} from '../../middlewares/validationMiddleware.js';

const router = express.Router();

// Public routes

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

router.get('/validate', authMiddleware_cookie, (req, res) => {
  res.status(200).json({ success: true, message: 'User is authenticated' });
});

// Protected routes
router.get('/profile', authMiddleware_cookie, getProfile);
router.put('/profile', authMiddleware_cookie, updateProfile);

// Logout route - use auth middleware to get user info if available, but allow non-authenticated logouts
router.post('/logout', authMiddleware_cookie, logout);

router.get("/analysts", authMiddleware_cookie, adminMiddleware, getAllAnalysts);
router.get("/ticketdet",authMiddleware_cookie,adminMiddleware, getAllTickets);
export default router;
