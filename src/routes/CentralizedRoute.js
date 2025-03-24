// src/routes/index.js

import express from 'express';

// Import all route modules
import authRoutes from './AuthRoutes/AuthRoutes.js';         
import userRoutes from './UserRoutes/UserRoutes.js';         
import productRoutes from './UserRoutes/ProductRoutes.js';  
import cartRoutes from './CartOrderRoutes/CartRoutes.js';       
import orderRoutes from './CartOrderRoutes/OrderRoutes.js';       
import sellerRoutes from './SellerRoutes/SellerRoutes.js';     
import adminRoutes from './AdminRoutes/AdminRoutes.js';      

const centralizedRoute = express.Router();

/**
 * Centralized Route File for flipONE Project
 *
 * All routes are mounted under these base endpoints:
 *
 * 1. /auth    : Authentication routes (registration, login, password reset, logout)
 * 2. /users   : User profile management and related functionalities
 * 3. /products: Product browsing, search, and details retrieval
 * 4. /cart    : Shopping cart endpoints (add, update, remove, clear)
 * 5. /orders  : Order processing endpoints (order creation, history, cancellation)
 * 6. /seller  : Seller-specific routes (product management, seller orders, status updates)
 * 7. /admin   : Admin routes (user/seller management, category management, analytics)
 */

centralizedRoute.use('/auth', authRoutes);
centralizedRoute.use('/users', userRoutes);
centralizedRoute.use('/products', productRoutes);
centralizedRoute.use('/cart', cartRoutes);
centralizedRoute.use('/orders', orderRoutes);
centralizedRoute.use('/seller', sellerRoutes);
centralizedRoute.use('/admin', adminRoutes);

export default centralizedRoute;
