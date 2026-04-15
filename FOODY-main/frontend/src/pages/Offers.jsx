import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Nav from "../components/Nav";
import { itemAPI } from "../api";
import FoodCard from "../components/FoodCard";
import { HiOutlineReceiptPercent } from "react-icons/hi2";

function Offers() {
  const { currentCity, userData } = useSelector((state) => state.user);
  const { myShopData } = useSelector((state) => state.owner);
  const [offerItems, setOfferItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      setIsLoading(true);
      try {
        const response = await itemAPI.getOffers(currentCity || "all");
        let items = Array.isArray(response.data) ? response.data : [];
        
        // Filter for owner if logged in as owner
        if (userData?.role === 'owner' && myShopData?._id) {
          items = items.filter(item => {
            const itemShopId = item.shop?._id || item.shop;
            return String(itemShopId) === String(myShopData._id);
          });
        }
        
        setOfferItems(items);
      } catch (error) {
        console.error("Failed to fetch offers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, [currentCity, userData, myShopData]);

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px]">
      <Nav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#fc8019] to-[#ff2b85] rounded-xl flex items-center justify-center text-white shadow-lg">
              <HiOutlineReceiptPercent size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Best Food Offers</h1>
              <p className="text-gray-500 font-medium">Great discounts on your favorite dishes in {currentCity || "your city"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[#fc8019]/10 px-4 py-2 rounded-full border border-[#fc8019]/20">
            <span className="w-2 h-2 bg-[#fc8019] rounded-full animate-pulse"></span>
            <span className="text-[#fc8019] font-bold text-sm">{offerItems.length} Offers Available</span>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 space-y-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-xl"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : offerItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {offerItems.map((item) => (
              <FoodCard key={item._id} data={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 px-4">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <HiOutlineReceiptPercent size={48} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Offers Found</h2>
            <p className="text-gray-500 text-center max-w-md">
              There are currently no active offers in {currentCity || "your city"}. Check back later for delicious deals!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Offers;