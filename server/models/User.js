import mongoose from 'mongoose';

// User model: sender, traveller, admin সবাই এই একই model ব্যবহার করে
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // hashed, plain text না
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    acceptedTerms: { type: Boolean, required: true },
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    passportImage: { type: String, default: '' }, // শুধু file name/path, সরাসরি public URL না
    rejectionReason: { type: String, default: '' },

    // দুই currency এর টাকা আলাদা রাখা হচ্ছে, নাহলে USD আর BDT যোগ হয়ে ভুল balance হতো
    walletBalance: { type: Number, default: 0, min: 0 }, // BDT
    walletBalanceUSD: { type: Number, default: 0, min: 0 }, // USD
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
