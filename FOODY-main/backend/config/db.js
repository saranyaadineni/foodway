import mongoose from "mongoose"
import User from "../models/user.model.js"
import Shop from "../models/shop.model.js"
import Item from "../models/item.model.js"

let memoryServer = null

const connectDb = async () => {
    const mongoUri = process.env.MONGODB_URL
    if (!mongoUri) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error("MONGODB_URL is not defined in production environment.")
        }
        console.warn("MONGODB_URL is not defined. Falling back to local default for development.")
    }

    const uriToConnect = mongoUri || "mongodb://127.0.0.1:27017/foodway"
    
    try {
        await mongoose.connect(uriToConnect, {
            serverSelectionTimeoutMS: 5000
        })
        console.log(`db connected (${uriToConnect})`)
    } catch (error) {
        console.error("db error:", error?.message || error)
        
        if (process.env.NODE_ENV === 'production') {
            console.error("FATAL: Database connection failed in production. Exiting...")
            process.exit(1)
        }

        console.log("Starting in-memory MongoDB for development fallback...")
        try {
            const { MongoMemoryServer } = await import("mongodb-memory-server")
            memoryServer = await MongoMemoryServer.create()
            const memUri = memoryServer.getUri()
            await mongoose.connect(memUri)
            console.log("Connected to in-memory MongoDB")

            // Seed some data for development
            const bcrypt = (await import("bcryptjs")).default
            
            // 1. Seed superadmin
            let admin = await User.findOne({ email: "superadmin@foodway.com" })
            if (!admin) {
                admin = new User({
                    fullName: "Super Admin",
                    email: "superadmin@foodway.com",
                    password: await bcrypt.hash("superadmin123", 10),
                    mobile: "9999999999",
                    role: "superadmin",
                    isApproved: true
                })
                await admin.save()
                console.log("Seeded superadmin: superadmin@foodway.com / superadmin123")
            }

            // 2. Seed an owner and a shop
            let owner = await User.findOne({ email: "owner@foodway.com" })
            if (!owner) {
                owner = new User({
                    fullName: "Test Owner",
                    email: "owner@foodway.com",
                    password: await bcrypt.hash("owner123", 10),
                    mobile: "8888888888",
                    role: "owner",
                    isApproved: true
                })
                await owner.save()
                console.log("Seeded owner: owner@foodway.com / owner123")
            }

            let shop = await Shop.findOne({ owner: owner._id })
            if (!shop) {
                shop = new Shop({
                    name: "Foodway Express",
                    owner: owner._id,
                    description: "Fast and delicious food delivered to your door.",
                    city: "Hyderabad",
                    address: "Hitech City, Hyderabad",
                    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
                    isOpen: true
                })
                await shop.save()
                console.log("Seeded shop: Foodway Express in Hyderabad")

                // 3. Seed some items for the shop
                const items = [
                    {
                        name: "Paneer Butter Masala",
                        description: "Creamy and delicious paneer curry",
                        price: 250,
                        foodType: "veg",
                        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=1000&auto=format&fit=crop",
                        shop: shop._id,
                        stockStatus: "in_stock"
                    },
                    {
                        name: "Chicken Biryani",
                        description: "Authentic Hyderabadi Chicken Biryani",
                        price: 350,
                        foodType: "non-veg",
                        image: "https://images.unsplash.com/photo-1563379091339-03b21bc4a6f8?q=80&w=1000&auto=format&fit=crop",
                        shop: shop._id,
                        stockStatus: "in_stock"
                    }
                ]
                
                const savedItems = await Item.insertMany(items)
                shop.items = savedItems.map(item => item._id)
                await shop.save()
                console.log("Seeded 2 items for the shop")
            }

            // 4. Seed a regular user for testing
            let testUser = await User.findOne({ email: "user@foodway.com" })
            if (!testUser) {
                testUser = new User({
                    fullName: "Test User",
                    email: "user@foodway.com",
                    password: await bcrypt.hash("user123", 10),
                    mobile: "7777777777",
                    role: "user",
                    isApproved: true
                })
                await testUser.save()
                console.log("Seeded test user: user@foodway.com / user123")
            }

        } catch (memErr) {
            console.error("Failed to start in-memory MongoDB:", memErr?.message || memErr)
        }
    }
}

export default connectDb
