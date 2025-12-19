import express from "express";
import User from "../../models/User.js";
const router = express.Router();

// Get all unique departments
router.get("/", async (req, res) => {
  try {
    const departments = await User.distinct("department");
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch departments" });
  }
});

export default router;