import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../server.js';
import User from '../../models/userModel.js';
import Item from '../../models/itemModel.js';
import Swap from '../../models/swapModel.js';
import jwt from 'jsonwebtoken';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Swap.deleteMany({});
  await Item.deleteMany({});
  await User.deleteMany({});
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

describe('Dashboard Routes', () => {
  let user, token;

  beforeEach(async () => {
    user = await User.create({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    token = generateToken(user._id);
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard stats', async () => {
      // Create some data
      await Item.create({
        name: 'Item 1',
        description: 'Description',
        owner: user._id,
        category: new mongoose.Types.ObjectId(),
        images: ['img.jpg'],
        condition: 'New',
        type: 'Trade',
        desiredItem: 'Something',
      });

      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      // Adjust expectations based on what getDashboardStats actually returns
      // Assuming it returns counts or similar
      expect(res.body).toHaveProperty('totalListings');
      expect(res.body.totalListings).toBe(1); 
    });

    it('should fail without auth', async () => {
      const res = await request(app).get('/api/dashboard');
      expect(res.statusCode).toBe(401);
    });
  });
});
