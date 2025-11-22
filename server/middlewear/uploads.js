import multer from "multer";
import cloudinary from "../config/cloudinaryConfig.js";


import pkg from 'multer-storage-cloudinary';

let CloudinaryStorage = undefined;
if (pkg && typeof pkg === 'object' && 'CloudinaryStorage' in pkg) {
  CloudinaryStorage = pkg.CloudinaryStorage;
} else if (pkg && pkg.default && typeof pkg.default === 'object' && 'CloudinaryStorage' in pkg.default) {
  CloudinaryStorage = pkg.default.CloudinaryStorage;
} else if (typeof pkg === 'function') {
  CloudinaryStorage = pkg;
} else if (pkg && pkg.default && typeof pkg.default === 'function') {
  CloudinaryStorage = pkg.default;
}

if (!CloudinaryStorage) {
  throw new Error('Could not find CloudinaryStorage export from multer-storage-cloudinary');
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'swapper-items',
    allowed_formats: ['jpg', 'jpeg', 'png','webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

const upload = multer({ storage });

export default upload;
