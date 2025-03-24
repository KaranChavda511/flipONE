// Analytics Management (by Admin)
// getSalesData, getUserStatistics, getProductStatistics

import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import logger from '../../services/logger.js';

const adminAnalyticsLogger = logger.child({ label: "/AdminController/AdminAnalyticsController.js" });

export const getSalesData = async (req, res) => {
  try {
    adminAnalyticsLogger.info("Fetching sales data");

    const salesData = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSales: { $sum: "$totalAmount" },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    adminAnalyticsLogger.info(`Fetched sales data for ${salesData.length} days`);

    res.json({
      success: true,
      salesData
    });

  } catch (error) {
    adminAnalyticsLogger.error(`Sales Analytics Error: ${error.message}`, {
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales data'
    });
  }
};

export const getUserStatistics = async (req, res) => {
  try {
    adminAnalyticsLogger.info("Fetching user statistics");

    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ["$isActive", 1, 0] } },
          registeredLastMonth: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }, 1, 0]
            }
          }
        }
      }
    ]);

    adminAnalyticsLogger.info(`User statistics fetched: ${JSON.stringify(stats[0])}`);

    res.json({
      success: true,
      ...stats[0]
    });

  } catch (error) {
    adminAnalyticsLogger.error(`User Stats Error: ${error.message}`, {
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
};

export const getProductStatistics = async (req, res) => {
  try {
    adminAnalyticsLogger.info("Fetching product statistics");

    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ["$isActive", 1, 0] } },
          totalStock: { $sum: "$stock" },
          averagePrice: { $avg: "$price" }
        }
      }
    ]);

    adminAnalyticsLogger.info(`Product statistics fetched: ${JSON.stringify(stats[0])}`);

    res.json({
      success: true,
      ...stats[0]
    });

  } catch (error) {
    adminAnalyticsLogger.error(`Product Stats Error: ${error.message}`, {
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product statistics'
    });
  }
};