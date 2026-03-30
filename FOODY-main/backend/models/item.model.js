import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop"
    },
    category: {
        type: String,
        required: true,
        validate: {
            validator: async function(value) {
                // Import Category model dynamically to avoid circular dependency
                const Category = mongoose.model('Category');
                const category = await Category.findOne({ 
                    name: { $regex: new RegExp(`^${value}$`, 'i') }, 
                    isActive: true 
                });
                return !!category;
            },
            message: 'Category does not exist or is not active'
        }
    },
    price:{
        type:Number,
        min:0,
        required:true
    },
    foodType:{
        type:String,
        enum:["veg","non veg","vegan"],
        required:true
    },
   rating:{
    average:{type:Number,default:0},
    count:{type:Number,default:0}
   },
   city: {
       type: String
   },
   state: {
       type: String
   },
   stockStatus: {
       type: String,
       enum: ["in_stock", "out_of_stock", "limited"],
       default: "in_stock"
   },
   preparationTime: {
       type: Number,
       min: 1,
       max: 120,
       default: 15
   },
   popularity: {
       type: Number,
       default: 0
   },
   hasOffer: {
       type: Boolean,
       default: false
   },
   offerPercentage: {
       type: Number,
       min: 0,
       max: 100,
       default: 0
   },
   isNewItem: {
       type: Boolean,
       default: true
   }
}, { timestamps: true })

// 🚀 Performance Indexes
itemSchema.index({ shop: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ city: 1 });
itemSchema.index({ city: 1, category: 1 });
itemSchema.index({ name: "text" }); // For search functionality

const Item=mongoose.model("Item",itemSchema)
export default Item