// src/routes/AdminRoutes/AdminRoutes.js
import express from 'express';
import { protect, adminProtect } from '../../middlewares/AuthMiddleware.js';
import {
  getAllUsers,
  toggleUserStatus
} from '../../controllers/AdminController/AdminUserController.js';
import {
  getAllSellers,
  toggleSellerStatus
} from '../../controllers/AdminController/AdminSellerController.js';
import {
  createCategory,
  updateCategory,
  deleteCategory
} from '../../controllers/AdminController/CategoryController.js';
import {
  getSalesData,
  getUserStatistics,
  getProductStatistics
} from '../../controllers/AdminController/AnalyticsController.js';
import { validator } from '../../middlewares/ValidationMiddleware.js';

const router = express.Router();

router.use(protect, adminProtect);

// User Management
router.get('/allUsers', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);

// Seller Management
router.get('/allSellers', getAllSellers);
router.patch('/sellers/:id/toggle-status', toggleSellerStatus);

// Category Management
router.post('/add-categories', validator("categorySchemas.create"), createCategory);

router.patch(
  '/categories/:id',
  validator("categorySchemas.update"),
  updateCategory
);

router.delete(
  '/categories/:id',
  deleteCategory
);



// Analytics
router.get('/analytics/sales', getSalesData);
router.get('/analytics/users', getUserStatistics);
router.get('/analytics/products', getProductStatistics);

export default router;