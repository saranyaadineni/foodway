import React, { useState, useEffect } from 'react';
import Nav from './Nav.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { FaUtensils, FaStore, FaToggleOn, FaToggleOff, FaPen, FaStar } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import OwnerItemCard from './OwnerItemCard';
import { setMyShopData } from '../redux/ownerSlice';
import { ratingAPI, shopAPI, getImageUrl } from '../api';

function OwnerDashboard() {
  const { myShopData } = useSelector(state => state.owner);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [ratingSummary, setRatingSummary] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await ratingAPI.getMyShopRatings();
        setRatingSummary(res.data);
      } catch (error) {
        console.log('fetch owner ratings error', error);
      }
    };
    fetchRatings();
  }, []);

  useEffect(() => {
    const refreshShop = async () => {
      try {
        const res = await shopAPI.getMy();
        dispatch(setMyShopData(res.data));
      } catch (error) {
        if (!(error?.response?.status === 400)) {
          console.log('refresh my shop error', error?.response?.data || error);
        }
      }
    };
    refreshShop();
  }, [dispatch]);

  const handleShopStatusToggle = async () => {
    try {
      setIsUpdatingStatus(true);
      const newStatus = !myShopData.isOpen;
      const result = await shopAPI.updateStatus(newStatus);
      dispatch(setMyShopData(result.data));
    } catch (error) {
      console.log('Error updating shop status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex flex-col items-center">
      <Nav />

      {/* When shop not created yet */}
      {!myShopData && (
        <div className="flex justify-center items-center mt-12 px-4">
          <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
            <FaUtensils className="text-[#ff4d2d] w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Add Your Restaurant</h2>
            <p className="text-gray-600 text-sm mb-6">
              Join our food delivery platform and start getting online orders today.
            </p>
            <button
              onClick={() => navigate("/create-edit-shop")}
              className="bg-[#ff4d2d] text-white px-6 py-2 rounded-full font-semibold shadow-md hover:bg-orange-600 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* When shop exists */}
      {myShopData && (
        <div className="w-full flex flex-col items-center gap-8 px-4 sm:px-6 mt-8 max-w-6xl">

          {/* Banner Section */}
          <div className="relative w-full bg-white rounded-2xl shadow-lg overflow-hidden">
            <img
              src={getImageUrl(myShopData.image)}
              alt={myShopData.name}
              className="w-full h-64 sm:h-80 object-cover"
            />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent"></div>

            <div className="absolute bottom-4 left-6 text-white">
              <h1 className="text-3xl font-bold mb-1">{myShopData.name}</h1>
              <p className="text-sm text-gray-200">{myShopData.address}, {myShopData.city}, {myShopData.state}</p>
              <div className="flex items-center gap-2 mt-2">
                <FaStar className="text-yellow-400" />
                <span className="font-semibold text-lg">
                  {Number(myShopData?.rating?.average || 0).toFixed(1)}
                </span>
                <span className="text-sm text-gray-200">
                  ({myShopData?.rating?.count || 0} reviews)
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => navigate("/create-edit-shop")}
              className="absolute top-4 right-4 bg-[#ff4d2d] text-white p-2 rounded-full shadow-md hover:bg-orange-600 transition-colors"
            >
              <FaPen size={18} />
            </button>
          </div>

          {/* Shop Status and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {/* Shop Status */}
            <div className="bg-white rounded-xl p-5 shadow border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-gray-600 text-sm">Shop Status</p>
                <h3 className={`text-lg font-semibold ${myShopData.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {myShopData.isOpen ? 'Online' : 'Offline'}
                </h3>
              </div>
              <button
                onClick={handleShopStatusToggle}
                disabled={isUpdatingStatus}
                className={`${isUpdatingStatus
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-110 transition-transform'
                  }`}
              >
                {myShopData.isOpen ? (
                  <FaToggleOn className="text-green-500 text-4xl" />
                ) : (
                  <FaToggleOff className="text-gray-400 text-4xl" />
                )}
              </button>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-xl p-5 shadow border border-gray-100 text-center">
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-3xl font-bold text-[#ff4d2d] mt-1">
                {Number(myShopData?.rating?.average || 0).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">from {myShopData?.rating?.count || 0} reviews</p>
            </div>

            {/* Item Count */}
            <div className="bg-white rounded-xl p-5 shadow border border-gray-100 text-center">
              <p className="text-sm text-gray-600">Total Menu Items</p>
              <p className="text-3xl font-bold text-[#ff4d2d] mt-1">{myShopData.items.length}</p>
            </div>
          </div>

          {/* Items Section */}
          <div className="w-full mt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Menu</h2>

            {myShopData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl shadow border border-gray-100">
                <FaUtensils className="text-[#ff4d2d] w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Items Yet</h3>
                <p className="text-gray-600 text-sm">
                  Add your first food item to start getting online orders.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myShopData.items.map((item, index) => (
                  <OwnerItemCard key={index} data={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
