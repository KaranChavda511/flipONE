
// src/routes/CartOrderRoutes/CartRoutes.js
import express from 'express';
import { protect, userProtect } from '../../middlewares/AuthMiddleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../../controllers/CartOrderControllers/CartController.js';

const router = express.Router();

router.use(protect, userProtect);

router.get('/view', getCart);
router.post('/addIn', addToCart);
router.delete('/clear', clearCart);


router.patch('/updateItem/:itemId', updateCartItem);
router.delete('/deleteItems/:itemId', removeFromCart);


export default router;