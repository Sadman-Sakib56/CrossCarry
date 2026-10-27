import express from 'express';
import mongoose from 'mongoose';
import Request from '../models/Request.js';
import Payment from '../models/Payment.js';
import { protect, notAdmin } from '../middleware/auth.js';
import { fail, serverError } from '../utils/respond.js';

const router = express.Router();

const CATEGORIES = ['document', 'medicine', 'clothes', 'gift', 'other'];
const CURRENCIES = ['BDT', 'USD'];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const same = (a, b) => a && b && a.toString() === b.toString();

// list এর প্রতিটা request এর সাথে payment status (held/released/null) জুড়ে দেওয়া হচ্ছে
// এর ফলে dashboard এ "টাকা দেওয়া হয়েছে কিনা" আলাদা API call ছাড়াই বোঝা যায়
const withPaymentStatus = async (requests) => {
  if (requests.length === 0) return [];
  const payments = await Payment.find({ request: { $in: requests.map((r) => r._id) } }).select('request status');
  const map = new Map(payments.map((p) => [p.request.toString(), p.status]));
  return requests.map((r) => ({ ...r.toObject(), paymentStatus: map.get(r._id.toString()) || null }));
};

const checkId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return fail(res, 404, 'NOT_FOUND', 'Request not found');
  }
  next();
};

// POST /api/requests — নতুন delivery request (শুধু সাধারণ user, admin না)
router.post('/', protect, notAdmin, async (req, res) => {
  try {
    const b = req.body;

    if (b.confirmedNotProhibited !== true || b.confirmedVideoRecording !== true) {
      return fail(res, 400, 'CHECKBOXES_REQUIRED', 'You must confirm both checkboxes to create a request');
    }

    const text = (v) => (typeof v === 'string' ? v.trim() : '');
    const weightKg = Number(b.weightKg);
    const offeredFee = Number(b.offeredFee);
    const requiredDate = new Date(b.requiredDate);

    if (
      !text(b.itemName) || !text(b.pickupCountry) || !text(b.pickupCity) ||
      !text(b.destinationCountry) || !text(b.destinationCity) ||
      !CATEGORIES.includes(b.category) ||
      !Number.isFinite(weightKg) || weightKg < 0.1 || weightKg > 50 ||
      !Number.isFinite(offeredFee) || offeredFee < 1 ||
      Number.isNaN(requiredDate.getTime())
    ) {
      return fail(res, 400, 'INVALID_INPUT', 'Please check the form: some fields are missing or invalid');
    }

    if (b.currency && !CURRENCIES.includes(b.currency)) {
      return fail(res, 400, 'INVALID_INPUT', 'Unsupported currency');
    }

    if (requiredDate < startOfToday()) {
      return fail(res, 400, 'PAST_DATE', 'Required date cannot be in the past');
    }

    const created = await Request.create({
      sender: req.user._id,
      itemName: text(b.itemName),
      category: b.category,
      description: text(b.description),
      weightKg,
      pickupCountry: text(b.pickupCountry),
      pickupCity: text(b.pickupCity),
      destinationCountry: text(b.destinationCountry),
      destinationCity: text(b.destinationCity),
      requiredDate,
      offeredFee,
      currency: b.currency || 'BDT',
      confirmedNotProhibited: true,
      confirmedVideoRecording: true,
      statusHistory: [{ status: 'Requested' }],
    });

    res.status(201).json(created);
  } catch (error) {
    serverError(res, error);
  }
});

// GET /api/requests/mine — আমি sender হিসেবে যা পাঠিয়েছি
router.get('/mine', protect, async (req, res) => {
  try {
    const requests = await Request.find({ sender: req.user._id })
      .populate('traveller', 'name')
      .sort({ createdAt: -1 });
    res.json(await withPaymentStatus(requests));
  } catch (error) {
    serverError(res, error);
  }
});

// GET /api/requests/accepted — আমি traveller হিসেবে যা accept করেছি
router.get('/accepted', protect, async (req, res) => {
  try {
    const requests = await Request.find({ traveller: req.user._id })
      .populate('sender', 'name')
      .sort({ createdAt: -1 });
    res.json(await withPaymentStatus(requests));
  } catch (error) {
    serverError(res, error);
  }
});

// GET /api/requests/open — এখনো কেউ accept করেনি এমন request (Find Parcels)
// sender এর শুধু নাম যায়; phone/email accept হওয়ার আগে অন্য user দের দেখানো হয় না
router.get('/open', protect, notAdmin, async (req, res) => {
  try {
    const requests = await Request.find({
      status: 'Requested',
      traveller: null,
      sender: { $ne: req.user._id },
      requiredDate: { $gte: startOfToday() }, // মেয়াদ পার হয়ে যাওয়া request দেখানো হবে না
    })
      .select('-confirmedNotProhibited -confirmedVideoRecording -paymentHeld')
      .populate('sender', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    serverError(res, error);
  }
});

// GET /api/requests/:id — বিস্তারিত
// sender, traveller, admin পুরো তথ্য দেখে। অন্য verified traveller "Requested" request এর সীমিত তথ্য দেখতে পারে
// (Find Parcels এর "View details" এর জন্য, আগে এটা 403 দিত)
router.get('/:id', protect, checkId, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('sender', 'name email phone')
      .populate('traveller', 'name email phone');

    if (!request) return fail(res, 404, 'NOT_FOUND', 'Request not found');

    const isSender = same(request.sender._id, req.user._id);
    const isTraveller = request.traveller && same(request.traveller._id, req.user._id);
    const isAdminUser = req.user.role === 'admin';

    if (isSender || isTraveller || isAdminUser) {
      const payment = await Payment.findOne({ request: request._id });
      return res.json({
        ...request.toObject(),
        payment,
        viewerRole: isAdminUser ? 'admin' : isSender ? 'sender' : 'traveller',
      });
    }

    // বাইরের কেউ: শুধু open request দেখতে পারবে, সীমিত তথ্য সহ
    if (request.status === 'Requested') {
      const obj = request.toObject();
      return res.json({
        ...obj,
        sender: { _id: request.sender._id, name: request.sender.name },
        traveller: null,
        payment: null,
        statusHistory: [],
        viewerRole: 'browser',
      });
    }

    return fail(res, 403, 'FORBIDDEN', 'You are not allowed to view this request');
  } catch (error) {
    serverError(res, error);
  }
});

// PUT /api/requests/:id/accept — Traveller accept করে (Requested -> Matched)
// একই parcel এ একাধিক traveller একসাথে Accept চাপলে ঠিক একজনই পাবে: নিচের update টা atomic
router.put('/:id/accept', protect, notAdmin, checkId, async (req, res) => {
  try {
    if (req.body.travellerVideoConfirmed !== true) {
      return fail(res, 400, 'VIDEO_REQUIRED', 'You must confirm the video recording checkbox');
    }

    if (req.user.verificationStatus !== 'approved') {
      return fail(res, 403, 'NOT_APPROVED', 'Only approved travellers can accept parcels');
    }

    // শর্ত মেলে এমন document পেলেই একসাথে update; না মিললে null — মানে অন্য কেউ আগে নিয়ে গেছে
    const updated = await Request.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'Requested',
        traveller: null,
        sender: { $ne: req.user._id },
        requiredDate: { $gte: startOfToday() },
      },
      {
        $set: { traveller: req.user._id, travellerVideoConfirmed: true, status: 'Matched' },
        $push: { statusHistory: { status: 'Matched', timestamp: new Date() } },
      },
      { new: true }
    );

    if (updated) return res.json(updated);

    // update হয়নি, তাই কারণটা বুঝিয়ে বলা হচ্ছে
    const existing = await Request.findById(req.params.id);
    if (!existing) return fail(res, 404, 'NOT_FOUND', 'Request not found');
    if (same(existing.sender, req.user._id)) return fail(res, 400, 'OWN_REQUEST', 'You cannot accept your own request');
    if (existing.status === 'Requested' && existing.requiredDate < startOfToday()) {
      return fail(res, 400, 'EXPIRED', 'This request has expired');
    }
    return fail(res, 409, 'ALREADY_TAKEN', 'Another traveller just accepted this parcel');
  } catch (error) {
    serverError(res, error);
  }
});

// PUT /api/requests/:id/status — Traveller: Matched -> PickedUp -> InTransit -> Delivered
router.put('/:id/status', protect, notAdmin, checkId, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedNext = { Matched: 'PickedUp', PickedUp: 'InTransit', InTransit: 'Delivered' };

    const request = await Request.findById(req.params.id);
    if (!request) return fail(res, 404, 'NOT_FOUND', 'Request not found');

    if (!same(request.traveller, req.user._id)) {
      return fail(res, 403, 'NOT_ASSIGNED', 'Only the assigned traveller can update this status');
    }

    const expectedNext = allowedNext[request.status];
    if (!expectedNext || expectedNext !== status) {
      return fail(res, 400, 'BAD_TRANSITION', `Cannot move from ${request.status} to ${status}`);
    }

    // sender টাকা hold না করা পর্যন্ত traveller parcel তুলতে পারবে না
    // (আগে এই check ছিল না, তাই payment ছাড়াই delivery হয়ে sender আটকে যেতে পারত)
    if (request.status === 'Matched') {
      const held = await Payment.exists({ request: request._id, status: 'held' });
      if (!held) return fail(res, 400, 'NOT_PAID', 'The sender has not paid yet. Wait for the payment before pickup.');
    }

    const updated = await Request.findOneAndUpdate(
      { _id: request._id, traveller: req.user._id, status: request.status },
      { $set: { status }, $push: { statusHistory: { status, timestamp: new Date() } } },
      { new: true }
    );

    if (!updated) return fail(res, 409, 'STATE_CHANGED', 'This request was just updated. Please refresh.');
    res.json(updated);
  } catch (error) {
    serverError(res, error);
  }
});

// PUT /api/requests/:id/cancel — Sender cancel করে (টাকা hold হওয়ার আগে পর্যন্ত)
router.put('/:id/cancel', protect, notAdmin, checkId, async (req, res) => {
  try {
    const updated = await Request.findOneAndUpdate(
      {
        _id: req.params.id,
        sender: req.user._id,
        status: { $in: ['Requested', 'Matched'] },
        paymentHeld: { $ne: true }, // টাকা hold হয়ে গেলে cancel হবে না, নাহলে টাকা escrow তে আটকে যাবে
      },
      { $set: { status: 'Cancelled' }, $push: { statusHistory: { status: 'Cancelled', timestamp: new Date() } } },
      { new: true }
    );

    if (updated) return res.json(updated);

    const existing = await Request.findById(req.params.id);
    if (!existing) return fail(res, 404, 'NOT_FOUND', 'Request not found');
    if (!same(existing.sender, req.user._id)) return fail(res, 403, 'FORBIDDEN', 'Only the sender can cancel this request');
    if (existing.paymentHeld) {
      return fail(res, 400, 'PAID_CANNOT_CANCEL', 'Cannot cancel after payment is held. Contact support for a refund.');
    }
    return fail(res, 400, 'CANNOT_CANCEL', 'This request can no longer be cancelled');
  } catch (error) {
    serverError(res, error);
  }
});

export default router;
