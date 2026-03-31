import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const mongoUri = process.env.MONGODB_URL;

    if (!mongoUri) {
      throw new Error("MONGODB_URL is not defined");
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ db connected (${mongoUri})`);
  } catch (error) {
    console.error("❌ DB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDb;