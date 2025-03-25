// src/routes/UserRoutes/UserRoutes.js
import express from 'express';
import { protect, userProtect } from '../../middlewares/AuthMiddleware.js';
import {
  getUserProfile,
  updateProfile,
  updateprofilePic,
  
} from '../../controllers/UserControllers/UserController.js';
import { errorHandler } from '../../middlewares/ErrorMiddleware.js';
import { profileImageUpload } from '../../utils/FileUploads.js';
import {validator} from '../../middlewares/ValidationMiddleware.js'

const router = express.Router();


router.use(protect, userProtect);

// Define routes
router.get('/profile' , getUserProfile);
router.patch('/profile',validator("userSchemas.updateProfile"), updateProfile); 
router.patch('/profile/picture', 
  profileImageUpload,
  updateprofilePic
);



router.use(errorHandler);

export default router;