import { generateCode } from '../../utils/codeGenerator.js';

describe('generateCode', () => {
  test('generates a string of length 4 uppercase alphanum', () => {
    const code = generateCode();
    expect(typeof code).toBe('string');
    expect(code).toHaveLength(4);
    expect(code).toMatch(/^[A-Z0-9]{4}$/);
  });
});
