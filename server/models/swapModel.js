import mongoose from "mongoose";

const codeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
});

const swapSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    initiatorItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: false,
      default: null,
    },
    type: {
      type: String,
      enum: ["Trade", "Free"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Declined", "Completed", "Cancelled"],
      default: "Pending",
    },
    codes: [codeSchema],
    confirmedByOwner: { type: Boolean, default: false },
    confirmedByInitiator: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// --- CRITICAL INDEXES ---

// 1. "My Incoming Swaps" Dashboard (Find swaps sent TO me)
swapSchema.index({ owner: 1, status: 1 });

// 2. "My Outgoing Swaps" Dashboard (Find swaps sent BY me)
swapSchema.index({ initiator: 1, status: 1 });

// 3. Conflict Checking (Prevent double-swapping the same item)
swapSchema.index({ ownerItem: 1, status: 1 });
swapSchema.index({ initiatorItem: 1, status: 1 });

// Check if "Swap" is already defined. If yes, use it. If no, create it.
const Swap = mongoose.models.Swap || mongoose.model("Swap", swapSchema);
export default Swap;