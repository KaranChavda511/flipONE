// src/routes/SellerRoutes/SellerRoutes.js
import express from 'express';
import { protect, sellerProtect } from '../../middlewares/AuthMiddleware.js';
import { 
  addProduct,
  updateProduct,
  updateProductImages,
  deactivateProduct,
  getSellerProducts
} from '../../controllers/SellerController/SellerProductController.js';
import {
  getSellerOrders,
  updateOrderStatus
} from '../../controllers/SellerController/sellerOrderController.js';
import { productImageUpload } from '../../utils/FileUploads.js';
import { errorHandler } from '../../middlewares/ErrorMiddleware.js'
import {validator} from '../../middlewares/ValidationMiddleware.js'
// import { productSchemas } from '../services/Validation.js';



const router = express.Router();

router.use(protect, sellerProtect);


// Product Routes
router.get('/products', getSellerProducts);

router.post('/add-product', 
  productImageUpload, 
  validator("productSchemas.create"),
  addProduct,
  errorHandler ,  
);

router.patch('/products/:id', 
  productImageUpload,
  validator("productSchemas.update"),
  updateProduct,
  errorHandler
);

router.patch('/images',
  errorHandler, 
  productImageUpload,
  updateProductImages
);

router.delete('/products/:id', deactivateProduct);


// Order Routes
router.get('/allOrders', getSellerOrders);
router.patch('/orders/:orderId/items/:itemId', updateOrderStatus);

export default router;