import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Request from './models/Request.js';
import Payment from './models/Payment.js';

dotenv.config();

// আজ থেকে n দিন পরের/আগের তারিখ। আগে তারিখ hard-coded ছিল, তাই সময় পার হলে sample data "মেয়াদোত্তীর্ণ" হয়ে যেত
const days = (n) => new Date(Date.now() + n * 86400000);

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding');

    await Promise.all([User.deleteMany(), Request.deleteMany(), Payment.deleteMany()]);
    await Payment.syncIndexes();
    console.log('Old data cleared');

    const password = await bcrypt.hash('password123', 10);
    const mk = (name, email, phone, extra = {}) =>
      User.create({ name, email, password, phone, role: 'user', acceptedTerms: true, ...extra });

    const admin = await mk('Admin User', 'admin@crosscarry.com', '01700000000', { role: 'admin', verificationStatus: 'approved' });
    const sender1 = await mk('Rafiul Islam', 'sender1@crosscarry.com', '01711111111');
    const sender2 = await mk('Nusrat Jahan', 'sender2@crosscarry.com', '01722222222');
    const traveller1 = await mk('Kamal Hossain', 'traveller1@crosscarry.com', '01733333333', { verificationStatus: 'approved', walletBalance: 700 });
    const traveller2 = await mk('Shirin Akter', 'traveller2@crosscarry.com', '01744444444', { verificationStatus: 'approved' });
    const traveller3 = await mk('Tanvir Ahmed', 'traveller3@crosscarry.com', '01755555555'); // এখনো verify হয়নি (not_submitted)
    console.log('Sample users created');

    const base = { confirmedNotProhibited: true, confirmedVideoRecording: true, pickupCountry: 'Bangladesh' };
    const hist = (...s) => s.map((status, i) => ({ status, timestamp: days(-(s.length - i)) }));

    // ---- Open (কেউ accept করেনি) — Find Parcels আর "multiple travellers" টেস্টের জন্য ----
    await Request.create([
      { ...base, sender: sender1._id, itemName: 'Laptop Charger', category: 'other', description: 'Dell laptop এর original charger, খুব হালকা।', weightKg: 0.5, pickupCity: 'Dhaka', destinationCountry: 'United Kingdom', destinationCity: 'London', requiredDate: days(14), offeredFee: 1500 },
      { ...base, sender: sender2._id, itemName: 'Winter Clothes', category: 'clothes', weightKg: 2, pickupCity: 'Sylhet', destinationCountry: 'Canada', destinationCity: 'Toronto', requiredDate: days(20), offeredFee: 3000 },
      { ...base, sender: sender2._id, itemName: 'Handmade Pickle', category: 'gift', description: 'Sealed jar, আচার।', weightKg: 1, pickupCity: 'Dhaka', destinationCountry: 'United Kingdom', destinationCity: 'Manchester', requiredDate: days(10), offeredFee: 1200 },
      { ...base, sender: sender1._id, itemName: 'Study Documents', category: 'document', weightKg: 0.3, pickupCity: 'Chattogram', destinationCountry: 'USA', destinationCity: 'Boston', requiredDate: days(25), offeredFee: 40, currency: 'USD' },
    ]);

    // ---- Matched, টাকা এখনো দেওয়া হয়নি: sender এর "Needs your action", traveller এর "Waiting" ----
    await Request.create({
      ...base, sender: sender2._id, traveller: traveller1._id, itemName: 'Family Photo Album', category: 'gift',
      description: 'পুরনো পারিবারিক ছবির অ্যালবাম, যত্ন করে বহন করতে হবে।', weightKg: 1.2, pickupCity: 'Chattogram',
      destinationCountry: 'USA', destinationCity: 'New York', requiredDate: days(18), offeredFee: 2500,
      travellerVideoConfirmed: true, status: 'Matched', statusHistory: hist('Requested', 'Matched'),
    });

    // ---- Matched + টাকা hold: traveller এর "Ready for pickup" ----
    const paid = await Request.create({
      ...base, sender: sender1._id, traveller: traveller1._id, itemName: 'Baby Medicine', category: 'medicine',
      weightKg: 0.4, pickupCity: 'Dhaka', destinationCountry: 'Australia', destinationCity: 'Sydney', requiredDate: days(8),
      offeredFee: 2000, travellerVideoConfirmed: true, status: 'Matched', paymentHeld: true, statusHistory: hist('Requested', 'Matched'),
    });
    await Payment.create({ request: paid._id, sender: sender1._id, traveller: traveller1._id, amount: 2000, currency: 'BDT', status: 'held' });

    // ---- InTransit ----
    const transit = await Request.create({
      ...base, sender: sender2._id, traveller: traveller2._id, itemName: 'Saree Set', category: 'clothes',
      weightKg: 1.5, pickupCity: 'Dhaka', destinationCountry: 'UAE', destinationCity: 'Dubai', requiredDate: days(5),
      offeredFee: 1800, travellerVideoConfirmed: true, status: 'InTransit', paymentHeld: true, statusHistory: hist('Requested', 'Matched', 'PickedUp', 'InTransit'),
    });
    await Payment.create({ request: transit._id, sender: sender2._id, traveller: traveller2._id, amount: 1800, currency: 'BDT', status: 'held' });

    // ---- Delivered (sender কে confirm করতে হবে) ----
    const delivered = await Request.create({
      ...base, sender: sender1._id, traveller: traveller2._id, itemName: 'Birthday Gift', category: 'gift',
      weightKg: 0.8, pickupCity: 'Dhaka', destinationCountry: 'Canada', destinationCity: 'Vancouver', requiredDate: days(2),
      offeredFee: 1000, travellerVideoConfirmed: true, status: 'Delivered', paymentHeld: true, statusHistory: hist('Requested', 'Matched', 'PickedUp', 'InTransit', 'Delivered'),
    });
    await Payment.create({ request: delivered._id, sender: sender1._id, traveller: traveller2._id, amount: 1000, currency: 'BDT', status: 'held' });

    // ---- Completed (history + wallet) ----
    const done = await Request.create({
      ...base, sender: sender1._id, traveller: traveller1._id, itemName: 'Prescribed Medicine', category: 'medicine',
      description: 'Doctor এর prescription অনুযায়ী ওষুধ, urgent।', weightKg: 0.3, pickupCity: 'Dhaka',
      destinationCountry: 'Canada', destinationCity: 'Toronto', requiredDate: days(-10), offeredFee: 1000,
      travellerVideoConfirmed: true, status: 'Completed', paymentHeld: true,
      statusHistory: hist('Requested', 'Matched', 'PickedUp', 'InTransit', 'Delivered', 'Completed'),
    });
    await Payment.create({ request: done._id, sender: sender1._id, traveller: traveller1._id, amount: 1000, currency: 'BDT', travellerAmount: 700, platformFee: 300, status: 'released', releasedAt: days(-9) });

    // ---- Cancelled ----
    await Request.create({
      ...base, sender: sender2._id, itemName: 'Old Books', category: 'other', weightKg: 3, pickupCity: 'Dhaka',
      destinationCountry: 'Germany', destinationCity: 'Berlin', requiredDate: days(12), offeredFee: 900,
      status: 'Cancelled', statusHistory: hist('Requested', 'Cancelled'),
    });

    console.log('\n===== SEED COMPLETE =====');
    console.log('সবার password: password123');
    console.log('Admin:       admin@crosscarry.com   (পাঠাতে/বহন করতে পারে না)');
    console.log('Senders:     sender1@ / sender2@crosscarry.com');
    console.log('Travellers:  traveller1@ / traveller2@ (approved), traveller3@ (verify হয়নি)');
    console.log('==========================\n');
    void admin; void traveller3;

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
