import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    city: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true, // 🔥 important for fast filtering
    },

    state: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    upiVpa: {
      type: String,
      default: null,
    },

    upiPayeeName: {
      type: String,
      default: null,
    },

    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],

    isOpen: {
      type: Boolean,
      default: true,
    },

    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Shop = mongoose.model("Shop", shopSchema);
export default Shop;
