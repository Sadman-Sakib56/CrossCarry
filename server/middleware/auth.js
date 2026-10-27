import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { fail } from '../utils/respond.js';

// প্রতিটা protected route এ ব্যবহার হয়: valid JWT token আছে কিনা চেক করে
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return fail(res, 401, 'NO_TOKEN', 'No token provided, access denied');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return fail(res, 401, 'USER_NOT_FOUND', 'User not found, access denied');
    }

    req.user = user;
    next();
  } catch (error) {
    return fail(res, 401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
};

// শুধু admin route গুলোতে protect এর পরে ব্যবহার হবে
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return fail(res, 403, 'ADMIN_ONLY', 'Admin access only');
};

// Admin কখনো parcel পাঠাতে, accept করতে, pay করতে বা wallet ব্যবহার করতে পারবে না
// admin এর কাজ শুধু platform manage করা, তাই sender/traveller এর সব route এ এটা বসানো আছে
export const notAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return fail(res, 403, 'ADMIN_CANNOT_TRANSACT', 'Admin accounts cannot send, carry or pay for parcels');
  }
  next();
};
