import express from "express"
import { authMiddleware_cookie,adminMiddleware} from "../../middlewares/auth/authMiddleware.js"
import { access_maker_route, maker_entry,get_my_tickets, get_ticketmasters } from "../../controllers/maker/makerController.js"
import isMaker from "../../middlewares/maker/isMakerMiddleware.js"

const router = express.Router()

router.get("/manualentry",authMiddleware_cookie,access_maker_route)
router.post("/manualentry",authMiddleware_cookie,maker_entry)
router.get("/my-tickets", authMiddleware_cookie, get_my_tickets);
router.get("/ticketmasters", authMiddleware_cookie, get_ticketmasters) 

export default router
