import Swap from "../models/swapModel.js";
import User from "../models/userModel.js";
import Item from "../models/itemModel.js";
import { generateCode } from "../utils/codeGenerator.js";
import bcrypt from "bcryptjs";

// ------------------- Helper Functions -------------------

const swapToSafeObject = (swap) => {
  const obj = swap.toObject();
  delete obj.codes; // hide codes from API responses
  return obj;
};

const isUserParticipant = (swap, userId) => {
  const uid = userId.toString();
  return swap.owner.toString() === uid || swap.initiator.toString() === uid;
};

const isSwapMutable = (swap) => {
  return !["Completed", "Declined", "Cancelled"].includes(swap.status);
};

const getUserCodeEntry = (swap, userId) =>
  swap.codes.find((c) => c.user.toString() === userId.toString());

// ------------------- Controllers -------------------

// Create a swap request
export const createSwap = async (req, res, next) => {
  try {
    const { ownerItemID, initiatorItemID } = req.body;
    const initiatorID = req.user._id;

    if (!ownerItemID) {
      return res
        .status(400)
        .json({ success: false, message: "Owner item is required" });
    }

    const ownerItem = await Item.findById(ownerItemID);
    
    if (!ownerItem) {
      return res
        .status(404)
        .json({ success: false, message: "Owner item not found" });
    }

    // For "Free" items, initiatorItem is optional
    const isFreeItem = ownerItem.type === "Free";
    
    if (!isFreeItem && !initiatorItemID) {
      return res
        .status(400)
        .json({ success: false, message: "Initiator item is required for trade swaps" });
    }

    let initiatorItem = null;
    if (initiatorItemID) {
      initiatorItem = await Item.findById(initiatorItemID);
      if (!initiatorItem) {
        return res
          .status(404)
          .json({ success: false, message: "Initiator item not found" });
      }
    }

    const existingSwap = await Swap.findOne({
      $or: [
        { ownerItem: ownerItemID, initiatorItem: initiatorItemID },
        { ownerItem: initiatorItemID, initiatorItem: ownerItemID },
      ],
      status: { $in: ["Pending", "Accepted"] },
    });

    if (existingSwap) {
      return res.status(400).json({
        success: false,
        message: "A swap between these items already exists or is in progress.",
      });
    }

    const swap = await Swap.create({
      owner: ownerItem.owner,
      initiator: initiatorID,
      ownerItem: ownerItem._id,
      initiatorItem: initiatorItem?._id || null,
      status: "Pending",
      type: ownerItem.type,
    });

    return res.status(201).json({
      success: true,
      message: "Swap request created successfully",
      swap: swapToSafeObject(swap),
    });
  } catch (err) {
    next(err);
  }
};

// Accept a swap
export const acceptSwap = async (req, res, next) => {
  try {
    const swap = await Swap.findById(req.params.id).populate("owner initiator");
    if (!swap)
      return res
        .status(404)
        .json({ success: false, message: "Swap not found" });

    const userId = req.user._id.toString();
    if (swap.owner._id.toString() !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not allowed to accept this swap" });
    }

    if (!["Pending"].includes(swap.status)) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Swap cannot be accepted (status: ${swap.status})`,
        });
    }

    swap.status = "Accepted";

    // Generate codes if not already present
    // if (!swap.codes || swap.codes.length === 0) {
    //   const participants = [swap.owner._id, swap.initiator._id];
    //   const rawCodesToReturn = {};

    //   for (const p of participants) {
    //     const rawCode = generateCode();
    //     const hashedCode = await bcrypt.hash(rawCode, 10);
    //     swap.codes.push({ user: p, hashedCode });
    //     rawCodesToReturn[p.toString()] = rawCode;
    //   }
        if (!swap.codes || swap.codes.length === 0) {
      const participants = [swap.owner._id, swap.initiator._id];
      const rawCodesToReturn = {};

      for (const p of participants) {
        const rawCode = generateCode();
        swap.codes.push({ user: p, code: rawCode });

        // Store raw code to return for testing
        rawCodesToReturn[p.toString()] = rawCode;
      }

      await swap.save();

      return res.json({
        success: true,
        message: "Swap accepted (testing: showing both codes)",
        swap: swapToSafeObject(swap),
        codes: {
          owner: rawCodesToReturn[swap.owner._id.toString()],
          initiator: rawCodesToReturn[swap.initiator._id.toString()],
        },
      });
    }

    // Codes already exist
    return res.json({
      success: true,
      message: "Swap already accepted",
      swap: swapToSafeObject(swap),
    });
  } catch (err) {
    next(err);
  }
};

// Decline a swap
export const declineSwap = async (req, res, next) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap)
      return res
        .status(404)
        .json({ success: false, message: "Swap not found" });

    const userId = req.user._id.toString();
    if (swap.owner.toString() !== userId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized to decline this swap",
        });
    }

    if (!isSwapMutable(swap) || swap.status === "Accepted") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Swap cannot be declined in current state",
        });
    }

    swap.status = "Declined";
    await swap.save();

    return res
      .status(200)
      .json({ success: true, message: "Swap declined successfully" });
  } catch (err) {
    next(err);
  }
};

// Cancel a swap
export const cancelSwap = async (req, res, next) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap)
      return res
        .status(404)
        .json({ success: false, message: "Swap not found" });

    const userId = req.user._id.toString();
    if (!isUserParticipant(swap, userId)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized to cancel this swap",
        });
    }

    if (!isSwapMutable(swap)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "This swap can no longer be cancelled",
        });
    }

    swap.status = "Cancelled";

    await swap.save();

    return res
      .status(200)
      .json({ success: true, message: "Swap cancelled successfully" });
  } catch (err) {
    next(err);
  }
};

// Complete a swap with code confirmation
export const completeSwap = async (req, res, next) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap)
      return res
        .status(404)
        .json({ success: false, message: "Swap not found" });

    const userId = req.user._id.toString();

    const { code } = req.body;

    if (!isUserParticipant(swap, userId)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not permitted to complete this swap",
        });
    }

    if (swap.status !== "Accepted") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only accepted swaps can be completed",
        });
    }

    // Logic: User A enters User B's code to confirm they met User B.
    const otherUserId = swap.owner.toString() === userId ? swap.initiator : swap.owner;
    const codeEntry = getUserCodeEntry(swap, otherUserId);
    
    if (!codeEntry)
      return res
        .status(400)
        .json({ success: false, message: "No code found for the other user" });

    const isMatch = code === codeEntry.code;
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid code" });

    // If I (User A) entered User B's code correctly, then *I* have confirmed the swap.
    if (swap.owner.toString() === userId) swap.confirmedByOwner = true;
    else swap.confirmedByInitiator = true;

    if (swap.confirmedByOwner && swap.confirmedByInitiator)
      swap.status = "Completed";

    if (swap.status === "Completed") {
      const ownerUser = await User.findById(swap.owner);
      const initiatorUser = await User.findById(swap.initiator);

      if (swap.type === "Trade") {
        ownerUser.points += 3;
        initiatorUser.points += 3;
      } else if (swap.type === "Free") {
        ownerUser.points += 5;
        initiatorUser.points -= 2;
      }

      // Mark items as unavailable instead of deleting
      await Promise.all([
        ownerUser.save(),
        initiatorUser.save(),
        Item.findByIdAndUpdate(swap.ownerItem, { isAvailable: false }),
        Item.findByIdAndUpdate(swap.initiatorItem, { isAvailable: false })
      ]);
    }

    await swap.save();

    return res.status(200).json({
      success: true,
      message:
        swap.status === "Completed"
          ? "Swap completed successfully!"
          : "Code confirmed. Waiting for the other user.",
      swap: swapToSafeObject(swap),
    });
  } catch (err) {
    next(err);
  }
};

// Get current user swaps (listings & requests)
export const getMySwaps = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const swaps = await Swap.find({
      $or: [{ owner: userId }, { initiator: userId }],
    })
      .populate("owner initiator", "username email")
      .populate("ownerItem initiatorItem", "name description type images");

    const listings = swaps
      .filter((s) => s.owner._id.toString() === userId)
      .map(swapToSafeObject);
    const requests = swaps
      .filter((s) => s.initiator._id.toString() === userId)
      .map(swapToSafeObject);

    return res.status(200).json({ success: true, listings, requests });
  } catch (err) {
    next(err);
  }
};
