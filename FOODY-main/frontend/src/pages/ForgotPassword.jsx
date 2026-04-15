import React, { useState } from "react";
import { IoIosArrowRoundBack, IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";
import { ClipLoader } from "react-spinners";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleBack = () => {
    navigate("/signin");
  };

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErr("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      // Add a custom timeout for OTP sending if needed, though the backend should be fast now
      const result = await authAPI.sendOtp(email);
      console.log(result);
      setErr("");
      setStep(2);
    } catch (error) {
      console.error("OTP send error:", error);
      if (error.code === 'ECONNABORTED') {
        setErr("Request timed out. The server might be waking up. Please try again in a few seconds.");
      } else {
        setErr(error?.response?.data?.message || error?.message || "Failed to send OTP");
      }
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      setErr("Invalid or expired OTP");
      return;
    }
    setLoading(true);
    try {
      const result = await authAPI.verifyOtp(email, otp);
      console.log(result);
      setErr("");
      setStep(3);
    } catch (error) {
      setErr("Invalid or expired OTP");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setErr("Passwords cannot be empty");
      return;
    }
    if (newPassword.length < 6) {
      setErr("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const result = await authAPI.resetPassword(email, newPassword);
      console.log(result);
      setErr("");
      navigate("/signin");
    } catch (error) {
      setErr(error?.response?.data?.message || "Reset failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#fff2eb] via-[#ffe7db] to-[#ffd9c9] relative overflow-hidden px-4">
      {/* Background blobs */}
      <div className="absolute w-[30rem] h-[30rem] bg-[#fc8019]/25 rounded-full blur-3xl top-20 left-12 animate-pulse" />
      <div className="absolute w-[26rem] h-[26rem] bg-[#ff2b85]/25 rounded-full blur-3xl bottom-16 right-12 animate-pulse" />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 sm:p-10 transition-transform duration-300 hover:scale-[1.01]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <IoIosArrowRoundBack
            size={36}
            className="text-[#ff2b85] cursor-pointer hover:text-[#fc8019] transition"
            onClick={handleBack}
          />
          <h1 className="text-3xl font-extrabold text-[#fc8019] tracking-tight drop-shadow-sm">
            Forgot Password
          </h1>
        </div>

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-gray-700 font-semibold mb-1 text-sm"
              >
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your registered email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#fc8019] bg-white/80 placeholder-gray-400 transition-all hover:border-[#ff2b85]/60"
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-60"
            >
              {loading ? <ClipLoader size={20} color="white" /> : "Send OTP"}
            </button>
            {err && (
              <p className="text-red-500 text-center my-3 text-sm font-medium">
                *{err}
              </p>
            )}
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="otp"
                className="block text-gray-700 font-semibold mb-1 text-sm"
              >
                Enter OTP
              </label>
              <input
                type="text"
                placeholder="Enter 4-digit OTP"
                maxLength="4"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 4) setOtp(val);
                }}
                value={otp}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] bg-white/80 placeholder-gray-400 transition-all hover:border-[#fc8019]/60 text-center text-2xl font-bold tracking-[0.5em]"
              />
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-60"
            >
              {loading ? <ClipLoader size={20} color="white" /> : "Verify OTP"}
            </button>
            {err && (
              <p className="text-red-500 text-center my-3 text-sm font-medium">
                *{err}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <div>
            <div className="mb-6 relative">
              <label
                htmlFor="newPassword"
                className="block text-gray-700 font-semibold mb-1 text-sm"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  onChange={(e) => setNewPassword(e.target.value)}
                  value={newPassword}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#fc8019] bg-white/80 placeholder-gray-400 transition-all hover:border-[#ff2b85]/60 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#fc8019] transition-colors"
                >
                  {showNewPassword ? <IoMdEyeOff size={22} /> : <IoMdEye size={22} />}
                </button>
              </div>
            </div>
            <div className="mb-6 relative">
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 font-semibold mb-1 text-sm"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] bg-white/80 placeholder-gray-400 transition-all hover:border-[#fc8019]/60 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#ff2b85] transition-colors"
                >
                  {showConfirmPassword ? <IoMdEyeOff size={22} /> : <IoMdEye size={22} />}
                </button>
              </div>
            </div>
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-60"
            >
              {loading ? (
                <ClipLoader size={20} color="white" />
              ) : (
                "Reset Password"
              )}
            </button>
            {err && (
              <p className="text-red-500 text-center my-3 text-sm font-medium">
                *{err}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
