import request from 'supertest';
import app from '../../server.js'; // Ensure server.js exports app
import User from '../../models/userModel.js';
import Item from '../../models/itemModel.js';
import Category from '../../models/categoryModel.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Mock the auth middleware if needed, or generate valid tokens
const userOne = {
  _id: new mongoose.Types.ObjectId(),
  name: 'User One',
  username: 'userone',
  email: 'userone@example.com',
  password: 'password123',
  location: { type: 'Point', coordinates: [0, 0] },
};

const userTwo = {
  _id: new mongoose.Types.ObjectId(),
  name: 'User Two',
  username: 'usertwo',
  email: 'usertwo@example.com',
  password: 'password123',
  location: { type: 'Point', coordinates: [0, 0] },
};

const categoryOne = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Electronics',
};

const itemOne = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Laptop',
  description: 'A good laptop',
  category: categoryOne._id,
  type: 'Trade',
  condition: 'Used',
  images: ['http://example.com/laptop.jpg'],
  owner: userOne._id,
  desiredItem: 'Phone',
  isAvailable: true,
};

const setupData = async () => {
  await User.create(userOne);
  await User.create(userTwo);
  await Category.create(categoryOne);
  await Item.create(itemOne);
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

describe('Item Routes', () => {
  beforeEach(async () => {
    await setupData();
  });

  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const res = await request(app).get('/api/items');
      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].name).toBe(itemOne.name);
    });

    it('should filter items by search term', async () => {
      const res = await request(app).get('/api/items?search=Laptop');
      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
    });

    it('should return empty list if search does not match', async () => {
      const res = await request(app).get('/api/items?search=NonExistent');
      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(0);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return item details', async () => {
      const res = await request(app).get(`/api/items/${itemOne._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe(itemOne.name);
    });

    it('should return 404 for non-existent item', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/items/${fakeId}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/items/create', () => {
    it('should create a new item', async () => {
      const token = generateToken(userOne._id);
      const newItem = {
        name: 'New Phone',
        description: 'Brand new phone',
        category: categoryOne._id.toString(),
        type: 'Trade',
        condition: 'New',
        desiredItem: 'Laptop',
        durationInDays: 14,
      };

      // Note: We are mocking file upload in jest.setupMocks.js or need to handle multipart
      // For simplicity in integration tests without real file upload, we might need to adjust the controller or use attach
      // However, since we mocked multer-storage-cloudinary, we can try sending fields.
      // But the route expects multipart/form-data.
      
      const res = await request(app)
        .post('/api/items/create')
        .set('Authorization', `Bearer ${token}`)
        .field('name', newItem.name)
        .field('description', newItem.description)
        .field('category', newItem.category)
        .field('type', newItem.type)
        .field('condition', newItem.condition)
        .field('desiredItem', newItem.desiredItem)
        .field('durationInDays', newItem.durationInDays)
        // .attach('images', 'tests/fixtures/test-image.jpg') // You would need a real file here
        // If the controller requires files, this might fail without a file.
        // Let's assume the controller handles empty files gracefully or we mock the middleware completely.
        // Based on controller: req.files?.map... || []
        
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe(newItem.name);
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete user item', async () => {
      const token = generateToken(userOne._id);
      const res = await request(app)
        .delete(`/api/items/${itemOne._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      const item = await Item.findById(itemOne._id);
      expect(item).toBeNull();
    });

    it('should not delete other user item', async () => {
      const token = generateToken(userTwo._id);
      const res = await request(app)
        .delete(`/api/items/${itemOne._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(401);
    });
  });
});
