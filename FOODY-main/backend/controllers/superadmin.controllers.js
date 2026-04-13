import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import UserType from "../models/userType.model.js";
import uploadToCloudinary from "../utils/s3Upload.js";

// Get all pending owners for approval
export const getPendingOwners = async (req, res) => {
    try {
        const pendingOwners = await User.find({ 
            role: "owner", 
            isApproved: false 
        }).select("-password -resetOtp");
        
        res.status(200).json(pendingOwners);
    } catch (error) {
        res.status(500).json({ message: `Error fetching pending owners: ${error}` });
    }
};

// Get all pending delivery boys for approval
export const getPendingDeliveryBoys = async (req, res) => {
    try {
        const pendingDeliveryBoys = await User.find({ 
            role: "deliveryBoy", 
            isApproved: false 
        }).select("-password -resetOtp");
        
        res.status(200).json(pendingDeliveryBoys);
    } catch (error) {
        res.status(500).json({ message: `Error fetching pending delivery boys: ${error}` });
    }
};

// Approve or reject owner
export const updateOwnerStatus = async (req, res) => {
    try {
        const { userId, action } = req.body; // action: 'approve' or 'reject'
        
        if (action === 'approve') {
            await User.findByIdAndUpdate(userId, { isApproved: true });
            res.status(200).json({ message: "Owner approved successfully" });
        } else if (action === 'reject') {
            await User.findByIdAndDelete(userId);
            res.status(200).json({ message: "Owner rejected and removed" });
        } else {
            res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        res.status(500).json({ message: `Error updating owner status: ${error}` });
    }
};

// Approve or reject delivery boy
export const updateDeliveryBoyStatus = async (req, res) => {
    try {
        const { userId, action } = req.body; // action: 'approve' or 'reject'
        
        if (action === 'approve') {
            const deliveryBoy = await User.findById(userId);
            if (!deliveryBoy) {
                return res.status(404).json({ message: "Delivery boy not found" });
            }

            // Generate deliveryBoyId if it doesn't exist
            if (!deliveryBoy.deliveryBoyId) {
                // Find the latest deliveryBoyId
                const lastBoy = await User.findOne({ 
                    deliveryBoyId: { $regex: /^FW-DEL-/ } 
                }).sort({ deliveryBoyId: -1 });

                let nextIdNumber = 1;
                if (lastBoy && lastBoy.deliveryBoyId) {
                    const match = lastBoy.deliveryBoyId.match(/FW-DEL-(\d+)/);
                    if (match) {
                        nextIdNumber = parseInt(match[1]) + 1;
                    }
                }

                // Format: FW-DEL-0001
                const nextDeliveryBoyId = `FW-DEL-${String(nextIdNumber).padStart(4, '0')}`;
                deliveryBoy.deliveryBoyId = nextDeliveryBoyId;
            }

            deliveryBoy.isApproved = true;
            await deliveryBoy.save();
            
            res.status(200).json({ 
                message: "Delivery boy approved successfully",
                deliveryBoyId: deliveryBoy.deliveryBoyId 
            });
        } else if (action === 'reject') {
            await User.findByIdAndDelete(userId);
            res.status(200).json({ message: "Delivery boy rejected and removed" });
        } else {
            res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        res.status(500).json({ message: `Error updating delivery boy status: ${error}` });
    }
};

// Get all categories
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: `Error fetching categories: ${error}` });
    }
};

// Create new category
export const createCategory = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        
        const { name, description } = req.body;
        
        // --- Backend Validation ---
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }
        
        const trimmedName = name.trim();
        const trimmedDesc = (description || "").trim();

        // Name validation: alphabets and spaces only, 3-50 chars
        if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
            return res.status(400).json({ message: "Category name should contain only letters" });
        }
        if (trimmedName.length < 3 || trimmedName.length > 50) {
            return res.status(400).json({ message: "Category name must be between 3 and 50 characters" });
        }

        // Description validation: required, 5-200 chars
        if (!trimmedDesc) {
            return res.status(400).json({ message: "Description is required" });
        }
        if (trimmedDesc.length < 5 || trimmedDesc.length > 200) {
            return res.status(400).json({ message: "Description must be between 5 and 200 characters" });
        }
        // --- End Validation ---
        
        // Check for existing category (case-insensitive)
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
            isActive: true 
        });
        if (existingCategory) {
            console.log(`Category creation failed: Category '${trimmedName}' already exists`);
            return res.status(400).json({ message: `Category '${trimmedName}' already exists` });
        }
        
        let image = null;
        const placeholderImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop";

        if (req.file) {
            try {
                console.log('Attempting to upload image to Cloudinary...');
                image = await uploadToCloudinary(req.file);
                if (image) {
                    console.log('Image uploaded successfully:', image);
                } else {
                    console.log('Cloudinary upload returned null - not configured');
                }
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
            }
        }

        if (!image) {
            console.log('Using placeholder image for category');
            image = placeholderImage;
        }
        
        const category = await Category.create({ 
            name: trimmedName, 
            description: trimmedDesc, 
            image: image 
        });
        console.log('Category created successfully:', category);
        res.status(201).json(category);
    } catch (error) {
        console.error('Category creation error:', error);
        if (error.code === 11000) {
            // MongoDB duplicate key error
            return res.status(400).json({ message: "Category name already exists" });
        }
        res.status(500).json({ message: `Error creating category: ${error.message}` });
    }
};

// Update category
export const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, description } = req.body;
        
        console.log('Update category request:', { categoryId, name, description });
        console.log('Request file:', req.file);
        
        // --- Backend Validation ---
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }
        
        const trimmedName = name.trim();
        const trimmedDesc = (description || "").trim();

        // Name validation: alphabets and spaces only, 3-50 chars
        if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
            return res.status(400).json({ message: "Category name should contain only letters" });
        }
        if (trimmedName.length < 3 || trimmedName.length > 50) {
            return res.status(400).json({ message: "Category name must be between 3 and 50 characters" });
        }

        // Description validation: required, 5-200 chars
        if (!trimmedDesc) {
            return res.status(400).json({ message: "Description is required" });
        }
        if (trimmedDesc.length < 5 || trimmedDesc.length > 200) {
            return res.status(400).json({ message: "Description must be between 5 and 200 characters" });
        }
        // --- End Validation ---
        
        // Check if category exists
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            return res.status(404).json({ message: "Category not found" });
        }
        
        // Check if name is already taken by another category
        const duplicateCategory = await Category.findOne({ 
            name: trimmedName, 
            _id: { $ne: categoryId },
            isActive: true 
        });
        if (duplicateCategory) {
            return res.status(400).json({ message: "Category name already exists" });
        }
        
        // Prepare update data
        const updateData = { name: trimmedName, description: trimmedDesc };
        
        // Handle image upload if provided
        if (req.file) {
            try {
                const imageUrl = await uploadToCloudinary(req.file);
                if (imageUrl) {
                    updateData.image = imageUrl;
                    console.log('Image uploaded successfully:', imageUrl);
                } else {
                    console.log('Cloudinary upload skipped - not configured, continuing without image update');
                }
            } catch (uploadError) {
                console.error('Cloudinary upload failed during update:', uploadError);
                // Continue without image update instead of failing the entire operation
                console.log('Continuing category update without image due to Cloudinary error');
            }
        }
        
        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId, 
            updateData, 
            { new: true }
        );
        
        res.status(200).json(updatedCategory);
    } catch (error) {
        console.error('Category update error:', error);
        res.status(500).json({ message: `Error updating category: ${error.message}` });
    }
};

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        await Category.findByIdAndUpdate(categoryId, { isActive: false });
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: `Error deleting category: ${error}` });
    }
};

// Get users by role with search and count
export const getUsersByRole = async (req, res) => {
    try {
        const { role, search } = req.query;
        
        let query = {};
        if (role && role !== 'all') {
            query.role = role;
        }
        
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }
        
        const users = await User.find(query).select("-password -resetOtp");
        
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: `Error fetching users: ${error}` });
    }
};

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments({ role: "user" });
        const ownerCount = await User.countDocuments({ role: "owner" });
        const deliveryBoyCount = await User.countDocuments({ role: "deliveryBoy", isApproved: true });
        const pendingOwnerCountActual = await User.countDocuments({ role: "owner", isApproved: false });
        
        res.status(200).json({
            userCount,
            ownerCount,
            deliveryBoyCount,
            pendingOwnerCount: pendingOwnerCountActual, // Field name expected by frontend
        });
    } catch (error) {
        res.status(500).json({ message: `Error fetching dashboard stats: ${error}` });
    }
};

// Get all user types
export const getUserTypes = async (req, res) => {
    try {
        const userTypes = await UserType.find({ isActive: true });
        res.status(200).json(userTypes);
    } catch (error) {
        res.status(500).json({ message: `Error fetching user types: ${error}` });
    }
};

// Create new user type
export const createUserType = async (req, res) => {
    try {
        const { name, description, deliveryAllowed } = req.body;
    
        // --- Backend Validation ---
        const normalizedName = (name || "").trim();
        const normalizedDesc = (description || "").trim();

        // Regex: Only alphabets and spaces
        const alphaRegex = /^[A-Za-z\s]+$/;

        // Name validation
        if (!normalizedName) {
            return res.status(400).json({ message: "Name is required" });
        }
        if (!alphaRegex.test(normalizedName) || normalizedName.length < 3 || normalizedName.length > 50) {
            return res.status(400).json({ message: "User Type Name must be 3–50 letters only" });
        }

        // Description validation
        if (!normalizedDesc) {
            return res.status(400).json({ message: "Description is required" });
        }
        if (!alphaRegex.test(normalizedDesc) || normalizedDesc.length < 3 || normalizedDesc.length > 50) {
            return res.status(400).json({ message: "Description must be 3–50 letters only" });
        }
        // --- End Validation ---
    
        const nameRegex = new RegExp(`^${normalizedName}$`, 'i');
    
        // Block if an ACTIVE user type exists with same name (case-insensitive)
        const existingActive = await UserType.findOne({ name: nameRegex, isActive: true });
        if (existingActive) {
            return res.status(400).json({ message: "User type already exists" });
        }
    
        // If an INACTIVE user type exists, restore it instead of creating a new one
        const existingInactive = await UserType.findOne({ name: nameRegex, isActive: false });
        if (existingInactive) {
            existingInactive.description = normalizedDesc;
            if (typeof deliveryAllowed === 'boolean') {
                existingInactive.deliveryAllowed = deliveryAllowed;
            }
            existingInactive.isActive = true;
            await existingInactive.save();
            return res.status(200).json(existingInactive);
        }
    
        // Otherwise, create brand new
        const userType = await UserType.create({
            name: normalizedName,
            description: normalizedDesc,
            deliveryAllowed
        });
        res.status(201).json(userType);
    } catch (error) {
        res.status(500).json({ message: `Error creating user type: ${error?.message || error}` });
    }
};

// Update user type delivery permission
export const updateUserTypeDelivery = async (req, res) => {
    try {
        const { userTypeId } = req.params;
        const { deliveryAllowed } = req.body;
        
        const userType = await UserType.findByIdAndUpdate(
            userTypeId, 
            { deliveryAllowed }, 
            { new: true }
        );
        
        if (!userType) {
            return res.status(404).json({ message: "User type not found" });
        }
        
        // Update all users of this type
        await User.updateMany(
            { userType: userType.name },
            { deliveryAllowed }
        );
        
        res.status(200).json({ message: "User type delivery permission updated successfully", userType });
    } catch (error) {
        res.status(500).json({ message: `Error updating user type: ${error}` });
    }
};

// Delete user type
export const deleteUserType = async (req, res) => {
    try {
        const { userTypeId } = req.params;
    
        const deleted = await UserType.findByIdAndDelete(userTypeId);
        if (!deleted) {
            return res.status(404).json({ message: "User type not found" });
        }
    
        res.status(200).json({ message: "User type deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: `Error deleting user type: ${error?.message || error}` });
    }
};

// Clear all sample data
export const clearSampleData = async (req, res) => {
    try {
        // Delete all users except superadmin
        await User.deleteMany({ role: { $ne: "superadmin" } });
        
        // Clear categories except essential ones
        await Category.deleteMany({});
        
        // Clear user types
        await UserType.deleteMany({});
        
        res.status(200).json({ message: "Sample data cleared successfully" });
    } catch (error) {
        res.status(500).json({ message: `Error clearing sample data: ${error}` });
    }
};