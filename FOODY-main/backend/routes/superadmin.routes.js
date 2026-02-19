import express from "express";
import { 
    getPendingOwners, 
    updateOwnerStatus, 
    getPendingDeliveryBoys,
    updateDeliveryBoyStatus,
    getCategories, 
    createCategory, 
    updateCategory,
    deleteCategory, 
    getUsersByRole, 
    getDashboardStats,
    getUserTypes,
    createUserType,
    updateUserTypeDelivery,
    deleteUserType
} from "../controllers/superadmin.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

// Middleware to check if user is superadmin
const isSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied. Superadmin only." });
    }
    next();
};

// Owner management routes
router.get("/pending-owners", isAuth, isSuperAdmin, getPendingOwners);
router.post("/update-owner-status", isAuth, isSuperAdmin, updateOwnerStatus);
router.post("/update-owner-status/:userId", isAuth, isSuperAdmin, (req, res, next) => {
    req.body.userId = req.params.userId;
    next();
}, updateOwnerStatus);

// Delivery boy management routes
router.get("/pending-deliveryboys", isAuth, isSuperAdmin, getPendingDeliveryBoys);
router.get("/pending-delivery-boys", isAuth, isSuperAdmin, getPendingDeliveryBoys);
router.post("/update-deliveryboy-status", isAuth, isSuperAdmin, updateDeliveryBoyStatus);
router.post("/update-delivery-boy-status/:userId", isAuth, isSuperAdmin, (req, res, next) => {
    req.body.userId = req.params.userId;
    next();
}, updateDeliveryBoyStatus);
// Endpoint aliases for robustness (handle common variations)
router.post("/update-delivery-boy-status", isAuth, isSuperAdmin, updateDeliveryBoyStatus);
router.post("/deliveryboys/update-status", isAuth, isSuperAdmin, updateDeliveryBoyStatus);

// Category management routes
router.get("/categories", isAuth, isSuperAdmin, getCategories);
router.post("/categories", isAuth, isSuperAdmin, upload.single("image"), createCategory);
router.post("/create-category", isAuth, isSuperAdmin, upload.single("image"), createCategory);
router.put("/categories/:categoryId", isAuth, isSuperAdmin, upload.single("image"), updateCategory);
router.post("/update-category/:categoryId", isAuth, isSuperAdmin, upload.single("image"), updateCategory);
router.delete("/categories/:categoryId", isAuth, isSuperAdmin, deleteCategory);
router.delete("/delete-category/:categoryId", isAuth, isSuperAdmin, deleteCategory);

// User search and management routes
router.get("/users", isAuth, isSuperAdmin, getUsersByRole);
router.get("/dashboard-stats", isAuth, isSuperAdmin, getDashboardStats);

// User type management routes
router.get("/user-types", isAuth, isSuperAdmin, getUserTypes);
router.post("/user-types", isAuth, isSuperAdmin, createUserType);
router.post("/create-user-type", isAuth, isSuperAdmin, createUserType);
router.put("/user-types/:userTypeId/delivery", isAuth, isSuperAdmin, updateUserTypeDelivery);
router.post("/update-user-type-delivery/:userTypeId", isAuth, isSuperAdmin, updateUserTypeDelivery);
router.delete("/user-types/:userTypeId", isAuth, isSuperAdmin, deleteUserType);
router.delete("/delete-user-type/:userTypeId", isAuth, isSuperAdmin, deleteUserType);

export default router;