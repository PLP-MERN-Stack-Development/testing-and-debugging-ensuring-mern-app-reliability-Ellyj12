import mongoose from "mongoose";
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

const itemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // Fast profile lookups
    name: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String], required: true },
    condition: { type: String, enum: ["New", "Like New", "Used", "Damaged"] },
    type: { type: String, enum: ['Trade', 'Free'], required: true }, // Index added below
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    desiredItem: { type: String, required: true },
    desiredCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    listingDuration: { type: Date, default: () => Date.now() + TWO_WEEKS },
    createdAt: { type: Date, default: Date.now }, // Index added below for sorting
    isAvailable: { type: Boolean, default: true }, // Index added below
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
      },
    },
  },
  { timestamps: true }
);

// --- CRITICAL INDEXES ---

// 1. Geospatial Index (Already present, kept it)
itemSchema.index({ location: "2dsphere" });

// 2. Search Bar Support (Allows searching name & description)
itemSchema.index({ name: "text", description: "text" });

// 3. Category Browsing (e.g. "Show me available items in Furniture")
itemSchema.index({ category: 1, isAvailable: 1 });

// 4. Type Browsing (e.g. "Show me all Free stuff")
itemSchema.index({ type: 1, isAvailable: 1 });

// 5. Feed Sorting (e.g. "Newest items first")
itemSchema.index({ createdAt: -1 });

// ... schema definition ...
const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);
export default Item;