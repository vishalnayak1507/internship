import express from "express";
import { 
  getTicketsByAnalyst,
  getInProgressTicketsCount,
  getResolvedTicketsCount 
} from "../../controllers/analyst/analystticketdetails.js";

const router = express.Router();

// GET /api/analysttickets/:userId
router.get("/:userId", getTicketsByAnalyst);

// GET /api/analysttickets/:userId/inprogress
router.get("/:userId/inprogress", getInProgressTicketsCount);

// GET /api/analysttickets/:userId/resolved
router.get("/:userId/resolved", getResolvedTicketsCount);

export default router;