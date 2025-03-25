// Authentication & Authorization Setup

import User from '../../models/User.js';
import Seller from '../../models/Seller.js';
import Admin from '../../models/Admin.js';
import generateToken from '../../utils/generateToken.js';
import { generateUniqueLicenseID } from '../../services/idGenerator.js';
import logger from "../../services/logger.js";
// import { sendEmail } from '../../services/emailService.js';
import { sendUserLoginAlert, sendSellerLoginAlert } from '../../services/emailService.js';


const authControllerLogger = logger.child({ label: '/controllers/AuthController/AuthController.js' });

// User Signup
export const userSignup = async (req, res) => {
  try {
    const { name, email, password, mobile, address } = req.body;

    authControllerLogger.info(`User signup attempt: ${email}`);

    const userExists = await User.findOne({ email });
    if (userExists) {
      authControllerLogger.warn(`User already exists: ${email}`);
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({ name, email, password, mobile, address });

    authControllerLogger.info(`User created successfully: ${user._id}`);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id, user.role),
      }
    });
  } catch (error) {
    authControllerLogger.error(`User registration error: ${error.message}`, {
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// User Login
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    authControllerLogger.info(`User login attempt: ${email}`);

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      if (user.isActive === false) {
        authControllerLogger.warn(`User login blocked: ${email} is disabled`);
        return res.status(403).json({ message: 'User is disabled' });
      }

      const token = generateToken(user._id, user.role);
      authControllerLogger.info(`User logged in successfully: ${user._id}`);

      // await sendEmail({
      //   to: user.email,
      //   subject: 'Login Notification',
      //   text: `Hi ${user.name}, you logged in to flipONE at ${new Date().toLocaleString()}.`,
      //   template: 'LoginNotification', 
      //   templateData: {
      //     name: user.name,
      //     loginTime: new Date().toLocaleString()
      //   },  
      // }).catch((error) => {
      //     logger.error(`Failed to send login email to ${user.email}: ${error.message}`);
      //   });

       // Send login email
    sendUserLoginAlert(user).catch((err) => {
      logger.error(`User email failed: ${err.message}`);
    });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        }
      });
    } else {
      authControllerLogger.warn(`User login failed: Invalid credentials for ${email}`);
      res.status(401).json({
        success: false,
        message: 'Failed!, please check the email & password again'
      });
    }
  } catch (error) {
    authControllerLogger.error(`User login error: ${error.message}`, {
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// Seller Signup
export const sellerSignup = async (req, res) => {
  try {
    const {  name, email, password } = req.body;

    authControllerLogger.info(`Seller signup attempt: ${email}`);

    
    // Double-check lowercase conversion
    const processedEmail = email.toLowerCase();

    // Manual duplicate check for race conditions
    const existingSeller = await Seller.findOne({
      $or: [
        { name },
        { email: processedEmail }
      ]
    });

    if (existingSeller) {
      return res.status(409).json({
        success: false,
        message: existingSeller.name === name 
          ? 'Business name already exists' 
          : 'Email already registered'
      });
    }

    const licenseID = await generateUniqueLicenseID();
    const seller = await Seller.create({ licenseID, name, email:processedEmail, password });

    authControllerLogger.info(`Seller created successfully: ${seller._id}`);

    res.status(201).json({
      success: true,
      token: generateToken(seller._id, seller.role),
      seller: {
        id: seller._id,
        name: seller.name,
        email: processedEmail,
        licenseID: seller.licenseID,
      }
    });
  } catch (error) {
    authControllerLogger.error(`Seller registration error: ${error.message}`, {
      stack: error.stack,
      body: req.body
    });
    const message = error.message.includes('licenseID') 
      ? 'Could not generate unique seller ID. Please try again.'
      : 'Seller registration failed';

    res.status(500).json({
      success: false,
      message
    });
  }
};

// Seller Login
export const sellerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const processedEmail = email.toLowerCase();


    authControllerLogger.info(`Seller login attempt: ${email}`);

    const seller = await Seller.findOne({ email: processedEmail });
    if (seller && (await seller.comparePassword(password))) {
      if (seller.isDisabled) {
        authControllerLogger.warn(`Seller login blocked: ${processedEmail} is disabled`);
        return res.status(403).json({ message: 'Seller is disabled' });
      }

      const token = generateToken(seller._id, seller.role);
      authControllerLogger.info(`Seller logged in successfully: ${seller._id}`);

      // await sendEmail({
      //   to: seller.email,
      //   subject: 'Login Notification - Seller Account',
      //   text: `Hi ${seller.businessName || seller.name}, you logged in to flipONE Seller Portal at ${new Date().toLocaleString()}.`,
      //   template: 'LoginNotification',
      //   templateData: {
      //     name: seller.businessName || seller.name,
      //     loginTime: new Date().toLocaleString()
      //   },
      // }).catch((error) => {
      //   logger.error(`Failed to send seller login email to ${seller.email}: ${error.message}`);
      // });

// Send seller-specific alert
    sendSellerLoginAlert(seller).catch((err) => {
      logger.error(`Seller email failed: ${err.message}`);
    });


      res.json({
        success: true,
        token,
        seller: {
          id: seller._id,
          name: seller.name,
          email: seller.email,
          licenseID: seller.licenseID,
        }
      });
    } else {
      authControllerLogger.warn(`Seller login failed: Invalid credentials for ${email}`);
      res.status(401).json({ message: 'Failed!, please check the email & password again' });
    }
  } catch (error) {
    authControllerLogger.error(`Seller login error: ${error.message}`, {
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Seller login failed'
    });
  }
};

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'password is incorrect',
      });
    }

    // Generate token
    const token = generateToken(admin._id, admin.role);

    // Send response
    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


// export const adminSignup = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     authControllerLogger.info(`admin signup attempt: ${email}`);

//     const adminExists = await User.findOne({ email });
//     if (adminExists) {
//       authControllerLogger.warn(`admin already exists: ${email}`);
//       return res.status(409).json({
//         success: false,
//         message: 'admin already exists with this email'
//       });
//     }

//     const admin = await Admin.create({ name, email, password });

//     authControllerLogger.info(`admin created successfully: ${admin._id}`);

//     res.status(201).json({
//       success: true,
//       admin: {
//         id: admin._id,
//         name: admin.name,
//         email: admin.email,
//         token: generateToken(admin._id, admin.role),
//       }
//     });
//   } catch (error) {
//     authControllerLogger.error(`admin registration error: ${error.message}`, {
//       stack: error.stack,
//       body: req.body
//     });
//     res.status(500).json({
//       success: false,
//       message: 'Registration failed. Please try again.'
//     });
//   }
// };
