import { body } from "express-validator";
import Category from '../../models/categoryModel.js';

export const validateItem = [
    body('name')
    .notEmpty().withMessage('Item name is required')
    .isLength({max:50}).withMessage('Name cant be more than 50 characters'),

    body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({max:150}).withMessage('Description cant be more than 150 characters'),

    body('condition')
    .notEmpty().withMessage('Condition is required')
    .isIn(['New','Like New','Used','Damaged']),

    body('listingDuration')
    .optional().isInt({min:1,max:60}).withMessage('Listing duration must be between 1 and 60 days'),

    body('desiredItem')
    .notEmpty().withMessage('Desired items are required'),

    body('type')
    .isIn(['Free','Trade']).notEmpty().withMessage('Type of trade is required'),

    body('category')
  .isMongoId().withMessage('Category must be valid')
  .notEmpty().withMessage('Category is required')
  .custom(async (value) => {
    const categoryExists = await Category.findById(value);
    if (!categoryExists) {
      throw new Error('Category not found');
    }
    return true;
  }),






]