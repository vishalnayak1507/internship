import express from 'express';
import { getTicketDiscussionHistory, addTicketDiscussionReply } from '../../controllers/admin/adminticketdiscussion.js';
// import { authenticate } from '../middleware/authMiddleware.js'; // adjust path as needed

const router = express.Router();

// Get all discussions for a ticket
router.get('/:ticketNumber', getTicketDiscussionHistory);

// Add a reply to a ticket discussion
router.post('/:ticketNumber/reply', addTicketDiscussionReply);

export default router;