import mongoose from 'mongoose';

// এই function MongoDB Atlas এর সাথে connect করে
// .env ফাইলে থাকা MONGO_URI ব্যবহার করে connect হবে
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected'); // এই লাইন দেখলে বুঝবে connection সফল হয়েছে
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // connection fail হলে server বন্ধ করে দেওয়া হচ্ছে
  }
};

export default connectDB;