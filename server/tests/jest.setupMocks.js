// Mocks that must be in place before any modules are imported in tests

// Mock multer-storage-cloudinary to avoid Cloudinary dependency during tests
jest.mock('multer-storage-cloudinary', () => {
  return {
    CloudinaryStorage: class {
      constructor(opts) {
        this.opts = opts;
      }
    }
  };
});

// Optionally, mock cloudinary v2 if any code tries to call it during import
jest.mock('../config/cloudinaryConfig.js', () => ({
  __esModule: true,
  default: {
    uploader: {
      upload: async () => ({ secure_url: 'http://example.com/fake.jpg' }),
    },
  },
}));

// Mock logger to avoid import.meta usage and real file system operations in tests
jest.mock('../utils/logger.js', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
