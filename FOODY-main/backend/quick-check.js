import mongoose from 'mongoose';
import Shop from './models/shop.model.js';
import User from './models/user.model.js';

async function check() {
    const mongoUri = "mongodb://127.0.0.1:27017/foodway";
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        const shops = await Shop.find().lean();
        console.log('SHOPS_FOUND:', JSON.stringify(shops, null, 2));
        const users = await User.find().lean();
        console.log('USERS_FOUND:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
