import express from "express";
import { authMiddleware_cookie } from "../../middlewares/auth/authMiddleware.js";
import {
  getMyTickets,
  resolveTicket,
  getTicketDiscussions,
  getResolvedTicketsByAnalyst,
} from "../../controllers/analyst/analystController.js";
import isAnalyst from "../../middlewares/analyst/isAnalystMiddleware.js";
const router = express.Router();

//Route to check if an analyst exists
router.get("/", authMiddleware_cookie, isAnalyst, async (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Analyst exists", userId: req.user._id });
});
//Route to get all tickets assigned to an analyst
router.get("/my-tickets", authMiddleware_cookie, isAnalyst, getMyTickets);
//Route to handle conversation history of a ticket
router.get(
  "/ticket-discussions/:ticketNumber",
  authMiddleware_cookie,
  isAnalyst,
  getTicketDiscussions
);
//Route to handle Resolve ticket
router.put("/resolve/:ticketId", authMiddleware_cookie, isAnalyst, resolveTicket);
router.get(
  "/my-resolved-tickets",
  authMiddleware_cookie,
  isAnalyst,
  getResolvedTicketsByAnalyst
);

export default router;