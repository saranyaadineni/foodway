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
  const [price, setPrice] = useState(0);
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [category, setCategory] = useState("");
  const [foodType, setFoodType] = useState("veg");
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const serverCategories = await getCategories();
        setDynamicCategories(serverCategories);
        if (serverCategories.length > 0 && !category) {
          setCategory(serverCategories[0].name);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setDynamicCategories([]);
      }
    };
    loadCategories();
  }, [category]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter a food name");
      setLoading(false);
      return;
    }
    if (!category) {
      setError("Please select a category");
      setLoading(false);
      return;
    }
    if (!price || price <= 0) {
      setError("Please enter a valid price");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("foodType", foodType);
      formData.append("price", price);
      if (backendImage) formData.append("image", backendImage);

      const result = await itemAPI.addItem(formData);
      dispatch(setMyShopData(result.data));
      setSuccess("Item added successfully!");
      setLoading(false);

      setName("");
      setPrice(0);
      setFrontendImage(null);
      setBackendImage(null);

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.log(error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to add item. Please try again.";
      setError(errorMessage);
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
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm text-center font-medium">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Food Name
            </label>
            <input
              type="text"
              placeholder="Enter food name"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Food Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] hover:border-[#ff4d2d]/60 transition-all"
            />
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
              Price
            </label>
            <input
              type="number"
              placeholder="Enter price"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Select Category
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
            >
              <option value="">Select Category</option>
              {(dynamicCategories.length > 0
                ? dynamicCategories
                : categories.map((cat) => ({
                    name: cat,
                    _id: cat.toLowerCase(),
                  }))
              ).map((cate, index) => (
                <option value={cate.name} key={cate._id || index}>
                  {cate.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Select Food Type
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] hover:border-[#ff4d2d]/60 transition-all"
              onChange={(e) => setFoodType(e.target.value)}
              value={foodType}
            >
              <option value="veg">Veg</option>
              <option value="non veg">Non Veg</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 disabled:opacity-60"
          >
            {loading ? <ClipLoader size={22} color="white" /> : "Save Item"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddItem;
