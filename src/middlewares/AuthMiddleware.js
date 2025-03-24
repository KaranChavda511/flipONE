// src/middlewares/AuthMiddleware.js
import jwt from "jsonwebtoken";
import logger from "../services/logger.js";
import User from "../models/User.js";
import Seller from "../models/Seller.js";
import Admin from "../models/Admin.js";

const authMiddlewareLogger = logger.child({
  label: ".src/middlewares/AuthMiddleware.js",
});



// Main authentication middleware (for all account types)
export const protect = async (req, res, next) => {

  const getToken = () => {
    const authHeader = req.headers.authorization;
    return authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  };
  
  try {
    const token = getToken();


    if (!token) {
      authMiddlewareLogger.warn("No token provided");
      return res.status(401).json({
        success: false,
        message: "Authorization failed; Please log in to Access.",
      });
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded) // for debugging

  

    // Find user based on role
    let account;
    switch (decoded.role) {
      case "user":
        account = await User.findById(decoded.id);
        break;
      case "seller":
        account = await Seller.findById(decoded.id);
        break;
      case "admin":
        account = await Admin.findById(decoded.id);
        break;
      default:
        authMiddlewareLogger.error(`Invalid role detected: ${decoded.role}`);
        return res.status(401).json({
          success: false,
          message: "Invalid account type",
        });
    }

  
     // Validate account status
     if (!account?.isActive) {
      authMiddlewareLogger.warn(`Account inactive or not found: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: "Account unavailable or inactive",
      });
    }

    // Attach account to request
    req.account = account;

    authMiddlewareLogger.info(
      `Authenticated ${decoded.role}: ${account.email}`
    );

    next();
  } catch (error) {
    authMiddlewareLogger.error(`Authentication failed: ${error.message}`);

    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again",
    });
  }
};

// Admin-specific protection
export const adminProtect = (req, res, next) => {
  if (req.account.role !== "admin") {
    authMiddlewareLogger.warn(
      `Unauthorized admin access attempt by ${req.account.role}`
    );
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }
  next();
};

// Seller-specific protection
export const sellerProtect = (req, res, next) => {
  if (req.account.role !== "seller") {
    authMiddlewareLogger.warn(
      `Unauthorized seller access attempt by ${req.account.role}`
    );
    return res.status(403).json({
      success: false,
      message: "Seller account required",
    });
  }
  next();
};

// User-specific protection
export const userProtect = (req, res, next) => {
  if (req.account.role !== "user") {
    authMiddlewareLogger.warn(
      `Unauthorized user access attempt by ${req.account.role}`
    );
    return res.status(403).json({
      success: false,
      message: "User account required",
    });
  }
  next();
};
