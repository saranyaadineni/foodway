import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";
import UserType from "../models/usertype.model.js";

export const signUp=async (req,res) => {
    try {
        const {fullName,email,password,mobile,role,userType}=req.body

        // --- Backend Validation ---
        
        // Full Name Validation
        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ message: "Full name is required" });
        }
        const trimmedFullName = fullName.trim();
        if (!/^[A-Za-z\s]+$/.test(trimmedFullName)) {
            return res.status(400).json({ message: "Full name must contain only letters" });
        }
        if (trimmedFullName.length < 3 || trimmedFullName.length > 50) {
            return res.status(400).json({ message: "Full name must be between 3 and 50 characters" });
        }

        // Email Validation
        if (!email || !email.trim()) {
            return res.status(400).json({ message: "Email is required" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address" });
        }
        if (email.length > 100) {
            return res.status(400).json({ message: "Email is too long" });
        }

        // Mobile Validation
        if (!mobile || !mobile.trim()) {
            return res.status(400).json({ message: "Mobile number is required" });
        }
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
        }

        // Password Validation
        if (!password || password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Password must include uppercase, lowercase, numbers, and special characters" });
        }

        // --- End Validation ---

        let user=await User.findOne({email})
        if(user){
            return res.status(400).json({message:"User Already exist."})
        }
     
        const hashedPassword=await bcrypt.hash(password,10)
        
        // Create user data object
        const userData = {
            fullName: trimmedFullName,
            email,
            role,
            mobile,
            password:hashedPassword
        };
        
        // Add userType only for users
        if(role === "user" && userType) {
            userData.userType = userType;
            
            // Set delivery permission based on user type
            const userTypeDoc = await UserType.findOne({ name: userType });
            if(userTypeDoc) {
                userData.deliveryAllowed = userTypeDoc.deliveryAllowed;
            }
        }
        
        user=await User.create(userData)

        // For owners and delivery boys, do NOT authenticate on signup
        if (user.role === "owner" || user.role === "deliveryBoy") {
            return res.status(201).json({
                message: "Account created. Pending superadmin approval.",
                pendingApproval: true
            })
        }

        const token=await genToken(user)
        const isProd = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https'
        const cookieOptions = {
            httpOnly: true,
            maxAge: 7*24*60*60*1000,
            secure: !!isProd,
            sameSite: isProd ? 'none' : 'lax'
        }
        res.cookie("token",token,cookieOptions)

        return res.status(201).json({ ...user.toObject(), token })

    } catch (error) {
        return res.status(500).json(`sign up error ${error}`)
    }
}

export const signIn=async (req,res) => {
    try {
        const {email,password}=req.body
        if (!email) {
            return res.status(400).json({message:"Email is required"})
        }
        if (!password) {
            return res.status(400).json({message:"Password is required"})
        }

        const user=await User.findOne({email})
        if(!user){
            return res.status(400).json({message:"Invalid email or password"})
        }
        // If the account was created via Google auth, there may be no password
        if(!user.password){
            return res.status(400).json({message:"This account uses Google Sign-In. Please sign in with Google or set a password using Forgot Password."})
        }
        
        // Require approval for owners and delivery boys before login
        if((user.role === "deliveryBoy" || user.role === "owner") && !user.isApproved){
            return res.status(403).json({message:"Your account is pending approval from superadmin."})
        }
        
     const isMatch=await bcrypt.compare(password,user.password)
     if(!isMatch){
         return res.status(400).json({message:"Invalid email or password"})
     }

    const token=await genToken(user)
        const isProd = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https'
        const cookieOptions = {
            httpOnly: true,
            maxAge: 7*24*60*60*1000,
            secure: !!isProd,
            sameSite: isProd ? 'none' : 'lax'
        }
        res.cookie("token",token,cookieOptions)
  
        return res.status(200).json({ ...user.toObject(), token })

    } catch (error) {
        console.error('Sign in error:', error)
        return res.status(500).json({message:"Internal Server Error during sign-in"})
    }
}

export const signOut=async (req,res) => {
    try {
        res.clearCookie("token")
return res.status(200).json({message:"log out successfully"})
    } catch (error) {
        return res.status(500).json(`sign out error ${error}`)
    }
}

export const sendOtp=async (req,res) => {
  try {
    const {email}=req.body
    
    if (!email) {
      return res.status(400).json({message: "Email is required"})
    }
    
    const user=await User.findOne({email})
    if(!user){
       return res.status(400).json({message:"User does not exist."})
    }
    
    const otp=Math.floor(1000 + Math.random() * 9000).toString()
    user.resetOtp=otp
    user.otpExpires=Date.now()+5*60*1000
    user.isOtpVerified=false
    await user.save()
    
    console.log(`[AUTH] Generated OTP for ${email}: ${otp}`)
    
    try {
      await sendOtpMail(email, otp)
      console.log(`[AUTH] OTP email sent successfully to ${email}`)
      return res.status(200).json({message: "OTP sent successfully to your email"})
    } catch (emailError) {
      console.error(`[AUTH] Failed to send OTP email to ${email}:`, emailError)
      // Still return success but with a note about email delivery
      return res.status(200).json({
        message: "OTP generated successfully. If you don't receive the email, please check your spam folder or try again.",
        warning: "Email delivery may be delayed"
      })
    }
  } catch (error) {
     console.error('[AUTH] Send OTP error:', error)
     return res.status(500).json({message: `Send OTP error: ${error.message}`})
  }  
}

export const verifyOtp=async (req,res) => {
    try {
        const {email,otp}=req.body
        const user=await User.findOne({email})
        if(!user || user.resetOtp!=otp || user.otpExpires<Date.now()){
            return res.status(400).json({message:"invalid/expired otp"})
        }
        user.isOtpVerified=true
        user.resetOtp=undefined
        user.otpExpires=undefined
        await user.save()
        return res.status(200).json({message:"otp verify successfully"})
    } catch (error) {
         return res.status(500).json(`verify otp error ${error}`)
    }
}

export const resetPassword=async (req,res) => {
    try {
        const {email,newPassword}=req.body
        const user=await User.findOne({email})
    if(!user || !user.isOtpVerified){
       return res.status(400).json({message:"otp verification required"})
    }
    const hashedPassword=await bcrypt.hash(newPassword,10)
    user.password=hashedPassword
    user.isOtpVerified=false
    await user.save()
     return res.status(200).json({message:"password reset successfully"})
    } catch (error) {
         return res.status(500).json(`reset password error ${error}`)
    }
}

export const googleAuth=async (req,res) => {
    try {
        const {fullName,email,role,mobile,userType}=req.body
        let user=await User.findOne({email})
        if(user){
            const token=await genToken(user)
            const isProd = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https'
            const cookieOptions = {
                httpOnly: true,
                maxAge: 7*24*60*60*1000,
                secure: !!isProd,
                sameSite: isProd ? 'none' : 'lax'
            }
            res.cookie("token",token,cookieOptions)
            return res.status(200).json({ ...user.toObject(), token })
        }
        
        // Create user data object
        const userData = {
            fullName,
            email,
            role,
            mobile
        };
        
        // Add userType only for users
        if(role === "user" && userType) {
            userData.userType = userType;
            
            // Set delivery permission based on user type
            const userTypeDoc = await UserType.findOne({ name: userType });
            if(userTypeDoc) {
                userData.deliveryAllowed = userTypeDoc.deliveryAllowed;
            }
        }
        
        user=await User.create(userData)

        // For owners and delivery boys, do NOT authenticate on signup
        if (user.role === "owner" || user.role === "deliveryBoy") {
            return res.status(201).json({
                message: "Account created. Pending superadmin approval.",
                pendingApproval: true
            })
        }

        const token=await genToken(user)
        const isProd = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https'
        const cookieOptions = {
            httpOnly: true,
            maxAge: 7*24*60*60*1000,
            secure: !!isProd,
            sameSite: isProd ? 'none' : 'lax'
        }
        res.cookie("token",token,cookieOptions)
        return res.status(201).json({ ...user.toObject(), token })

    } catch (error) {
        return res.status(500).json(`google auth error ${error}`)
    }
}
