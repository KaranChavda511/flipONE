// Seller Order Management (for logged in sellers)
// getSellerOrders, updateOrderStatus
// Add status transition validation

import Order from '../../models/Order.js';
import logger from '../../services/logger.js';

const sellerOrderControllerLogger = logger.child({ label: '/SellerOrderController/SellerOrderController.js' });

const validStatusTransitions = {
  pending: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

export const getSellerOrders = async (req, res) => {
  try {
    sellerOrderControllerLogger.info(`Fetching orders for seller: ${req.account.id}`);

    const orders = await Order.find({
      'items.seller': req.account.id
    })
      .populate('user', 'name email')
      .sort('-createdAt');

    sellerOrderControllerLogger.info(`Fetched ${orders.length} orders for seller: ${req.account.id}`);

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    sellerOrderControllerLogger.error(`Get Orders Error: ${error.message}`, {
      stack: error.stack,
      sellerId: req.account.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    sellerOrderControllerLogger.info(`Updating order status for seller: ${req.account.id}`, {
      orderId,
      itemId,
      newStatus: status
    });

    // Validate status transition
    const order = await Order.findOne({
      _id: orderId,
      'items._id': itemId,
      'items.seller': req.account.id
    });

    if (!order) {
      sellerOrderControllerLogger.warn(`Order item not found: ${itemId} for seller: ${req.account.id}`);
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }

    const item = order.items.id(itemId);
    const allowedStatuses = validStatusTransitions[item.status];

    if (!allowedStatuses.includes(status)) {
      sellerOrderControllerLogger.warn(`Invalid status transition for seller: ${req.account.id}`, {
        currentStatus: item.status,
        newStatus: status
      });
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${item.status} to ${status}`
      });
    }

    item.status = status;
    await order.save();

    sellerOrderControllerLogger.info(`Order status updated successfully for seller: ${req.account.id}`, {
      orderId,
      itemId,
      newStatus: status
    });

    res.json({
      success: true,
      message: 'Order status updated'
    });

  } catch (error) {
    sellerOrderControllerLogger.error(`Update Status Error: ${error.message}`, {
      stack: error.stack,
      sellerId: req.account.id,
      orderId: req.params.orderId,
      itemId: req.params.itemId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};