import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../server.js';
import User from '../../models/userModel.js';
import Item from '../../models/itemModel.js';
import Swap from '../../models/swapModel.js';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret';

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

describe('Swap Routes', () => {
  let user1, user2, token1, token2, item1, item2;

  beforeEach(async () => {
    user1 = await User.create({
      name: 'User One',
      username: 'userone',
      email: 'user1@example.com',
      password: 'password123',
    });
    token1 = generateToken(user1._id);

    user2 = await User.create({
      name: 'User Two',
      username: 'usertwo',
      email: 'user2@example.com',
      password: 'password123',
    });
    token2 = generateToken(user2._id);

    item1 = await Item.create({
      name: 'Item One',
      description: 'Description One',
      owner: user1._id,
      category: new mongoose.Types.ObjectId(),
      images: ['img1.jpg'],
      condition: 'New',
      type: 'Trade',
      desiredItem: 'Something',
    });

    item2 = await Item.create({
      name: 'Item Two',
      description: 'Description Two',
      owner: user2._id,
      category: new mongoose.Types.ObjectId(),
      images: ['img2.jpg'],
      condition: 'Used',
      type: 'Trade',
      desiredItem: 'Something else',
    });
  });

  describe('POST /api/swaps/create', () => {
    it('should create a swap request', async () => {
      const res = await request(app)
        .post('/api/swaps/create')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          initiatorItemID: item1._id,
          ownerItemID: item2._id,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.swap.initiator.toString()).toBe(user1._id.toString());
      expect(res.body.swap.owner.toString()).toBe(user2._id.toString());
      expect(res.body.swap.status).toBe('Pending');
    });

    it('should not create a swap if items are missing', async () => {
      const res = await request(app)
        .post('/api/swaps/create')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          initiatorItemID: item1._id,
        });

      expect(res.statusCode).toBe(400);
    });

    it('allows creating a free swap without an initiator item', async () => {
      const freeItem = await Item.create({
        name: 'Free Item',
        description: 'No trade required',
        owner: user2._id,
        category: new mongoose.Types.ObjectId(),
        images: ['img-free.jpg'],
        condition: 'Used',
        type: 'Free',
        desiredItem: 'Any',
      });

      const res = await request(app)
        .post('/api/swaps/create')
        .set('Authorization', `Bearer ${token1}`)
        .send({ ownerItemID: freeItem._id });

      expect(res.statusCode).toBe(201);
      expect(res.body.swap.type).toBe('Free');
      expect(res.body.swap.initiatorItem).toBeNull();
    });

    it('prevents creating duplicate swaps between the same items', async () => {
      await request(app)
        .post('/api/swaps/create')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          initiatorItemID: item1._id,
          ownerItemID: item2._id,
        })
        .expect(201);

      const duplicateRes = await request(app)
        .post('/api/swaps/create')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          initiatorItemID: item1._id,
          ownerItemID: item2._id,
        });

      expect(duplicateRes.statusCode).toBe(400);
      expect(duplicateRes.body.message).toMatch(/already exists/i);
    });
  });

  describe('POST /api/swaps/:id/accept', () => {
    it('should accept a swap request', async () => {
      const swap = await Swap.create({
        initiator: user1._id,
        owner: user2._id,
        initiatorItem: item1._id,
        ownerItem: item2._id,
        status: 'Pending',
        type: 'Trade'
      });

      const res = await request(app)
        .post(`/api/swaps/${swap._id}/accept`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.swap.status).toBe('Accepted');
    });

    it('should not allow requester to accept their own swap', async () => {
      const swap = await Swap.create({
        initiator: user1._id,
        owner: user2._id,
        initiatorItem: item1._id,
        ownerItem: item2._id,
        status: 'Pending',
        type: 'Trade'
      });

      const res = await request(app)
        .post(`/api/swaps/${swap._id}/accept`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/swaps/my-swaps', () => {
    it('should get swaps for the logged in user', async () => {
      await Swap.create({
        initiator: user1._id,
        owner: user2._id,

        it('returns existing codes when accepting an already accepted swap', async () => {
          const swap = await Swap.create({
            initiator: user1._id,
            owner: user2._id,
            initiatorItem: item1._id,
            ownerItem: item2._id,
            status: 'Pending',
            type: 'Trade'
          });

          const firstAccept = await request(app)
            .post(`/api/swaps/${swap._id}/accept`)
            .set('Authorization', `Bearer ${token2}`)
            .expect(200);

          const secondAccept = await request(app)
            .post(`/api/swaps/${swap._id}/accept`)
            .set('Authorization', `Bearer ${token2}`)
            .expect(200);

          expect(secondAccept.body.message).toMatch(/already accepted/i);
          expect(secondAccept.body.swap.status).toBe('Accepted');
          // ensure codes persisted between calls
          expect(firstAccept.body.codes.owner).toBeDefined();
          expect(firstAccept.body.codes.initiator).toBeDefined();
        });
        initiatorItem: item1._id,

      describe('POST /api/swaps/:id/decline', () => {
        it('allows the owner to decline a pending swap', async () => {
          const swap = await Swap.create({
            initiator: user1._id,
            owner: user2._id,
            initiatorItem: item1._id,
            ownerItem: item2._id,
            status: 'Pending',
            type: 'Trade'
          });

          const res = await request(app)
            .post(`/api/swaps/${swap._id}/decline`)
            .set('Authorization', `Bearer ${token2}`)
            .expect(200);

          expect(res.body.message).toMatch(/declined/i);
          const updated = await Swap.findById(swap._id);
          expect(updated.status).toBe('Declined');
        });

        it('prevents declining a swap that is already accepted', async () => {
          const swap = await Swap.create({
            initiator: user1._id,
            owner: user2._id,
            initiatorItem: item1._id,
            ownerItem: item2._id,
            status: 'Accepted',
            type: 'Trade'
          });

          const res = await request(app)
            .post(`/api/swaps/${swap._id}/decline`)
            .set('Authorization', `Bearer ${token2}`)
            .expect(400);

          expect(res.body.message).toMatch(/cannot be declined/i);
        });
      });

      describe('POST /api/swaps/:id/cancel', () => {
        it('allows a participant to cancel a pending swap', async () => {
          const swap = await Swap.create({
            initiator: user1._id,
            owner: user2._id,
            initiatorItem: item1._id,
            ownerItem: item2._id,
            status: 'Pending',
            type: 'Trade'
          });

          const res = await request(app)
            .post(`/api/swaps/${swap._id}/cancel`)
            .set('Authorization', `Bearer ${token1}`)
            .expect(200);

          expect(res.body.message).toMatch(/cancelled successfully/i);
          const updated = await Swap.findById(swap._id);
          expect(updated.status).toBe('Cancelled');
        });

        it('rejects cancellation attempts from non-participants', async () => {
          const outsider = await User.create({
            name: 'Outsider',
            username: 'outsider',
            email: 'outside@example.com',
            password: 'password123',
          });
          const outsiderToken = generateToken(outsider._id);

          const swap = await Swap.create({
            initiator: user1._id,
            owner: user2._id,
            initiatorItem: item1._id,
            ownerItem: item2._id,
            status: 'Pending',
            type: 'Trade'
          });

          const res = await request(app)
            .post(`/api/swaps/${swap._id}/cancel`)
            .set('Authorization', `Bearer ${outsiderToken}`)
            .expect(403);

          expect(res.body.message).toMatch(/not authorized/i);
        });
      });

      describe('POST /api/swaps/:id/complete', () => {
        it('requires matching codes and completes the trade after both confirmations', async () => {
          const swap = await Swap.create({
            initiator: user1._id,
            owner: user2._id,
            initiatorItem: item1._id,
            ownerItem: item2._id,
            status: 'Pending',
            type: 'Trade'
          });

          const acceptRes = await request(app)
            .post(`/api/swaps/${swap._id}/accept`)
            .set('Authorization', `Bearer ${token2}`)
            .expect(200);

          const ownerCode = acceptRes.body.codes.owner;
          const initiatorCode = acceptRes.body.codes.initiator;

          // Invalid code attempt
          await request(app)
            .post(`/api/swaps/${swap._id}/complete`)
            .set('Authorization', `Bearer ${token1}`)
            .send({ code: 'WRONG' })
            .expect(400);

          const initiatorConfirmation = await request(app)
            .post(`/api/swaps/${swap._id}/complete`)
            .set('Authorization', `Bearer ${token1}`)
            .send({ code: ownerCode })
            .expect(200);

          expect(initiatorConfirmation.body.message).toMatch(/waiting for the other user/i);

          const ownerConfirmation = await request(app)
            .post(`/api/swaps/${swap._id}/complete`)
            .set('Authorization', `Bearer ${token2}`)
            .send({ code: initiatorCode })
            .expect(200);

          expect(ownerConfirmation.body.message).toMatch(/completed successfully/i);

          const finalSwap = await Swap.findById(swap._id).lean();
          expect(finalSwap.status).toBe('Completed');
          expect(finalSwap.confirmedByOwner).toBe(true);
          expect(finalSwap.confirmedByInitiator).toBe(true);

          const [ownerUser, initiatorUser] = await Promise.all([
            User.findById(user2._id),
            User.findById(user1._id),
          ]);

          expect(ownerUser.points).toBe(13); // default 10 +3 for trade
          expect(initiatorUser.points).toBe(13);

          const [ownerItemFresh, initiatorItemFresh] = await Promise.all([
            Item.findById(item2._id),
            Item.findById(item1._id),
          ]);

          expect(ownerItemFresh.isAvailable).toBe(false);
          expect(initiatorItemFresh.isAvailable).toBe(false);
        });
      });
        ownerItem: item2._id,
        status: 'Pending',
        type: 'Trade'
      });

      const res = await request(app)
        .get('/api/swaps/my-swaps')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      // user1 is initiator, so it should be in requests
      expect(res.body.requests.length).toBe(1);
    });
  });
});
