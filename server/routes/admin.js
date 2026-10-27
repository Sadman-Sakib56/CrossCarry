import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Request from '../models/Request.js';
import Payment from '../models/Payment.js';
import { protect, isAdmin } from '../middleware/auth.js';
import { fail, serverError } from '../utils/respond.js';

const router = express.Router();

router.use(protect, isAdmin);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    serverError(res, error);
  }
});

// PUT /api/admin/users/:id/verify — approve / reject
router.put('/users/:id/verify', async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return fail(res, 400, 'BAD_STATUS', 'Status must be approved or rejected');
    }
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 404, 'NOT_FOUND', 'User not found');

    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, 'NOT_FOUND', 'User not found');

    // passport ছবি ছাড়া বা pending ছাড়া অন্য অবস্থায় verify করার কিছু নেই
    if (user.verificationStatus !== 'pending' || !user.passportImage) {
      return fail(res, 400, 'NOT_PENDING', 'This user has no pending verification');
    }

    user.verificationStatus = status;
    user.rejectionReason = status === 'rejected' ? (reason?.trim() || 'No reason provided') : '';
    await user.save();

    res.json({ ...user.toObject(), password: undefined });
  } catch (error) {
    serverError(res, error);
  }
});

// GET /api/admin/requests
router.get('/requests', async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('sender', 'name email')
      .populate('traveller', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    serverError(res, error);
  }
});

// GET /api/admin/payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('sender', 'name email')
      .populate('traveller', 'name email')
      .populate('request', 'itemName')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    serverError(res, error);
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalRequests, totalDelivered, pendingVerifications, openRequests] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'Completed' }),
      User.countDocuments({ verificationStatus: 'pending' }),
      Request.countDocuments({ status: 'Requested' }),
    ]);

    // BDT আর USD আলাদা করে যোগ করা হচ্ছে (আগে দুটো মিশে যেত)
    const sumBy = async (match, field) => {
      const rows = await Payment.aggregate([
        { $match: match },
        { $group: { _id: '$currency', total: { $sum: field } } },
      ]);
      return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.total }), { BDT: 0, USD: 0 });
    };

    const [heldByCurrency, platformEarnings] = await Promise.all([
      sumBy({ status: 'held' }, '$amount'),
      sumBy({ status: 'released' }, '$platformFee'),
    ]);

    res.json({
      totalUsers,
      totalRequests,
      totalDelivered,
      pendingVerifications,
      openRequests,
      heldByCurrency,
      platformEarnings,
    });
  } catch (error) {
    serverError(res, error);
  }
});

export default router;
