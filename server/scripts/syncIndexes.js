import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/userModel.js";
import Item from "../models/itemModel.js";
import Swap from "../models/swapModel.js";
import Category from "../models/categoryModel.js";

const models = [
  { name: "User", model: User },
  { name: "Item", model: Item },
  { name: "Swap", model: Swap },
  { name: "Category", model: Category },
];

async function syncIndexes() {
  try {
    await connectDB();

    for (const { name, model } of models) {
      try {
        const result = await model.syncIndexes();
        console.log(`✅ Synced indexes for ${name}`, result);
      } catch (err) {
        console.error(`❌ Failed to sync indexes for ${name}:`, err);
      }
    }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

syncIndexes();
