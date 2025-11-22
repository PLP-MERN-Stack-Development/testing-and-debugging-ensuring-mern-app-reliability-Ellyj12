import express from 'express';
const router = express.Router();
import { protect } from '../middlewear/authMiddlewear.js';
import { validateItem } from '../middlewear/validation/itemValidation.js';
import { createItem, getItems, getMyItems, deleteItem, getItemById } from '../controllers/itemController.js';

import upload from '../middlewear/uploads.js';



router.get("/", getItems);
router.get("/my-items", protect, getMyItems);
router.get("/:id", getItemById);
router.post('/create', protect, upload.array('images',5), validateItem, createItem);
router.delete('/:id', protect, deleteItem);

export default router