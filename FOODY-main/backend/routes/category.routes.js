import express from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/superadmin.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

// Middleware to check if user is hotel owner
const isOwner = (req, res, next) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ message: "Access denied. Hotel Owners only." });
    }
    next();
};

// Public category routes (accessible by all users)
router.get("/", getCategories);

// Protected Category management routes (Owners only)
router.post("/", isAuth, isOwner, upload.single("image"), createCategory);
router.put("/:categoryId", isAuth, isOwner, upload.single("image"), updateCategory);
router.delete("/:categoryId", isAuth, isOwner, deleteCategory);

export default router;