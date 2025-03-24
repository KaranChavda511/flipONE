import mongoose from 'mongoose';
import logger from "../services/logger.js";

const dbLogger = logger.child({ label: ".src/config/db.js" });



const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    // console.log('[2] MONGO_URI:', process.env.MONGO_URI || 'Not found');
    const conn = await mongoose.connect(`${process.env.MONGO_URI}` );

    dbLogger.info(` MONGODB successfully connected & DB Host: ${conn.connection.host}`);

  

  } catch (error) {
    dbLogger.error(`MONGODB connection failed: ${error.message}, ${ error.stack }`);
    // process.exit(1);
  }
};


export default connectDB;