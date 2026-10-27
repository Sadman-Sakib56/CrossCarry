import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    traveller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    itemName: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: ['document', 'medicine', 'clothes', 'gift', 'other'], required: true },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    weightKg: { type: Number, required: true, min: 0.1, max: 50 },
    pickupCountry: { type: String, required: true, trim: true },
    pickupCity: { type: String, required: true, trim: true },
    destinationCountry: { type: String, required: true, trim: true },
    destinationCity: { type: String, required: true, trim: true },
    requiredDate: { type: Date, required: true },
    offeredFee: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ['BDT', 'USD'], default: 'BDT' },
    status: {
      type: String,
      enum: ['Requested', 'Matched', 'PickedUp', 'InTransit', 'Delivered', 'Completed', 'Cancelled'],
      default: 'Requested',
      index: true,
    },
    confirmedNotProhibited: { type: Boolean, required: true },
    confirmedVideoRecording: { type: Boolean, required: true },
    travellerVideoConfirmed: { type: Boolean, default: false },

    // Pay & Hold আর Cancel যেন একই সময়ে না চলে, সেই race condition আটকানোর জন্য এই flag
    // দুইটা কাজই এই একটা document এ atomic ভাবে এই flag দেখে চলে
    paymentHeld: { type: Boolean, default: false },

    statusHistory: { type: [statusHistorySchema], default: [{ status: 'Requested' }] },
  },
  { timestamps: true }
);

export default mongoose.model('Request', requestSchema);
