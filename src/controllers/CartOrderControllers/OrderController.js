// src/controllers/CartOrderControllers/OrderController.js
import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import logger from '../../services/logger.js';

const orderControllerLogger = logger.child({ label: '/OrderController/OrderController.js' });

// Constants
const ORDER_STATUS = {
  PENDING: 'pending',
  CANCELLED: 'cancelled'
};
// Process Order Without Transactions
const processOrder = async (userId, shippingAddress) => {
  try {
    // Get and validate cart
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name price stock isActive seller',
        match: { isActive: true }
      });

    if (!cart?.items?.length) {
      throw new Error('Your cart is empty');
    }

    // Prepare order items and stock updates
    const [orderItems, stockUpdates] = cart.items.reduce((acc, item) => {
      const product = item.product;
      
      if (!product || product.stock < item.quantity) {
        throw new Error(`${product?.name || 'Product'} is out of stock`);
      }

      acc[0].push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        seller: product.seller,
        image: product.images?.[0] || null
      });

      acc[1].push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { stock: -item.quantity } }
        }
      });

      return acc;
    }, [[], []]);

    // Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      shippingAddress,
      status: ORDER_STATUS.PENDING
    });

    // Update stock and clear cart (non-transactional)
    await Product.bulkWrite(stockUpdates);
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });

    return order;

  } catch (error) {
    throw error;
  }
};

// Create Order (Updated)
export const createOrder = async (req, res) => {
  try {
    const order = await processOrder(req.account.id, req.validatedData.shippingAddress);
    
    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      }
    });

  } catch (error) {
    orderControllerLogger.error(`Order Error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get Order History
export const getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.account.id })
      .sort('-createdAt')
      .lean();

    res.json({
      success: true,
      orders: orders.map(order => ({
        id: order._id,
        totalAmount: order.totalAmount,
        status: order.status,
        date: order.createdAt
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders'
    });
  }
};

// Cancel Order (Simplified)
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.account.id,
      status: ORDER_STATUS.PENDING
    });

    if (!order) throw new Error('Order not found');

    // Restock products
    await Product.bulkWrite(order.items.map(item => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: item.quantity } }
      }
    })));

    order.status = ORDER_STATUS.CANCELLED;
    await order.save();

    res.json({ success: true, message: 'Order cancelled' });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};