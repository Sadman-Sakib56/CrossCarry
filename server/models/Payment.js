import mongoose from 'mongoose';

// প্রতিটা payment একটা request এর সাথে যুক্ত (mock escrow, আসল টাকা কোথাও যায় না)
const paymentSchema = new mongoose.Schema(
  {
    // unique: একই request এর জন্য দুইবার payment তৈরি হওয়া database level এই আটকানো হচ্ছে
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true, unique: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    traveller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['BDT', 'USD'], default: 'BDT' },
    travellerAmount: { type: Number, default: 0 }, // 70%
    platformFee: { type: Number, default: 0 }, // 30%
    status: { type: String, enum: ['held', 'released'], default: 'held' },
    releasedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
