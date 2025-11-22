import mongoose from 'mongoose';
import Item from '../../models/itemModel.js';

describe('Item Model', () => {
  it('should validate a valid item', async () => {
    const validItem = {
      name: 'Test Item',
      description: 'A test item description',
      images: ['http://example.com/image.jpg'],
      condition: 'New',
      type: 'Trade',
      category: new mongoose.Types.ObjectId(),
      desiredItem: 'Something else',
      owner: new mongoose.Types.ObjectId(),
    };
    const item = new Item(validItem);
    await expect(item.validate()).resolves.toBeUndefined();
  });

  it('should throw validation error if required fields are missing', async () => {
    const invalidItem = {
      name: 'Test Item',
      // Missing description, images, category, etc.
    };
    const item = new Item(invalidItem);
    await expect(item.validate()).rejects.toThrow();
  });

  it('should set default values', async () => {
    const item = new Item({
      name: 'Test Item',
      description: 'Desc',
      images: ['url'],
      condition: 'New',
      type: 'Trade',
      category: new mongoose.Types.ObjectId(),
      desiredItem: 'Desired',
      owner: new mongoose.Types.ObjectId(),
    });
    expect(item.isAvailable).toBe(true);
    expect(item.createdAt).toBeDefined();
  });
});
