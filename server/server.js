import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import requestRoutes from './routes/requests.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';

import Payment from './models/Payment.js';
import Request from './models/Request.js';

dotenv.config();

// জরুরি env variable না থাকলে অস্পষ্ট error এর বদলে শুরুতেই পরিষ্কার message দিয়ে থামানো হচ্ছে
for (const key of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[key] || process.env[key].startsWith('your_')) {
    console.error(`Missing ${key} in server/.env — copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

await connectDB();

// পুরনো data এর জন্য একবারের migration: যেসব request এর payment আগে থেকেই আছে সেগুলোতে paymentHeld flag বসানো
// এটা বার বার চললেও ক্ষতি নেই (idempotent)
try {
  const paidIds = await Payment.distinct('request');
  if (paidIds.length) {
    await Request.updateMany({ _id: { $in: paidIds }, paymentHeld: { $ne: true } }, { $set: { paymentHeld: true } });
  }
  await Payment.syncIndexes(); // request এর unique index নিশ্চিত করা
} catch (error) {
  console.warn('Startup maintenance skipped:', error.message);
}

const app = express();
app.disable('x-powered-by');

// CLIENT_URL এ কমা দিয়ে একাধিক origin দেওয়া যায়। Vite proxy ব্যবহার করলে CORS লাগেই না
app.use(
  cors({
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  })
);
app.use(express.json({ limit: '100kb' }));

// দ্রষ্টব্য: /uploads আর public static না। passport ছবি শুধু GET /api/users/:id/passport দিয়ে, login করা মালিক/admin দেখতে পারে

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'CrossCarry API is running' });
});

app.use((req, res) => {
  res.status(404).json({ code: 'ROUTE_NOT_FOUND', message: 'API route not found' });
});

// শেষ ভরসা: কোথাও uncaught error হলে HTML এর বদলে JSON পাঠানো
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Invalid JSON body' });
  }
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong on our side' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
