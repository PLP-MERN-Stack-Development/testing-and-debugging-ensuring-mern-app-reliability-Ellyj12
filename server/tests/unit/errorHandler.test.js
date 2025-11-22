import { errorHandler } from '../../middlewear/errorHandler.js';

describe('Error handler normalization', () => {
  const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('handles express-validator errors array', () => {
    const res = makeRes();
    const err = { statusCode: 400, name: 'ValidationError', message: 'Validation failed', errors: [{ field: 'email', message: 'Invalid' }] };

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('errors');
  });

  test('handles Mongoose ValidationError', () => {
    const res = makeRes();
    const mongooseErr = new Error('Validation failed');
    mongooseErr.name = 'ValidationError';
    mongooseErr.errors = { email: { message: 'Invalid email' } };
    mongooseErr.statusCode = 400;

    errorHandler(mongooseErr, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.errors.length).toBeGreaterThan(0);
  });

  test('handles MulterError', () => {
    const res = makeRes();
    const multerErr = new Error('Too many files');
    multerErr.name = 'MulterError';
    multerErr.code = 'LIMIT_UNEXPECTED_FILE';

    errorHandler(multerErr, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('message');
  });

  test('handles generic errors', () => {
    const res = makeRes();
    const err = new Error('Something went wrong');

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('message');
  });
});
