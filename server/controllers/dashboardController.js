import Item from "../models/itemModel.js";
import Swap from "../models/swapModel.js";
import User from "../models/userModel.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;


    const user = await User.findById(userId).select("points");

    const items = await Item.find({ owner: userId }).sort({ createdAt: -1 });
    const totalListings = items.length;
    const activeListingsCount = items.filter(item => item.isAvailable).length;


    const swaps = await Swap.find({
      $or: [{ initiator: userId }, { owner: userId }]
    })
    .sort({ createdAt: -1 })
    .populate("initiator", "name username profilePhoto")
    .populate("owner", "name username profilePhoto")
    .populate("initiatorItem", "name images")
    .populate("ownerItem", "name images");


    const pendingRequests = swaps.filter(
      (s) => s.owner._id.toString() === userId.toString() && s.status === "Pending"
    );

    res.json({
      points: user.points || 0,
      totalListings,
      activeListingsCount,
      listings: items,
      swaps: swaps,
      pendingRequests
    });


  } catch (error) {
    next(error);
  }
};
