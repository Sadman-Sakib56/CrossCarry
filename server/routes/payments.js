import express from 'express';
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Request from '../models/Request.js';
import User from '../models/User.js';
import { protect, notAdmin } from '../middleware/auth.js';
import { fail, serverError } from '../utils/respond.js';

const router = express.Router();

// admin কখনো payment/wallet এর কাজ করতে পারবে না, তাই এই ফাইলের সব route এ notAdmin
router.use(protect, notAdmin);

const round2 = (n) => Math.round(n * 100) / 100;

// GET /api/payments/mine — traveller এর wallet আর transaction list
// (route টা "/:requestId/..." এর আগে রাখা হয়েছে যাতে "mine" কে id ভাবা না হয়)
router.get('/mine', async (req, res) => {
  try {
    const payments = await Payment.find({ traveller: req.user._id })
      .populate('request', 'itemName destinationCountry destinationCity')
      .sort({ createdAt: -1 });

    // এখনো escrow তে আটকে আছে এমন টাকা, currency অনুযায়ী আলাদা
    const pending = { BDT: 0, USD: 0 };
    payments.forEach((p) => {
      if (p.status === 'held') pending[p.currency] = round2((pending[p.currency] || 0) + p.amount * 0.7);
    });

    res.json({
      walletBalance: req.user.walletBalance,
      walletBalanceUSD: req.user.walletBalanceUSD || 0,
      pending,
      payments,
    });
  } catch (error) {
    serverError(res, error);
  }
});

// POST /api/payments/:requestId/hold — Sender "Pay & Hold" (mock escrow)
router.post('/:requestId/hold', async (req, res) => {
  const { requestId } = req.params;
  if (!mongoose.isValidObjectId(requestId)) return fail(res, 404, 'NOT_FOUND', 'Request not found');

  try {
    // ধাপ ১: request এ atomic ভাবে "paymentHeld" flag বসানো। এটা একই সময়ে cancel বা double-click আটকায়
    const request = await Request.findOneAndUpdate(
      { _id: requestId, sender: req.user._id, status: 'Matched', paymentHeld: { $ne: true } },
      { $set: { paymentHeld: true } },
      { new: true }
    );

    if (!request) {
      const existing = await Request.findById(requestId);
      if (!existing) return fail(res, 404, 'NOT_FOUND', 'Request not found');
      if (existing.sender.toString() !== req.user._id.toString()) {
        return fail(res, 403, 'FORBIDDEN', 'Only the sender can pay for this request');
      }
      if (existing.paymentHeld) return fail(res, 400, 'ALREADY_PAID', 'Payment already exists for this request');
      return fail(res, 400, 'NOT_MATCHED', 'Request must be accepted by a traveller before payment');
    }

    // ধাপ ২: payment তৈরি। fail করলে flag ফিরিয়ে দেওয়া হয়, যাতে sender আবার চেষ্টা করতে পারে
    try {
      const payment = await Payment.create({
        request: request._id,
        sender: request.sender,
        traveller: request.traveller,
        amount: request.offeredFee,
        currency: request.currency,
        status: 'held',
      });
      return res.status(201).json(payment);
    } catch (createError) {
      if (createError.code !== 11000) {
        await Request.updateOne({ _id: request._id }, { $set: { paymentHeld: false } });
      }
      throw createError;
    }
  } catch (error) {
    if (error.code === 11000) return fail(res, 400, 'ALREADY_PAID', 'Payment already exists for this request');
    serverError(res, error);
  }
});

// PUT /api/payments/:requestId/release — Sender "Confirm Delivery" (traveller 70%, platform 30%)
router.put('/:requestId/release', async (req, res) => {
  const { requestId } = req.params;
  if (!mongoose.isValidObjectId(requestId)) return fail(res, 404, 'NOT_FOUND', 'Request not found');

  try {
    const request = await Request.findById(requestId);
    if (!request) return fail(res, 404, 'NOT_FOUND', 'Request not found');

    if (request.sender.toString() !== req.user._id.toString()) {
      return fail(res, 403, 'FORBIDDEN', 'Only the sender can confirm delivery');
    }
    if (request.status !== 'Delivered') {
      return fail(res, 400, 'NOT_DELIVERED', 'Request must be Delivered before confirming');
    }

    const existing = await Payment.findOne({ request: request._id });
    if (!existing) return fail(res, 404, 'NO_PAYMENT', 'Payment not found for this request');

    // payment টা "held" থেকে "released" এ নেওয়াই টাকার gate: দুইবার চাপলেও টাকা একবারই যাবে
    const travellerAmount = round2(existing.amount * 0.7);
    const platformFee = round2(existing.amount - travellerAmount); // বাকিটা platform এর, যাতে rounding এ টাকা হারিয়ে না যায়

    const payment = await Payment.findOneAndUpdate(
      { _id: existing._id, status: 'held' },
      { $set: { status: 'released', travellerAmount, platformFee, releasedAt: new Date() } },
      { new: true }
    );
    if (!payment) return fail(res, 400, 'ALREADY_RELEASED', 'Payment already released');

    // read-modify-write না করে $inc: একসাথে একাধিক payment release হলেও balance ঠিক থাকে
    const field = payment.currency === 'USD' ? 'walletBalanceUSD' : 'walletBalance';
    await User.updateOne({ _id: request.traveller }, { $inc: { [field]: travellerAmount } });

    const completed = await Request.findOneAndUpdate(
      { _id: request._id, status: 'Delivered' },
      { $set: { status: 'Completed' }, $push: { statusHistory: { status: 'Completed', timestamp: new Date() } } },
      { new: true }
    );

    res.json({ payment, request: completed });
  } catch (error) {
    serverError(res, error);
  }
});

export default router;
