// src/routes/UserRoutes/ProductRoutes.js
import express from 'express';
import {
  getAllActiveProducts,
  searchProducts,
  getProductDetails,
  getAllCategories
} from '../../controllers/UserControllers/ProductController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllActiveProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductDetails);
// Public endpoint to view categories
router.get('/categories', getAllCategories);

export default router;