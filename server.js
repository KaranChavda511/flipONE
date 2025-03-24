import express from 'express';
import path from 'path';
import dotenv from "dotenv";
import morgan from 'morgan';
import connectDB from './src/config/db.js';
import centralizedRoute from './src/routes/CentralizedRoute.js';
import logger from './src/services/logger.js';
import { errorHandler, notFound  } from "./src/middlewares/ErrorMiddleware.js";


dotenv.config();

const app = express();


//  Set static folder
const __dirname = path.resolve();

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));


//  Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


// Add before routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/seller')) {
    // Bypass body parsing for multipart routes
    next();
  } else {
    express.json()(req, res, next);
  }
});



//  Request Logger Middleware
app.use((req, res, next) => {
  logger.info(` Incoming Request: ${req.method} ${req.url}`, { user: req.user?._id || 'Guest' });
  next();
});

//  Morgan Logging with Winston
if (process.env.NODE_ENV === "development") {
  app.use(morgan('dev', { stream: { write: (message) => logger.info(message.trim()) } }));
}

// Routes
app.use('/api', centralizedRoute);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);


//  Database Connection
connectDB()
.then(() => {
  app.on("error",(error)=>{
      console.log("ERROR",error);
      throw error
  })
  app.listen(process.env.PORT || 5000, ()=>{
      console.log(`Server is running at port: ${process.env.PORT}`);  
  })
}).catch((err) => {
  console.log("Mongodb connection failed",err);
  
});
