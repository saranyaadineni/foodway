import React, { useEffect, useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { FaUtensils } from "react-icons/fa";
import { setMyShopData } from "../redux/ownerSlice";
import { itemAPI, getImageUrl } from "../api";
import { ClipLoader } from "react-spinners";
import { getCategories } from "../category";

function EditItem() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { itemId } = useParams();

  const [currentItem, setCurrentItem] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [frontendImage, setFrontendImage] = useState("");
  const [backendImage, setBackendImage] = useState(null);
  const [category, setCategory] = useState("");
  const [foodType, setFoodType] = useState("");
  const [hasOffer, setHasOffer] = useState(false);
  const [offerPercentage, setOfferPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState([]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("foodType", foodType);
      formData.append("price", price);
      formData.append("hasOffer", hasOffer ? "true" : "false");
      formData.append("offerPercentage", hasOffer ? offerPercentage : 0);
      if (backendImage) formData.append("image", backendImage);

      const result = await itemAPI.editItem(itemId, formData);
      dispatch(setMyShopData(result.data));
      navigate("/");
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const result = await itemAPI.getById(itemId);
        setCurrentItem(result.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchItem();
  }, [itemId]);

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

  useEffect(() => {
    setName(currentItem?.name || "");
    setPrice(currentItem?.price || 0);
    setCategory(currentItem?.category || "");
    setFoodType(currentItem?.foodType || "");
    setHasOffer(currentItem?.hasOffer || false);
    setOfferPercentage(currentItem?.offerPercentage || 0);
    setFrontendImage(getImageUrl(currentItem?.image) || "");
  }, [currentItem]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff2eb] via-[#ffe7db] to-[#ffd9c9] relative overflow-hidden px-4">
      {/* Floating Blobs for Warm Depth */}
      <div className="absolute w-[26rem] h-[26rem] bg-[#fc8019]/25 rounded-full blur-3xl top-16 left-10 animate-pulse" />
      <div className="absolute w-[26rem] h-[26rem] bg-[#ff2b85]/25 rounded-full blur-3xl bottom-12 right-10 animate-pulse" />

      {/* Back Button */}
      <div
        className="absolute top-[25px] left-[25px] z-[10] cursor-pointer hover:scale-110 transition-transform"
        onClick={() => navigate("/")}
      >
        <IoIosArrowRoundBack size={40} className="text-[#ff2b85]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-lg bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-10 transition-transform duration-300 hover:scale-[1.02]">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-r from-[#fc8019]/20 to-[#ff2b85]/20 p-5 rounded-full mb-4">
            <FaUtensils className="text-[#ff2b85] w-16 h-16" />
          </div>
          <div className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85]">
            Edit Food
          </div>
          <p className="text-gray-600 text-sm mt-2 font-medium">
            Update your dish details and keep your menu fresh 🍴
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              placeholder="Enter item name"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Food Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] hover:border-[#ff4d2d]/60 transition-all"
              onChange={handleImage}
            />
            {frontendImage && (
              <div className="mt-4">
                <img
                  src={frontendImage}
                  alt=""
                  className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Price
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
              required
            />
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
                    onChange={(e) => setOfferPercentage(e.target.value)}
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

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] hover:border-[#ff4d2d]/60 transition-all"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
              required
            >
              <option value="">Select Category</option>
              {dynamicCategories.map((cate, index) => (
                <option value={cate.name} key={cate._id || index}>
                  {cate.name}
                </option>
              ))}
            </select>
          </div>

          {/* Food Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Food Type
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
              onChange={(e) => setFoodType(e.target.value)}
              value={foodType}
              required
            >
              <option value="">Select Food Type</option>
              <option value="veg">Veg</option>
              <option value="non veg">Non Veg</option>
            </select>
          </div>

          {/* Submit */}
          <button
            className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? <ClipLoader size={22} color="white" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditItem;
