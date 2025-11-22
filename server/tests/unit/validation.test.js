import { validationResult } from 'express-validator';
import { validateUser } from '../../middlewear/validation/userCreationValidation.js';

// Helper to run validators against a mock request
const runValidators = async (validators, body) => {
  const req = { body };
  for (const validator of validators) {
    await validator.run(req);
  }
  return validationResult(req);
};

describe('Validation middleware - validateUser', () => {
  test('valid user passes validation', async () => {
    const res = await runValidators(validateUser, {
      name: 'Valid User',
      email: 'valid@example.com',
      password: 'Password1!',
      username: 'validuser'
    });

    expect(res.isEmpty()).toBe(true);
  });

  test('invalid email and short username produce errors', async () => {
    const res = await runValidators(validateUser, {
      name: 'V',
      email: 'not-an-email',
      password: 'short',
      username: 'u'
    });

    expect(res.isEmpty()).toBe(false);
    const arr = res.array();
    const fields = arr.map((e) => e.param || e.path);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password', 'username']));
  });
});
