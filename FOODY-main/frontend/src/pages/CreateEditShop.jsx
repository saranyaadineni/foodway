import React, { useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaStore } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { setMyShopData } from "../redux/ownerSlice";
import { shopAPI, getImageUrl } from "../api";

function CreateEditShop() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { myShopData } = useSelector((state) => state.owner);
  const { currentCity, currentState, currentAddress } = useSelector(
    (state) => state.user
  );

  const [name, setName] = useState(myShopData?.name || "");
  const [address, setAddress] = useState(myShopData?.address || "");
  const [city, setCity] = useState(myShopData?.city || "");
  const [state, setState] = useState(myShopData?.state || "");
  const [frontendImage, setFrontendImage] = useState(getImageUrl(myShopData?.image) || null);
  const [backendImage, setBackendImage] = useState(null);
  const [upiVpa, setUpiVpa] = useState(myShopData?.upiVpa || "");
  const [upiPayeeName, setUpiPayeeName] = useState(myShopData?.upiPayeeName || "");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (fieldName, value, existingErrors = null) => {
    let errors = existingErrors ? { ...existingErrors } : { ...fieldErrors };
    
    if (fieldName === "name") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        errors.name = "Shop name cannot be empty";
      } else if (!/^[A-Za-z\s]+$/.test(trimmed)) {
        errors.name = "Please enter a valid shop name (letters only)";
      } else if (trimmed.length < 3 || trimmed.length > 50) {
        errors.name = "Shop name must be between 3 and 50 characters";
      } else {
        delete errors.name;
      }
    }

    if (fieldName === "upiPayeeName") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        errors.upiPayeeName = "Payee name is required";
      } else if (!/^[A-Za-z\s]+$/.test(trimmed)) {
        errors.upiPayeeName = "Invalid payee name";
      } else {
        delete errors.upiPayeeName;
      }
    }

    if (fieldName === "city") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        errors.city = "City is required";
      } else if (!/^[A-Za-z\s]+$/.test(trimmed)) {
        errors.city = "Invalid city name";
      } else {
        delete errors.city;
      }
    }

    if (fieldName === "state") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        errors.state = "State is required";
      } else if (!/^[A-Za-z\s]+$/.test(trimmed)) {
        errors.state = "Invalid state name";
      } else {
        delete errors.state;
      }
    }

    if (fieldName === "address") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        errors.address = "Address is required";
      } else {
        delete errors.address;
      }
    }

    if (fieldName === "image") {
      if (!value && !frontendImage) {
        errors.image = "Please upload shop image";
      } else {
        delete errors.image;
      }
    }

    if (!existingErrors) {
      setFieldErrors(errors);
    }
    return errors;
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
      validateField("image", file);
    }
  };

  const removeImage = () => {
    setBackendImage(null);
    setFrontendImage(null);
    validateField("image", null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation check - aggregate all errors
    let errors = {};
    errors = validateField("name", name, errors);
    errors = validateField("city", city, errors);
    errors = validateField("state", state, errors);
    errors = validateField("address", address, errors);
    errors = validateField("image", backendImage, errors);
    errors = validateField("upiPayeeName", upiPayeeName, errors);

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("address", address);
      if (backendImage) formData.append("image", backendImage);
      if (upiVpa) formData.append("upiVpa", upiVpa);
      if (upiPayeeName) formData.append("upiPayeeName", upiPayeeName);

      const result = await shopAPI.createEdit(formData);
      dispatch(setMyShopData(result.data));
      navigate("/");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff2eb] via-[#ffe7db] to-[#ffd9c9] relative overflow-hidden px-4">
      {/* Floating Blobs */}
      <div className="absolute w-[26rem] h-[26rem] bg-[#fc8019]/25 rounded-full blur-3xl top-16 left-10 animate-pulse" />
      <div className="absolute w-[26rem] h-[26rem] bg-[#ff2b85]/25 rounded-full blur-3xl bottom-12 right-10 animate-pulse" />

      {/* Back Button */}
      <div
        className="absolute top-[20px] left-[20px] z-[10] mb-[10px] cursor-pointer hover:scale-110 transition-transform"
        onClick={() => navigate("/")}
      >
        <IoIosArrowRoundBack size={40} className="text-[#ff2b85]" />
      </div>

      {/* Shop Card */}
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-10 transition-transform duration-300 hover:scale-[1.02]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#fc8019]/20 p-5 rounded-full">
              <FaStore className="text-[#ff2b85] w-10 h-10" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85] drop-shadow-md">
            {myShopData ? "Edit Shop" : "Add Shop"}
          </h1>
          <p className="text-gray-600 text-sm mt-2 font-medium">
            Manage your FoodWay store details 🏪
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Shop Name */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm uppercase tracking-wider">
              Shop Name <span className="text-[#ff2b85]">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter shop name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateField("name", e.target.value);
              }}
              required
              className={`w-full border ${fieldErrors.name ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
            />
            {fieldErrors.name && (
              <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">{fieldErrors.name}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm uppercase tracking-wider">
              Shop Image <span className="text-[#ff2b85]">*</span>
            </label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className={`w-full border ${fieldErrors.image ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] hover:border-[#ff4d2d]/60 transition-all text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#fc8019] hover:file:bg-orange-100 cursor-pointer`}
              />
              {backendImage ? (
                <p className="text-[10px] text-green-500 mt-1 ml-1 font-bold animate-pulse">
                  ✓ Selected: {backendImage.name}
                </p>
              ) : !frontendImage && (
                <p className="text-[10px] text-gray-400 mt-1 ml-1 font-medium italic">
                  No file chosen
                </p>
              )}
            </div>
            {fieldErrors.image && (
              <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">{fieldErrors.image}</p>
            )}
            {frontendImage && (
              <div className="mt-4 animate-fade-in relative group">
                <img
                  src={frontendImage}
                  alt="Shop Preview"
                  className="w-full h-48 object-cover rounded-2xl border-2 border-white shadow-xl transition-all duration-300 group-hover:brightness-90"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="bg-red-500/80 hover:bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md transition-all"
                  >
                    Remove
                  </button>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <p className="bg-black/50 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">Preview</p>
                </div>
              </div>
            )}
          </div>

          {/* UPI Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm uppercase tracking-wider text-[11px]">
                UPI ID (VPA)
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210@ybl"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm uppercase tracking-wider text-[11px]">
                Payee Name <span className="text-[#ff2b85]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={upiPayeeName}
                onChange={(e) => {
                  setUpiPayeeName(e.target.value);
                  validateField("upiPayeeName", e.target.value);
                }}
                required
                className={`w-full border ${fieldErrors.upiPayeeName ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] transition-all text-sm`}
              />
              {fieldErrors.upiPayeeName && (
                <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">{fieldErrors.upiPayeeName}</p>
              )}
            </div>
          </div>

          {/* Address Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm uppercase tracking-wider text-[11px]">
                City <span className="text-[#ff2b85]">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  validateField("city", e.target.value);
                }}
                required
                className={`w-full border ${fieldErrors.city ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#fc8019] transition-all text-sm`}
              />
              {fieldErrors.city && (
                <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">{fieldErrors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm uppercase tracking-wider text-[11px]">
                State <span className="text-[#ff2b85]">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter state"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  validateField("state", e.target.value);
                }}
                required
                className={`w-full border ${fieldErrors.state ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] transition-all text-sm`}
              />
              {fieldErrors.state && (
                <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">{fieldErrors.state}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm uppercase tracking-wider">
              Address <span className="text-[#ff2b85]">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter full shop address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                validateField("address", e.target.value);
              }}
              required
              className={`w-full border ${fieldErrors.address ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#fc8019] transition-all text-sm`}
            />
            {fieldErrors.address && (
              <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase">{fieldErrors.address}</p>
            )}
          </div>

          {/* Submit */}
          <button
            disabled={loading || Object.keys(fieldErrors).length > 0}
            className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-bold text-lg shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? <ClipLoader size={22} color="white" /> : (myShopData ? "Save Changes" : "Save Details")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateEditShop;
