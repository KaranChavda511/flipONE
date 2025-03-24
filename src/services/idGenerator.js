// src/utils/idGenerator.js
import Seller from '../models/Seller.js';

const MAX_ATTEMPTS = 5;
const MIN_ID = 10000;
const MAX_ID = 99999;

export const generateUniqueLicenseID = async () => {
  let attempts = 0;
  
  while (attempts < MAX_ATTEMPTS) {
    const licenseID = Math.floor(Math.random() * (MAX_ID - MIN_ID + 1)) + MIN_ID;
    const exists = await Seller.exists({ licenseID });
    
    if (!exists) {
      return licenseID;
    }
    attempts++;
  }
  
  throw new Error(`Failed to generate unique licenseID after ${MAX_ATTEMPTS} attempts`);
};