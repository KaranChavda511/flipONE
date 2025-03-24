import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../services/logger.js';

// Create uploads directory if it doesn't exist
export const publicDir = path.resolve('public');
export const uploadsDir = path.join(publicDir, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`Created uploads directory at ${uploadsDir}`);
}

const sanitizeName = (name) => {
  if (!name) return 'unknown'; // Handle undefined/null cases
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Remove special characters
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .toLowerCase()
    .substring(0, 50); // Limit filename length
};

// Generate secure filename
const generateFilename = (req, file) => {
  try {
    const { account } = req;
    const ext = path.extname(file.originalname);
    const random = Math.random().toString(36).slice(2, 8);
    const timestamp = Date.now();

    let identifier = 'unknown';
    if (account) {
      // Fallback to email if username is missing
      const newname = account.name || account.email.split('@')[0];
      
      switch (account.role) {
        case 'user':
          identifier = `user-${sanitizeName(newname)}`;
          break;
        case 'seller':
          // Use licenseID if available, fallback to username
          identifier = account.licenseID 
            ? `seller-${sanitizeName(newname )}`
            : `seller-${sanitizeName(newname )}`;
          break;
        case 'admin':
          identifier = `admin-${sanitizeName(newname)}`;
          break;
          default:
            identifier = `unknown-${timestamp}`;
      }
    }

    const prefix = file.fieldname === 'profileImage' ? 'profile' : 'product';
    return `${prefix}-${identifier}-${timestamp}-${random}${ext}`;
  } catch (error) {
    logger.error(`Filename generation failed: ${error.message}, , {
      stack: error.stack,
      account: req.account ? 'exists' : 'missing'
    }`);
    throw new Error('File upload processing failed');
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    try {
      cb(null, generateFilename(req, file));
    } catch (error) {
      cb(error);
    }
  }
});

// Enhanced file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG/PNG/WEBP allowed'));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const profileImageUpload = upload.single('profileImage');
export const productImageUpload = upload.array('images', 5); // Max 5 images
