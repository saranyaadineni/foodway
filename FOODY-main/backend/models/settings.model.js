import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  aboutContent: {
    title: { type: String, default: "About FoodWay" },
    description: { type: String, default: "Delivering happiness to your doorstep. Order from the best restaurants and enjoy fresh, delicious food in minutes." },
    mission: { type: String, default: "Our mission is to elevate the quality of life for the urban consumer by offering unparalleled convenience. Convenience is what makes us tick. It's what makes us get out of bed and say, \"Let's do this.\"" },
    image: { type: String, default: "" }
  },
  contactContent: {
    email: { type: String, default: "support@foodway.com" },
    phone: { type: String, default: "+1 (555) 123-4567" },
    address: { type: String, default: "123 Foodie Street, Gourmet City, GC 54321" },
    mapUrl: { type: String, default: "" }
  }
}, { timestamps: true });

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
