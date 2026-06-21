import mongoose from "mongoose";

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("❌ MONGO_URI missing in .env");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "fairhire",
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas is unreachable
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    // Re-throw so startServer() in server.js can decide what to do
    throw err;
  }
};