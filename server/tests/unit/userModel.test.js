import User from '../../models/userModel.js';

describe('User model - unit tests', () => {
  test('hashes password on save and matchPassword works', async () => {
    const raw = 'Password1!';

    const user = await User.create({
      name: 'Unit Tester',
      email: 'unittest@example.com',
      password: raw,
      username: 'unittest01'
    });

    // password should be hashed (not equal to raw)
    expect(user.password).not.toBe(raw);

    // matchPassword should return true for correct password
    const ok = await user.matchPassword(raw);
    expect(ok).toBe(true);

    // and false for incorrect password
    const bad = await user.matchPassword('wrongpassword');
    expect(bad).toBe(false);
  });

  test('validateSync enforces required fields and email format', () => {
    // Provide an invalid email only, omit other required fields
    const u = new User({ email: 'not-an-email' });

    const err = u.validateSync();
    expect(err).toBeDefined();

    // Email uses custom validator message
    expect(err.errors).toHaveProperty('email');
    expect(err.errors.email.message).toMatch(/Invalid email format/);

    // Missing required fields should produce errors
    expect(err.errors).toHaveProperty('name');
    expect(err.errors).toHaveProperty('password');
    expect(err.errors).toHaveProperty('username');
  });
});
