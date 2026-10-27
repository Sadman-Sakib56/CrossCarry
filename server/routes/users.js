import express from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { protect, notAdmin } from '../middleware/auth.js';
import upload, { uploadDir } from '../middleware/upload.js';
import { fail, serverError } from '../utils/respond.js';

const router = express.Router();

// GET /api/users/me
router.get('/me', protect, async (req, res) => {
  // frontend "id" (ছোট হাতের) ব্যবহার করে, তাই এখানেও id যোগ করা হচ্ছে
  res.json({ ...req.user.toObject(), id: req.user._id.toString() });
});

// multer এর error (বড় ফাইল, ভুল format) কে সুন্দর JSON এ বদলানোর wrapper
const handleUpload = (req, res, next) => {
  upload.single('passportImage')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 400, 'FILE_TOO_LARGE', 'Image must be 5MB or smaller');
    if (err.code === 'BAD_FILE_TYPE') return fail(res, 400, 'BAD_FILE_TYPE', err.message);
    return fail(res, 400, 'UPLOAD_ERROR', 'Upload failed');
  });
};

// POST /api/users/passport — passport ছবি upload, status 'pending'
router.post('/passport', protect, notAdmin, handleUpload, async (req, res) => {
  try {
    if (!req.file) return fail(res, 400, 'NO_FILE', 'No image file uploaded');

    const user = await User.findById(req.user._id);

    // approved user আবার upload করলে status pending হয়ে traveller অধিকার হারাত, তাই আটকানো হচ্ছে
    if (user.verificationStatus === 'approved') {
      fs.unlink(req.file.path, () => {});
      return fail(res, 400, 'ALREADY_APPROVED', 'You are already verified');
    }

    // পুরনো ছবি ডিস্কে জমতে না দিয়ে মুছে ফেলা হচ্ছে
    if (user.passportImage) {
      fs.unlink(path.join(uploadDir, path.basename(user.passportImage)), () => {});
    }

    user.passportImage = req.file.filename;
    user.verificationStatus = 'pending';
    user.rejectionReason = '';
    await user.save();

    res.json({ message: 'Passport uploaded successfully, waiting for admin approval' });
  } catch (error) {
    serverError(res, error);
  }
});

// GET /api/users/:id/passport — passport ছবি এখন আর public না
// শুধু মালিক নিজে আর admin দেখতে পারবে (আগে /uploads/... লিংক জানা থাকলে যে কেউ দেখতে পারত)
router.get('/:id/passport', protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return fail(res, 404, 'NOT_FOUND', 'Image not found');

    const isOwner = req.user._id.toString() === id;
    if (!isOwner && req.user.role !== 'admin') {
      return fail(res, 403, 'FORBIDDEN', 'You are not allowed to view this image');
    }

    const user = await User.findById(id).select('passportImage');
    if (!user || !user.passportImage) return fail(res, 404, 'NOT_FOUND', 'Image not found');

    // পুরনো data তে "/uploads/xxx.png" সেভ থাকতে পারে, তাই শুধু file name নেওয়া হচ্ছে (path traversal ও আটকায়)
    const file = path.basename(user.passportImage);
    res.sendFile(file, { root: uploadDir }, (err) => {
      if (err && !res.headersSent) fail(res, 404, 'NOT_FOUND', 'Image not found');
    });
  } catch (error) {
    serverError(res, error);
  }
});

export default router;
