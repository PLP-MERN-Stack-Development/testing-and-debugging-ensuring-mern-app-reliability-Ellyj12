import Category from "../models/categoryModel.js";

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}, "name _id").lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};
