// src/utils/generateToken.js
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign({ id,role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
};

export default generateToken;
