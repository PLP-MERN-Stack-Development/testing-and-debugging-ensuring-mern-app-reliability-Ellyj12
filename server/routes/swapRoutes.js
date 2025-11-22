import express from "express";
const router = express.Router();
import {
  createSwap,
  acceptSwap,
  getMySwaps,
  declineSwap,
  cancelSwap,
  completeSwap,
} from "../controllers/swapController.js"; 
import { protect } from "../middlewear/authMiddlewear.js";

router.get("/my-swaps", protect, getMySwaps);
router.post("/create", protect, createSwap);
router.post("/:id/accept", protect, acceptSwap);
router.post("/:id/decline", protect, declineSwap);
router.post("/:id/cancel", protect, cancelSwap);
router.post("/:id/complete", protect, completeSwap);

export default router;
