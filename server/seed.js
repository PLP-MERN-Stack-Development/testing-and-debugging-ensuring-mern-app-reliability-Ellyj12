import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/userModel.js";
import Item from "./models/itemModel.js";
import Swap from "./models/swapModel.js";

dotenv.config();

const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/swapper";

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    // Clear previous data
    await User.deleteMany();
    await Item.deleteMany();
    await Swap.deleteMany();
    console.log("Previous users, items, and swaps deleted");

    // Placeholder categories (replace with real ones if you have them)
    const category1 = new mongoose.Types.ObjectId();
    const category2 = new mongoose.Types.ObjectId();

    // Create Users
    const ownerPassword = await bcrypt.hash("Owner123!", 10);
    const initiatorPassword = await bcrypt.hash("Init123!", 10);

    const owner = await User.create({
      name: "Owner Name",
      username: "OwnerUser",
      email: "owner@test.com",
      password: 'Owner123!'
    });

    const initiator = await User.create({
      name: "Initiator Name",
      username: "InitiatorUser",
      email: "initiator@test.com",
      password: 'Init123!'
    });

    console.log("Users created:");
    console.log({ ownerEmail: owner.email, password: "Owner123!" });
    console.log({ initiatorEmail: initiator.email, password: "Init123!" });

    // Create Items
    const ownerItem = await Item.create({
      owner: owner._id,
      name: "OwnerItem",
      description: "Item belonging to owner",
      images: ["https://via.placeholder.com/150"],
      condition: "Used",
      type: "Trade",
      category: category1,
      desiredItem: "Any similar item",
      desiredCategory: category2,
      listingDuration: new Date(Date.now() + TWO_WEEKS),
      location: { type: "Point", coordinates: [36.8219, -1.2921] },
      isAvailable: true
    });

    const initiatorItem = await Item.create({
      owner: initiator._id,
      name: "InitiatorItem",
      description: "Item belonging to initiator",
      images: ["https://via.placeholder.com/150"],
      condition: "Used",
      type: "Trade",
      category: category2,
      desiredItem: "Any similar item",
      desiredCategory: category1,
      listingDuration: new Date(Date.now() + TWO_WEEKS),
      location: { type: "Point", coordinates: [36.8219, -1.2921] },
      isAvailable: true
    });

    console.log("Items created");

    // Create Swap
    const swap = await Swap.create({
      owner: owner._id,
      initiator: initiator._id,
      ownerItem: ownerItem._id,
      initiatorItem: initiatorItem._id,
      status: "Pending",
      codes: []
    });

    console.log("Swap created:");
    console.log({
      swapId: swap._id.toString(),
      owner: owner.username,
      initiator: initiator.username
    });

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
