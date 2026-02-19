import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { ClipLoader } from "react-spinners";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

function SignIn() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setErr("");
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

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErr("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { data } = await authAPI.googleAuth({ email: result.user.email });
      if (data?.token) {
        localStorage.setItem('token', data.token)
      }
      dispatch(setUserData(data));
      navigate("/");
    } catch (error) {
      console.log(error);
      setErr(error?.response?.data?.message || "Google sign-in failed");
    }
    setLoading(false);
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
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
          />
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
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] hover:border-[#ff4d2d]/60 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-[#ff2b85] transition"
            >
              {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
            </button>
          </div>
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
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 disabled:opacity-60"
        >
          {loading ? <ClipLoader size={22} color="white" /> : "Sign In"}
        </button>

        {/* Error */}
        {err && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-600 px-4 py-2 rounded-lg text-sm text-center font-medium shadow-sm">
            {err}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300" />
          <span className="mx-3 text-gray-500 text-sm font-medium">or</span>
          <div className="flex-grow border-t border-gray-300" />
        </div>

        {/* Google Auth */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl bg-white hover:bg-[#fff9f7] hover:shadow-md transition-all"
        >
          <FcGoogle size={22} />
          <span className="font-semibold text-gray-700">
            Continue with Google
          </span>
        </button>

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
