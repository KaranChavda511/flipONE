// User Management (by Admin)
// getAllUsers, toggleUserStatus

import User from '../../models/User.js';
import logger from '../../services/logger.js';

const adminUserLogger = logger.child({ label: "/AdminController/AdminUserController.js" });

export const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Log search activity
    if (search) {
      adminUserLogger.info(`Searching users with query: ${search}`);
    }

    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query);
    const count = await User.countDocuments(query);

    adminUserLogger.info(`Fetched ${users.length} of ${count} total users`);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    adminUserLogger.error(`Get Users Error: ${error.message}`, {
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      adminUserLogger.warn(`User not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newStatus = !user.isActive;
    adminUserLogger.info(`Toggling user status for ${user._id} from ${user.isActive} to ${newStatus}`);

    user.isActive = newStatus;
    await user.save();

    adminUserLogger.info(`Successfully ${newStatus ? 'activated' : 'deactivated'} user ${user._id}`);
    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`
    });

  } catch (error) {
    adminUserLogger.error(`Toggle User Status Error: ${error.message}`, {
      stack: error.stack,
      userId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};