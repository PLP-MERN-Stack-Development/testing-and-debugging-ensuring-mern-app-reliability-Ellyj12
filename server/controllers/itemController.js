import { validationResult } from "express-validator";
import Item from "../models/itemModel.js";
import Category from "../models/categoryModel.js";
import mongoose from "mongoose";


export const createItem = async (req, res, next) => {

 
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {

    
    
    const { name, description, category, type, condition, durationInDays, desiredItem,desiredCategory, } =
      req.body;
 
    let listingDuration = new Date();
    listingDuration.setDate(
      listingDuration.getDate() + (parseInt(durationInDays) || 14)
    );


    const images =
      req.files?.map((file) => file.path || file.secure_url || file.url || null).filter(Boolean) || [];

    const newItem = new Item({
      name,
      description,
      category,
      condition,
      desiredItem,
      desiredCategory,
      type,
      location: req.user.location,
      owner: req.user._id,
      listingDuration,
      images,
    });
      
    

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    next(error);
  }
};


export const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await item.deleteOne();
    res.json({ message: "Item removed" });
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate("owner", "name username")
      .populate("category", "name")
      .populate("desiredCategory", "name");

    if (!item) {
      const error = new Error("Item not found");
      error.statusCode = 404;
      throw error;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const getItems = async (req, res, next) => {
  try {
    const { id, category, owner, type, condition, search, page, limit, sortBy } =
      req.query;

    if (id) {
      const item = await Item.findById(id).populate("owner", "name username");
      if (!item) {
        const error = new Error("Item not found");
        error.statusCode = 404;
        return next(error);
      }
      return res.json(item);
    }

    const filter = { isAvailable: true };

    if (category) {
      const catStr = String(category);

      if (catStr.includes(",")) {
        const parts = catStr.split(",").map((s) => s.trim()).filter(Boolean);
        const allIds = parts.every((p) => mongoose.Types.ObjectId.isValid(p));
        if (allIds) {
          filter.category = { $in: parts };
        } else {
   
          const regexes = parts.map(p => new RegExp(`^${p}$`, 'i'));
          const docs = await Category.find({ 
            $or: regexes.map(regex => ({ name: regex }))
          });
          filter.category = { $in: docs.map((d) => d._id) };
        }
      } else if (mongoose.Types.ObjectId.isValid(catStr)) {
        filter.category = catStr;
      } else {
     
        const categoryDoc = await Category.findOne({ name: new RegExp(`^${catStr}$`, 'i') });
        if (categoryDoc) filter.category = categoryDoc._id;
        else filter.category = null;
      }
    }

    if (owner) filter.owner = owner;
    if (type) filter.type = type;
    if (condition) {
      const condStr = String(condition);
      if (condStr.includes(",")) {
        filter.condition = { $in: condStr.split(",").map((c) => c.trim()).filter(Boolean) };
      } else {
        filter.condition = condStr;
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    let sortOption = {};
    if (sortBy === "latest") sortOption = { createdAt: -1 };
    else if (sortBy === "oldest") sortOption = { createdAt: 1 };

    const items = await Item.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize)
      .populate("owner", "name username");

    const totalItems = await Item.countDocuments(filter);

    res.json({
      page: pageNumber,
      totalPages: Math.ceil(totalItems / pageSize),
      totalItems,
      items,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyItems = async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .populate("category", "name");
    res.json(items);
  } catch (error) {
    next(error);
  }
};
