import React, { useEffect, useState } from "react";
import { FaLocationDot, FaPlus } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { FiShoppingCart } from "react-icons/fi";
import { TbReceipt2 } from "react-icons/tb";
import { RxCross2 } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { setSearchItems, logout, incrementNewOrdersCount, resetNewOrdersCount } from "../redux/userSlice";
import { userAPI, authAPI, itemAPI } from "../api";
import { useNavigate, useLocation } from "react-router-dom";

function Nav() {
  const { userData, currentCity, cartItems, socket, newOrdersCount } = useSelector((state) => state.user);
  const { myShopData } = useSelector((state) => state.owner);
  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userData?.role === 'owner' && location.pathname === '/my-orders') {
      dispatch(resetNewOrdersCount());
    }
  }, [location.pathname, userData?.role, dispatch]);

  useEffect(() => {
    if (userData?.role === 'owner' && socket) {
      const handleNewOrder = () => {
        // Only increment if not on the orders page
        if (location.pathname !== '/my-orders') {
          dispatch(incrementNewOrdersCount());
        }
      };

      socket.on('newOrder', handleNewOrder);
      return () => {
        socket.off('newOrder', handleNewOrder);
      };
    }
  }, [userData?.role, socket, location.pathname, dispatch]);

  const handleLogOut = async () => {
    try {
      await userAPI.setActive(false);
      await authAPI.signout();
    } catch (error) {
      console.log("Signout error:", error);
    } finally {
      dispatch(logout());
      navigate("/signin");
    }
  };

  useEffect(() => {
    const searchItems = async () => {
      try {
        const res = await itemAPI.searchItems(query, currentCity);
        dispatch(setSearchItems(res.data));
      } catch (error) {
        console.log(error);
      }
    };

    if (query) {
      searchItems();
    } else {
      dispatch(setSearchItems(null));
    }
  }, [query, currentCity, dispatch]);

  return (
    <div className="fixed top-0 left-0 w-full h-[70px] bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm z-[9999] flex items-center justify-between px-4 sm:px-8 transition-all">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-5">
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85] cursor-pointer hover:scale-105 transition-transform"
          onClick={() => navigate("/")}
        >
          Food<span className="text-[#ff2b85]">Way</span>
        </h1>

        {userData?.role === "user" && (
          <div className="hidden sm:flex items-center gap-1 text-gray-700 cursor-pointer hover:text-[#ff2b85] transition-all">
            <FaLocationDot className="text-[#ff2b85]" size={16} />
            <span className="text-sm font-medium">
              {currentCity || "Select Location"}
            </span>
          </div>
        )}
      </div>

      {/* Desktop Search */}
      {userData?.role === "user" && (
        <div className="hidden md:flex w-[40%] items-center bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#fc8019] transition-all">
          <IoIosSearch size={22} className="text-[#ff4d2d]" />
          <input
            type="text"
            placeholder="Search for restaurants or dishes..."
            className="flex-1 ml-2 outline-none text-gray-700 text-[15px] bg-transparent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Mobile Search Toggle */}
        {userData?.role === "user" && (
          <>
            {showSearch ? (
              <RxCross2
                size={25}
                className="text-[#ff2b85] md:hidden cursor-pointer"
                onClick={() => setShowSearch(false)}
              />
            ) : (
              <IoIosSearch
                size={25}
                className="text-[#ff2b85] md:hidden cursor-pointer"
                onClick={() => setShowSearch(true)}
              />
            )}
          </>
        )}

        {/* Owner Buttons (Now visible on mobile too) */}
        {userData?.role === "owner" ? (
          <>
            {myShopData && (
              <>
                {/* Desktop Add Item */}
                <button
                  onClick={() => navigate("/add-item")}
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white px-4 py-2 rounded-full font-semibold shadow-md hover:shadow-lg hover:scale-[1.03] transition-all"
                >
                  <FaPlus size={14} />
                  Add Item
                </button>

                {/* Mobile Add Item (icon only) */}
                <button
                  onClick={() => navigate("/add-item")}
                  className="sm:hidden flex items-center justify-center w-[38px] h-[38px] rounded-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white shadow-md hover:scale-110 transition-transform"
                  title="Add Item"
                >
                  <FaPlus size={16} />
                </button>
              </>
            )}

            {/* Desktop Orders */}
            <button
              onClick={() => navigate("/my-orders")}
              className="hidden sm:flex items-center gap-2 border border-[#ff2b85]/40 text-[#ff2b85] px-4 py-2 rounded-full font-semibold bg-white hover:bg-[#ff2b85]/10 transition-all shadow-sm relative"
            >
              <TbReceipt2 size={18} />
              Orders
              {newOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff2b85] text-white text-[10px] rounded-full w-[18px] h-[18px] flex items-center justify-center font-bold border-2 border-white shadow-sm">
                  {newOrdersCount}
                </span>
              )}
            </button>

            {/* Mobile Orders (icon only) */}
            <button
              onClick={() => navigate("/my-orders")}
              className="sm:hidden flex items-center justify-center w-[38px] h-[38px] rounded-full border border-[#ff2b85]/40 text-[#ff2b85] bg-white shadow-sm hover:bg-[#ff2b85]/10 transition-all relative"
              title="Orders"
            >
              <TbReceipt2 size={18} />
              {newOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ff2b85] text-white text-[10px] rounded-full w-[16px] h-[16px] flex items-center justify-center font-bold border-2 border-white shadow-sm">
                  {newOrdersCount}
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Cart */}
            {userData?.role === "user" && (
              <div
                className="relative cursor-pointer hover:scale-110 transition-transform"
                onClick={() => navigate("/cart")}
              >
                <FiShoppingCart size={24} className="text-[#ff2b85]" />
                {cartItems?.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white text-[12px] rounded-full w-[18px] h-[18px] flex items-center justify-center font-semibold shadow-md">
                    {cartItems.length}
                  </span>
                )}
              </div>
            )}

            {/* Orders */}
            {userData?.role === "user" && (
              <>
                <button
                  onClick={() => navigate("/my-orders")}
                  className="hidden sm:block border border-[#fc8019]/40 text-[#fc8019] px-4 py-2 rounded-full font-semibold bg-white hover:bg-[#fc8019]/10 transition-all shadow-sm"
                >
                  Orders
                </button>
                 {/* Mobile Orders (icon only) */}
                <button
                  onClick={() => navigate("/my-orders")}
                  className="sm:hidden flex items-center justify-center w-[38px] h-[38px] rounded-full border border-[#fc8019]/40 text-[#fc8019] bg-white shadow-sm hover:bg-[#fc8019]/10 transition-all"
                  title="Orders"
                >
                  <TbReceipt2 size={18} />
                </button>
              </>
            )}
          </>
        )}

        {/* Profile Avatar */}
        <div
          className="w-[40px] h-[40px] sm:w-[42px] sm:h-[42px] rounded-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white font-semibold flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md"
          onClick={() => setShowInfo((prev) => !prev)}
        >
          {userData?.fullName?.slice(0, 1).toUpperCase()}
        </div>

        {/* Dropdown */}
        {showInfo && (
          <div className="absolute top-[75px] right-3 sm:right-8 bg-white/90 backdrop-blur-2xl shadow-2xl border border-white/40 rounded-2xl p-4 flex flex-col gap-3 w-[200px] animate-fade-in">
            <div className="font-semibold text-gray-800 text-center">
              {userData.fullName}
            </div>
            {userData.role === "user" && (
              <div
                onClick={() => navigate("/my-orders")}
                className="text-[#fc8019] font-medium cursor-pointer hover:text-[#ff2b85] transition-all text-center"
              >
                My Orders
              </div>
            )}
            <div
              onClick={handleLogOut}
              className="text-[#ff2b85] font-medium cursor-pointer hover:text-[#fc8019] transition-all text-center"
            >
              Log Out
            </div>
          </div>
        )}
      </div>

      {/* Mobile Search Bar */}
      {showSearch && userData?.role === "user" && (
        <div className="absolute top-[70px] left-0 w-full bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-md py-2 px-4 flex md:hidden">
          <div className="flex items-center w-full bg-white border border-gray-200 rounded-full px-3 py-2">
            <IoIosSearch size={20} className="text-[#ff2b85]" />
            <input
              type="text"
              placeholder="Search food or restaurants..."
              className="flex-1 ml-2 outline-none text-gray-700 text-[14px] bg-transparent"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Nav;
