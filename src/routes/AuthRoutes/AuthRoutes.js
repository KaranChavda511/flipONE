// src/routes/AuthRoutes/AuthRoutes.js
import express from "express";

import { validator } from "../../middlewares/ValidationMiddleware.js";
import {
  userSignup,
  userLogin,
  sellerSignup,
  sellerLogin,
  adminLogin
} from "../../controllers/AuthController/AuthController.js";
import logger from "../../services/logger.js";

const authRouteLogger = logger.child({ label: "routes/AuthRoute.js" });

const router = express.Router();

// Log incoming requests
router.use((req, res, next) => {
  authRouteLogger.info(`Received ${req.method} request on ${req.url}`);
  next();
});

// User Signup
router.post(
  "/user/signup",
  validator("userSchemas.signup"),
  userSignup
);

// User Login
router.post(
  "/user/login",
  validator("userSchemas.login"),
  
  userLogin
);

// Seller Signup
router.post(
  "/seller/signup",
  validator("sellerSchemas.signup"),
  
  sellerSignup
);

// Seller Login
router.post(
  "/seller/login",
  validator("sellerSchemas.login"),
 
  sellerLogin
);

// Admin Login
router.post(
  "/admin/login",
  validator("adminSchemas.login"),
  
  adminLogin
);

// // admin signup
// router.post(
//   "/admin/signup",
//   validator("adminSchemas.signup"),
//   adminSignup
// );

export default router;
