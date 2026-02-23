import React, { useState, useEffect } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";
import { ClipLoader } from "react-spinners";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

function SignUp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [userType, setUserType] = useState("");
  const [userTypes, setUserTypes] = useState([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const response = await authAPI.getUserTypes();
        setUserTypes(response.data);
        if (response.data.length > 0) {
          setUserType(response.data[0].name);
        }
      } catch (error) {
        console.error("Error fetching user types:", error);
      }
    };
    fetchUserTypes();
  }, []);

  const handleSignUp = async () => {
    if (mobile.length !== 10) {
      setErr("Mobile number must be exactly 10 digits");
      return;
    }
    setLoading(true);
    try {
      const result = await authAPI.signup({
        fullName,
        email,
        password,
        mobile,
        role,
        userType: role === "user" ? userType : undefined,
      });

      if (result.data && result.data.pendingApproval) {
        setErr("Account created. Pending superadmin approval.");
        setLoading(false);
        navigate("/signin");
        return;
      }

      if (result.data?.token) {
        localStorage.setItem('token', result.data.token)
      }
      dispatch(setUserData(result.data));
      setErr("");
      setLoading(false);
      navigate("/");
    } catch (error) {
      setErr(error?.response?.data?.message || "Sign-up failed");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErr("Google sign-up is currently unavailable. Please sign up with email and password.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff2eb] via-[#ffe7db] to-[#ffd9c9] relative overflow-hidden px-4">
      {/* Floating blobs for aesthetic depth */}
      <div className="absolute w-[26rem] h-[26rem] bg-[#fc8019]/25 rounded-full blur-3xl top-16 left-10 animate-pulse" />
      <div className="absolute w-[26rem] h-[26rem] bg-[#ff2b85]/25 rounded-full blur-3xl bottom-12 right-10 animate-pulse" />

      {/* Signup Card */}
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-10 transition-transform duration-300 hover:scale-[1.02]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85] drop-shadow-md">
            Food<span className="text-[#ff2b85]">Way</span>
          </h1>
          <p className="text-gray-600 text-sm mt-2 font-medium">
            Create your account and start your food journey 🍕
          </p>
        </div>

        {/* Full Name */}
        <div className="mb-5">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
          />
        </div>

        {/* Email */}
        <div className="mb-5">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Email
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

        {/* Mobile */}
        <div className="mb-5">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Mobile Number
          </label>
          <input
            type="text"
            placeholder="Enter your mobile number"
            value={mobile}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value) && value.length <= 10) {
                setMobile(value);
              }
            }}
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

        {/* Role Selector */}
        <div className="mb-5">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Select Role
          </label>
          <div className="flex gap-2">
            {["user", "owner", "deliveryBoy"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-xl font-semibold border transition-all duration-200 ${
                  role === r
                    ? "bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white"
                    : "border-[#ff2b85] text-[#ff2b85] hover:bg-[#fff1f5]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* User Type (Only for user role) */}
        {role === "user" && (
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-1 text-sm">
              User Type
            </label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
            >
              <option value="">Select User Type</option>
              {userTypes.map((type) => (
                <option key={type._id} value={type.name}>
                  {type.name}{" "}
                  {type.deliveryAllowed
                    ? "(Delivery Available)"
                    : "(Pickup Only)"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sign Up Button */}
        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 disabled:opacity-60"
        >
          {loading ? <ClipLoader size={22} color="white" /> : "Sign Up"}
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

        {/* Signin Link */}
        <p className="text-center mt-6 text-gray-700 text-sm font-medium">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/signin")}
            className="text-[#ff2b85] font-semibold cursor-pointer hover:underline"
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
