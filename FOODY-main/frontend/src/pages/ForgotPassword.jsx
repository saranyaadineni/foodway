import React, { useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";
import { ClipLoader } from "react-spinners";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const result = await authAPI.sendOtp(email);
      console.log(result);
      setErr("");
      setStep(2);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to send OTP");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const result = await authAPI.verifyOtp(email, otp);
      console.log(result);
      setErr("");
      setStep(3);
    } catch (error) {
      setErr(error?.response?.data?.message || "Invalid OTP");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
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
            onClick={() => navigate("/signin")}
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
                placeholder="Enter the OTP sent to your email"
                onChange={(e) => setOtp(e.target.value)}
                value={otp}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] bg-white/80 placeholder-gray-400 transition-all hover:border-[#fc8019]/60"
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
            <div className="mb-6">
              <label
                htmlFor="newPassword"
                className="block text-gray-700 font-semibold mb-1 text-sm"
              >
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                onChange={(e) => setNewPassword(e.target.value)}
                value={newPassword}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#fc8019] bg-white/80 placeholder-gray-400 transition-all hover:border-[#ff2b85]/60"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 font-semibold mb-1 text-sm"
              >
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] bg-white/80 placeholder-gray-400 transition-all hover:border-[#fc8019]/60"
              />
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
