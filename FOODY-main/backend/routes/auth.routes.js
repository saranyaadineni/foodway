import express from "express";
import {
    resetPassword,
    sendOtp,
    signIn,
    signOut,
    signUp,
    verifyOtp
} from "../controllers/auth.controllers.js";
import { getUserTypes } from "../controllers/superadmin.controllers.js";

import isAuth from "../middlewares/isAuth.js";

const authRouter = express.Router();

authRouter.post("/signup",signUp)
authRouter.post("/signin",signIn)

// Information for browser testing
authRouter.get("/signup", (req, res) => res.status(405).json({ message: "Registration must use POST method" }));
authRouter.get("/signin", (req, res) => res.status(405).json({ message: "Login must use POST method" }));

authRouter.get("/signout",signOut)
authRouter.post("/send-otp",sendOtp)
authRouter.post("/verify-otp",verifyOtp)
authRouter.post("/reset-password",resetPassword)

// Testing/Health check route
authRouter.get("/status", (req, res) => res.json({ status: "Auth service is running" }));

// Public endpoint for user types (needed for signup)
authRouter.get("/user-types", getUserTypes)

export default authRouter