
// src/routes/CartOrderRoutes/OrderRoutes.js
import express from 'express';
import { protect, userProtect } from '../../middlewares/AuthMiddleware.js';
import { validator } from '../../middlewares/ValidationMiddleware.js';

import {
  createOrder,
  getOrderHistory,
  cancelOrder
} from '../../controllers/CartOrderControllers/OrderController.js';

const router = express.Router();

router.use(protect, userProtect);


router.post('/checkout', 
  validator('orderSchemas.create'), 
  createOrder
);
router.get('/orderHistory', getOrderHistory);
router.put('/:id/cancel', cancelOrder);

export default router;