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
            <label className="block text-gray-700 font-semibold mb-1 text-sm">
              Shop Name
            </label>
            <input
              type="text"
              placeholder="Enter shop name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">
              Shop Image
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
                  alt="Shop Preview"
                  className="w-full h-48 object-cover rounded-lg border shadow-md"
                />
              </div>
            )}
          </div>

          {/* UPI Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">
                UPI ID (VPA)
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210@ybl"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] transition-all"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">
                Payee Name
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={upiPayeeName}
                onChange={(e) => setUpiPayeeName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] transition-all"
              />
            </div>
          </div>

          {/* Address Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">
                City
              </label>
              <input
                type="text"
                placeholder="Enter city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#fc8019] transition-all"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">
                State
              </label>
              <input
                type="text"
                placeholder="Enter state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ff2b85] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">
              Address
            </label>
            <input
              type="text"
              placeholder="Enter full shop address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#fc8019] transition-all"
            />
          </div>

          {/* Submit */}
          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white py-3 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 disabled:opacity-60"
          >
            {loading ? <ClipLoader size={22} color="white" /> : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateEditShop;
