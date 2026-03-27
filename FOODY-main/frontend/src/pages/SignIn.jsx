import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash, FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";
import { ClipLoader } from "react-spinners";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { auth } from "../../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

function SignIn() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validateFields = () => {
    let errors = {};
    if (!email && !password) {
      setErr("Please fill out all required fields");
      return false;
    }
    if (!email || !email.trim()) {
      errors.email = "Please enter the email ID";
    }
    if (!password || !password.trim()) {
      errors.password = "Please enter the password";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async () => {
    setErr("");
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.signin({ email, password });
      if (result.status === 200) {
        if (result.data?.token) {
          localStorage.setItem('token', result.data.token)
        }
        dispatch(setUserData(result.data));
        navigate("/");
      } else {
        setErr(result.data?.message || "Sign-in failed");
      }
    } catch (error) {
      setErr(error?.response?.data?.message || "Sign-in request error");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErr("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Call your backend to handle Google authentication
      const backendResult = await authAPI.googleAuth({
        fullName: user.displayName,
        email: user.email,
        role: "user", // Default role
        mobile: user.phoneNumber || "",
        userType: "" // Default userType
      });

      if (backendResult.data?.token) {
        localStorage.setItem('token', backendResult.data.token);
      }
      dispatch(setUserData(backendResult.data));
      navigate("/");
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErr(error?.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff2eb] via-[#ffe7db] to-[#ffd9c9] relative overflow-hidden px-4">
      {/* Floating blobs for warm depth */}
      <div className="absolute w-[26rem] h-[26rem] bg-[#fc8019]/25 rounded-full blur-3xl top-16 left-10 animate-pulse" />
      <div className="absolute w-[26rem] h-[26rem] bg-[#ff2b85]/25 rounded-full blur-3xl bottom-12 right-10 animate-pulse" />

      {/* Auth card */}
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-10 transition-transform duration-300 hover:scale-[1.02]">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85] drop-shadow-md">
            Food<span className="text-[#ff2b85]">Way</span>
          </h1>
          <p className="text-gray-600 text-sm mt-2 font-medium">
            Craving something tasty? Sign in to order now 🍔
          </p>
        </div>

        {/* Email */}
        <div className="mb-5">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Email Address
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: "" }));
            }}
            required
            className={`w-full border ${fieldErrors.email ? "border-red-500" : "border-gray-300"} rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
          />
          {fieldErrors.email && (
            <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-5">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: "" }));
              }}
              required
              className={`w-full border ${fieldErrors.password ? "border-red-500" : "border-gray-300"} rounded-xl px-4 py-2.5 pr-10 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] hover:border-[#ff4d2d]/60 transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-[#ff2b85] transition"
            >
              {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Forgot Password */}
        <div
          className="text-right text-sm text-[#fc8019] font-medium mb-5 hover:underline cursor-pointer"
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password?
        </div>

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={loading || googleLoading}
          className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 disabled:opacity-60"
        >
          {loading ? <ClipLoader size={22} color="white" /> : "Sign In"}
        </button>

        {/* Continue with Google */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <span className="relative bg-white px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
            or
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-lg shadow-sm hover:shadow-md hover:bg-gray-50 flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-60"
        >
          {googleLoading ? (
            <ClipLoader size={22} color="#fc8019" />
          ) : (
            <>
              <FaGoogle className="text-[#ea4335]" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Error */}
        {err && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-600 px-4 py-2 rounded-lg text-sm text-center font-medium shadow-sm">
            {err}
          </div>
        )}

        {/* Signup */}
        <p className="text-center mt-6 text-gray-700 text-sm font-medium">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-[#ff2b85] font-semibold cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}

export default SignIn;
