import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { fail, serverError } from '../utils/respond.js';

const router = express.Router();

const generateToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  verificationStatus: user.verificationStatus,
  walletBalance: user.walletBalance,
  walletBalanceUSD: user.walletBalanceUSD || 0,
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, acceptedTerms } = req.body;

    if (!name?.trim() || !email?.trim() || !password || !phone?.trim()) {
      return fail(res, 400, 'FIELDS_REQUIRED', 'All fields are required');
    }
    if (typeof password !== 'string' || password.length < 6) {
      return fail(res, 400, 'PASSWORD_SHORT', 'Password must be at least 6 characters');
    }
    // Terms না মানলে backend এও reject, frontend bypass করলেও
    if (acceptedTerms !== true) {
      return fail(res, 400, 'TERMS_REQUIRED', 'You must accept the Terms and Policy');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return fail(res, 400, 'EMAIL_TAKEN', 'Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);

    // role এখানে কখনো body থেকে নেওয়া হয় না, তাই কেউ নিজেকে admin বানাতে পারবে না
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      acceptedTerms: true,
    });

    res.status(201).json({ token: generateToken(user._id), user: publicUser(user) });
  } catch (error) {
    serverError(res, error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(res, 400, 'FIELDS_REQUIRED', 'Email and password are required');
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    res.json({ token: generateToken(user._id), user: publicUser(user) });
  } catch (error) {
    serverError(res, error);
  }
});

export default router;
