import React, { useState, useEffect } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateField = (name, value) => {
    let errors = { ...fieldErrors };
    
    if (name === "fullName") {
      if (!value || !value.trim()) {
        errors.fullName = "Full name is required";
      } else if (!/^[A-Za-z\s]+$/.test(value)) {
        errors.fullName = "Full name must contain only letters";
      } else if (value.trim().length < 3 || value.trim().length > 50) {
        errors.fullName = "Full name must be between 3 and 50 characters";
      } else {
        delete errors.fullName;
      }
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !value.trim()) {
        errors.email = "Email is required";
      } else if (!emailRegex.test(value)) {
        errors.email = "Please enter a valid email address";
      } else if (value.length > 100) {
        errors.email = "Email is too long";
      } else {
        delete errors.email;
      }
    }

    if (name === "mobile") {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!value || !value.trim()) {
        errors.mobile = "Mobile number is required";
      } else if (!mobileRegex.test(value)) {
        errors.mobile = "Enter a valid 10-digit mobile number";
      } else {
        delete errors.mobile;
      }
    }

    if (name === "password") {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!value) {
        errors.password = "Password is required";
      } else if (value.length < 8) {
        errors.password = "Password must be at least 8 characters long";
      } else if (!passwordRegex.test(value)) {
        errors.password = "Must include uppercase, lowercase, numbers, and symbols";
      } else {
        delete errors.password;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
    // Validate all fields
    const isNameValid = validateField("fullName", fullName);
    const isEmailValid = validateField("email", email);
    const isMobileValid = validateField("mobile", mobile);
    const isPasswordValid = validateField("password", password);

    if (!isNameValid || !isEmailValid || !isMobileValid || !isPasswordValid) {
      setErr("Please fix the validation errors before signing up");
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.signup({
        fullName: fullName.trim(),
        email: email.trim(),
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
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              validateField("fullName", e.target.value);
            }}
            required
            className={`w-full border ${fieldErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
          />
          {fieldErrors.fullName && (
            <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1 text-sm">
            Email
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateField("email", e.target.value);
            }}
            required
            className={`w-full border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
          />
          {fieldErrors.email && (
            <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">{fieldErrors.email}</p>
          )}
        </div>

        {/* Mobile */}
        <div className="mb-4">
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
                validateField("mobile", value);
              }
            }}
            required
            className={`w-full border ${fieldErrors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
          />
          {fieldErrors.mobile && (
            <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">{fieldErrors.mobile}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
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
                validateField("password", e.target.value);
              }}
              required
              className={`w-full border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-2.5 pr-10 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] hover:border-[#ff4d2d]/60 transition-all`}
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
            <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">{fieldErrors.password}</p>
          )}
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
          disabled={loading || Object.keys(fieldErrors).length > 0}
          className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {loading ? <ClipLoader size={22} color="white" /> : "Sign Up"}
        </button>

        {/* Error */}
        {err && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-600 px-4 py-2 rounded-lg text-sm text-center font-medium shadow-sm">
            {err}
          </div>
        )}

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
