// Profile Management (for logged in users)
// getUserProfile, updateProfile, updateprofilePic
// Implement email immutability check


import User from '../../models/User.js';
import fs from 'fs/promises';
import path from 'path';
import { uploadsDir } from '../../utils/FileUploads.js';
import logger from '../../services/logger.js';



const userControllerLogger = logger.child({ label: '.controllers/UserController/UserController.js' });

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.account;

    userControllerLogger.info(`Fetching profile for user: ${id}`);

    const user = await User.findById(id);

    if (!user) {
      userControllerLogger.warn(`User not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    userControllerLogger.info(`Profile fetched successfully for user: ${id}`);

    res.json({
      success: true,
      user
    });

  } catch (error) {
    userControllerLogger.error(`Get Profile Error: ${error.message}`, {
      stack: error.stack,
      userId: req.account.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.account;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'mobile', 'address'];
    const invalidUpdates = updates.filter(update => !allowedUpdates.includes(update));

    userControllerLogger.info(`Updating profile for user: ${id}`, {
      updates
    });

    if (invalidUpdates.length > 0) {
      userControllerLogger.warn(`Invalid updates for user: ${id}`, {
        invalidUpdates
      });
      return res.status(400).json({
        success: false,
        message: `Invalid fields: ${invalidUpdates.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    userControllerLogger.info(`Profile updated successfully for user: ${id}`);

    res.json({
      success: true,
      user
    });

  } catch (error) {
    userControllerLogger.error(`Update Profile Error: ${error.message}`, {
      stack: error.stack,
      userId: req.account.id,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Profile update failed'
    });
  }
};


// Update Profile Picture
export const updateprofilePic = async (req, res) => {
  try {
    const { id } = req.account;


    userControllerLogger.info(`Updating profile picture for user: ${id}`);

    if (!req.file) {
      userControllerLogger.warn(`No image file provided for user: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Get user from database
    const user = await User.findById(id);

     // Delete old picture if exists
     if (user.profilePic) {
      const oldFilename = user.profilePic.split('/').pop();
      const oldPath = path.join(uploadsDir, oldFilename);
      
      try {
        await fs.access(oldPath);
        await fs.unlink(oldPath);
      } catch (err) {
        if (err.code !== 'ENOENT') { // Ignore "file not found" errors
          console.error('Error deleting old profile picture:', err);
        }
      }
    }

    // Create accessible URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000'; 
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

       // Update user with new picture path
       user.profilePic = imageUrl;
       await user.save();

       userControllerLogger.info(`Profile picture updated successfully for user: ${id}`);
   
       res.status(200).json({ 
         success: true, 
         message: 'Profile picture updated successfully',
         imageUrl: imageUrl,
        //  viewUrl: imageUrl
       });


  } catch (error) {
    userControllerLogger.error(`Profile Picture Error: ${error.message}`, {
      stack: error.stack,
      userId: req.account.id
    });
    res.status(500).json({
      success: false,
      message: 'Server error updating profile picture',
      error: error.message 
    });
  }
};