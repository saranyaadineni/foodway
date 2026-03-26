import React, { useState, useEffect } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaUtensils } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { setMyShopData } from "../redux/ownerSlice";
import { getCategories, categories } from "../category";
import { itemAPI } from "../api";

function AddItem() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [category, setCategory] = useState("");
  const [foodType, setFoodType] = useState("");
  const [hasOffer, setHasOffer] = useState(false);
  const [offerPercentage, setOfferPercentage] = useState(0);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const serverCategories = await getCategories();
        setDynamicCategories(serverCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setDynamicCategories([]);
      }
    };
    loadCategories();
  }, []);

  const validateField = (fieldName, value, currentErrors = {}) => {
    let errors = { ...currentErrors };

    switch (fieldName) {
      case "name":
        if (!value.trim()) errors.name = "Food name is required";
        else delete errors.name;
        break;
      case "price":
        if (!value || value <= 0) errors.price = "Price must be greater than 0";
        else delete errors.price;
        break;
      case "image":
        if (!value) errors.image = "Food image is required";
        else delete errors.image;
        break;
      case "category":
        if (!value) errors.category = "Please select a category";
        else delete errors.category;
        break;
      case "foodType":
        if (!value) errors.foodType = "Please select a food type";
        else delete errors.foodType;
        break;
      default:
        break;
    }
    return errors;
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
      setFieldErrors(validateField("image", file, fieldErrors));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    let errors = {};
    errors = validateField("name", name, errors);
    errors = validateField("price", price, errors);
    errors = validateField("image", backendImage, errors);
    errors = validateField("category", category, errors);
    errors = validateField("foodType", foodType, errors);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("foodType", foodType);
      formData.append("price", price);
      formData.append("hasOffer", hasOffer);
      formData.append("offerPercentage", hasOffer ? offerPercentage : 0);
      formData.append("image", backendImage);

      const result = await itemAPI.addItem(formData);
      dispatch(setMyShopData(result.data));
      setFormSuccess("Item added successfully!");
      
      // Reset form
      setName("");
      setPrice("");
      setCategory("");
      setFoodType("");
      setHasOffer(false);
      setOfferPercentage(0);
      setFrontendImage(null);
      setBackendImage(null);
      setFieldErrors({});

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to add item. Please try again.";
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff2eb] via-[#ffe7db] to-[#ffd9c9] relative overflow-hidden px-4">
      {/* Floating gradient blobs for background depth */}
      <div className="absolute w-[26rem] h-[26rem] bg-[#fc8019]/25 rounded-full blur-3xl top-16 left-10 animate-pulse" />
      <div className="absolute w-[26rem] h-[26rem] bg-[#ff2b85]/25 rounded-full blur-3xl bottom-12 right-10 animate-pulse" />

      {/* ✅ Back Button (fixed & mobile friendly) */}
      <div
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-1 
        text-[#ff4d2d] hover:text-[#ff2b85] transition-all duration-200 
        cursor-pointer bg-white/70 backdrop-blur-md px-2 py-1 rounded-full shadow-md"
        onClick={() => navigate("/")}
      >
        <IoIosArrowRoundBack size={28} className="sm:size-[36px]" />
        <span className="text-sm sm:text-base font-medium hidden sm:inline">
        </span>
      </div>

      {/* Form Card */}
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-10 transition-transform duration-300 hover:scale-[1.02]">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-r from-[#fc8019]/20 to-[#ff2b85]/20 p-5 rounded-full mb-4">
            <FaUtensils className="text-[#ff2b85] w-14 h-14" />
          </div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85] drop-shadow-md">
            Add Food Item
          </h2>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm text-center font-medium">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm text-center font-medium">
              {formSuccess}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Food Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter food name"
              className={`w-full border ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors(validateField("name", e.target.value, fieldErrors));
              }}
              value={name}
            />
            {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Food Image <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className={`w-full border ${fieldErrors.image ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] hover:border-[#ff4d2d]/60 transition-all text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#fc8019] hover:file:bg-orange-100 cursor-pointer`}
            />
            {fieldErrors.image && <p className="text-red-500 text-xs mt-1">{fieldErrors.image}</p>}
            {frontendImage && (
              <div className="mt-4">
                <img
                  src={frontendImage}
                  alt="preview"
                  className="w-full h-48 object-cover rounded-lg border shadow-md"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="Enter price"
              className={`w-full border ${fieldErrors.price ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
              onChange={(e) => {
                const value = e.target.value;
                setPrice(value);
                setFieldErrors(validateField("price", value, fieldErrors));
              }}
              value={price}
            />
            {fieldErrors.price && <p className="text-red-500 text-xs mt-1">{fieldErrors.price}</p>}
          </div>

          <div className="flex flex-col gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-200/50">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">Has Offer?</label>
              <input
                type="checkbox"
                checked={hasOffer}
                onChange={(e) => setHasOffer(e.target.checked)}
                className="w-5 h-5 accent-[#ff2b85] cursor-pointer"
              />
            </div>
            {hasOffer && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-[#ff2b85] uppercase tracking-wider">
                  Offer Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter percentage (e.g. 20)"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff2b85] transition-all"
                    onChange={(e) => setOfferPercentage(Math.max(0, Math.min(100, e.target.value)))}
                    value={offerPercentage}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
                {price > 0 && offerPercentage > 0 && (
                  <p className="text-xs text-gray-500 font-medium pl-1">
                    Discounted Price: <span className="text-[#60b246] font-bold">₹{(price - (price * offerPercentage) / 100).toFixed(2)}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Select Category <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full border ${fieldErrors.category ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
              onChange={(e) => {
                setCategory(e.target.value);
                setFieldErrors(validateField("category", e.target.value, fieldErrors));
              }}
              value={category}
            >
              <option value="">Select a Category</option>
              {(dynamicCategories.length > 0
                ? dynamicCategories
                : categories.map((cat) => ({ name: cat, _id: cat.toLowerCase() }))
              ).map((cate, index) => (
                <option value={cate.name} key={cate._id || index}>
                  {cate.name}
                </option>
              ))}
            </select>
            {fieldErrors.category && <p className="text-red-500 text-xs mt-1">{fieldErrors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Select Food Type <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full border ${fieldErrors.foodType ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] hover:border-[#ff4d2d]/60 transition-all`}
              onChange={(e) => {
                setFoodType(e.target.value);
                setFieldErrors(validateField("foodType", e.target.value, fieldErrors));
              }}
              value={foodType}
            >
              <option value="">Select a Food Type</option>
              <option value="veg">Veg</option>
              <option value="non veg">Non Veg</option>
            </select>
            {fieldErrors.foodType && <p className="text-red-500 text-xs mt-1">{fieldErrors.foodType}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || Object.keys(fieldErrors).length > 0}
            className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <ClipLoader size={22} color="white" /> : "Save Item"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddItem;
