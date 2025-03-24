// src/middlewares/ErrorMiddleware.js
import Joi from "joi";
import multer from "multer";
import logger from "../services/logger.js";


// Middleware to handle 404 Not Found errors
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `The page or resource is Not Found - ${req.originalUrl}`,
  });
  
};


//  Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  
  logger.error(`Error: ${err.message}`, { stack: err.stack });

 

  // Handle file upload errors
  if (err instanceof multer.MulterError) {

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Please upload a file less than 5MB",
      });
    }else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Too many files to upload. Please upload a single file",
      });
    }else if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files to upload. Please upload a single file",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Error while uploading files",
      error: err.message,
    });
  }

   // Handle duplicate key errors
   if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }
  

  // Handle other errors
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};