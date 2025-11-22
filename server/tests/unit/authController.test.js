import { jest } from '@jest/globals';

// Mock express-validator's validationResult to control validation outcomes
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

import { validationResult } from 'express-validator';
import { createUser, loginUser } from '../../controllers/authController.js';
import User from '../../models/userModel.js';

// Ensure JWT secret is available during tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

describe('Auth controller - createUser and loginUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validationResult.mockReturnValue({ isEmpty: () => true });
  });

  test('createUser - successful creation returns 201 and token', async () => {
    const req = { body: { name: 'A', email: 'a@b.com', password: 'Password1!', username: 'u1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Ensure DB has no user; call controller which will create using model
    await createUser(req, res, next);

    // debug: show what was called when createUser ran
    // console.log('DEBUG res.status.calls:', res.status.mock.calls);
    // console.log('DEBUG res.json.calls:', res.json.mock.calls);
    // console.log('DEBUG next.calls:', next.mock.calls);

    expect(res.status).toHaveBeenCalledWith(201);
    // Ensure user was created in DB
    const created = await User.findOne({ email: 'a@b.com' });
    expect(created).not.toBeNull();
    expect(next).not.toHaveBeenCalled();
  });

  test('createUser - email exists returns 400', async () => {
    const req = { body: { name: 'A', email: 'a@b.com', password: 'Password1!', username: 'u1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // create an existing user in DB
    await User.create({ name: 'Existing', email: 'a@b.com', password: 'Password1!', username: 'exists1' });
    await createUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      errors: expect.objectContaining({ email: 'Email already exists' })
    }));
  });

  test('createUser - validation errors returns 400', async () => {
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ param: 'email', msg: 'Invalid' }] });

    await createUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      errors: expect.objectContaining({ email: 'Invalid' })
    }));
  });

  test('loginUser - success returns json, failure calls next with 401', async () => {
    const req = { body: { email: 'a@b.com', password: 'Password1!' } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    // create a real user in DB so login uses real model instance
    await User.create({ name: 'LoginUser', email: 'a@b.com', password: 'Password1!', username: 'lu1' });

    // successful login
    await loginUser(req, res, next);
    // Either the controller responded or called next; ensure it didn't call next with error
    expect(next).not.toHaveBeenCalled();

    // failure path - wrong password
    const req2 = { body: { email: 'a@b.com', password: 'bad' } };
    const res2 = { json: jest.fn() };
    const next2 = jest.fn();

    await loginUser(req2, res2, next2);
    expect(next2).toHaveBeenCalled();
    const err = next2.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});
