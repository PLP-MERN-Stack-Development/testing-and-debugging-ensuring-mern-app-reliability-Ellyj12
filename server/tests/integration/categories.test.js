import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../server.js';
import Category from '../../models/categoryModel.js';
import User from '../../models/userModel.js';
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
  await Category.deleteMany({});
  await User.deleteMany({});
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

describe('Category Routes', () => {
  let token;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true, // Assuming there's an admin check, though routes might be public
    });
    token = generateToken(user._id);
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      await Category.create({ name: 'Electronics', slug: 'electronics' });
      await Category.create({ name: 'Books', slug: 'books' });

      const res = await request(app).get('/api/categories');

      expect(res.statusCode).toBe(200);
      expect(res.body.categories.length).toBe(2);
    });
  });
});
