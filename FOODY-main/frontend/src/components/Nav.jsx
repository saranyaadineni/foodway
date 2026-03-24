import React, { useEffect, useState } from "react";
import { FaLocationDot, FaPlus, FaStore, FaList, FaUtensils } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { FiShoppingCart, FiHelpCircle, FiUser } from "react-icons/fi";
import { TbReceipt2 } from "react-icons/tb";
import { HiOutlineReceiptPercent } from "react-icons/hi2";
import { RxCross2 } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import {
  logout,
  incrementNewOrdersCount,
  resetNewOrdersCount,
  setCurrentCity,
  setCurrentAddress,
  setCurrentState,
} from "../redux/userSlice";
import { setActiveTab } from "../redux/ownerSlice";
import { userAPI, authAPI } from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import { setAddress, setLocation } from "../redux/mapSlice";

function Nav() {
  const { userData, currentCity, currentAddress, cartItems, socket, newOrdersCount } = useSelector((state) => state.user);
  const { myShopData } = useSelector((state) => state.owner);
  const [showInfo, setShowInfo] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [recentLocations, setRecentLocations] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationResultsLoading, setLocationResultsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isUser = userData?.role === "user";
  const isOwner = userData?.role === "owner";
  const isLoggedIn = !!userData;
  const isHelpPage = location.pathname === "/help";
  const displayLocation = currentAddress || currentCity || "Select Location";

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fw_recent_locations");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentLocations(parsed);
        }
      }
    } catch {
      setRecentLocations([]);
    }
  }, []);

  useEffect(() => {
    const term = locationInput.trim();
    if (term.length < 2) {
      setLocationResults([]);
      setLocationResultsLoading(false);
      return;
    }

    let cancelled = false;
    const fetchLocations = async () => {
      try {
        setLocationResultsLoading(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            term
          )}&addressdetails=1&limit=6`
        );
        if (!response.ok) {
          throw new Error("Location search failed");
        }
        const data = await response.json();
        if (cancelled) return;
        const mapped = (data || []).map((item) => item.display_name).filter(Boolean);
        setLocationResults(mapped);
      } catch {
        if (!cancelled) {
          setLocationResults([]);
        }
      } finally {
        if (!cancelled) {
          setLocationResultsLoading(false);
        }
      }
    };

    const id = setTimeout(fetchLocations, 400);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [locationInput]);

  const saveRecentLocation = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const filtered = recentLocations.filter((item) => item !== trimmed);
    const updated = [trimmed, ...filtered].slice(0, 5);
    setRecentLocations(updated);
    try {
      localStorage.setItem("fw_recent_locations", JSON.stringify(updated));
    } catch {
      setLocationError("Unable to save recent locations.");
    }
  };

  const applyLocation = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const city = trimmed.split(",")[0] || trimmed;
    dispatch(setCurrentCity(city));
    dispatch(setCurrentState(""));
    dispatch(setCurrentAddress(trimmed));
    dispatch(setAddress(trimmed));
    saveRecentLocation(trimmed);
    setShowLocationPicker(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location not supported in this browser.");
      return;
    }
    setLocationLoading(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        dispatch(setLocation({ lat: latitude, lon: longitude }));
        const address = "Current location";
        const city = currentCity || "Hyderabad";
        dispatch(setCurrentCity(city));
        dispatch(setCurrentState(""));
        dispatch(setCurrentAddress(address));
        dispatch(setAddress(address));
        saveRecentLocation(address);
        setLocationLoading(false);
        setShowLocationPicker(false);
      },
      () => {
        setLocationLoading(false);
        setLocationError("Unable to fetch current location.");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
  };

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

  return (
    <div className="fixed top-0 left-0 w-full h-[70px] bg-white border-b border-gray-200 shadow-sm z-[9999] flex items-center justify-between px-4 sm:px-8 transition-all">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-5">
        {isHelpPage ? (
          <div className="flex items-center gap-3">
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85] cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate("/")}
            >
              Food<span className="text-[#ff2b85]">Way</span>
            </h1>
            <div className="h-6 w-[2px] bg-gray-300 hidden sm:block"></div>
            <span className="text-gray-600 font-bold tracking-widest text-sm sm:text-base">HELP</span>
          </div>
        ) : (
          <>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85] cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate("/")}
            >
              Food<span className="text-[#ff2b85]">Way</span>
            </h1>

            {(isUser || !isLoggedIn) && (
              <div
                className="hidden sm:flex items-center gap-1 text-gray-700 cursor-pointer hover:text-[#ff2b85] transition-all"
                onClick={() => setShowLocationPicker((prev) => !prev)}
              >
                <FaLocationDot className="text-[#ff2b85]" size={16} />
                <span className="text-sm font-medium">
                  {displayLocation}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop Search */}
      {(isUser || !isLoggedIn) && location.pathname !== "/search" && !isHelpPage && (
        <div 
          className="hidden md:flex w-[40%] items-center bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#fc8019] transition-all cursor-pointer"
          onClick={() => navigate("/search")}
        >
          <IoIosSearch size={22} className="text-[#ff4d2d]" />
          <input
            type="text"
            placeholder="Search for restaurants or dishes..."
            className="flex-1 ml-2 outline-none text-gray-700 text-[15px] bg-transparent cursor-pointer"
            readOnly
          />
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-4 sm:gap-8">
        {isHelpPage ? (
          <>
            <div className="hidden lg:flex items-center gap-8">
              <div 
                className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium transition-colors relative group"
                onClick={() => navigate("/offers")}
              >
                <HiOutlineReceiptPercent size={22} />
                <span>Offers</span>
                <span className="absolute -top-2 -right-4 bg-[#fc8019] text-white text-[9px] px-1 rounded font-bold">NEW</span>
              </div>
              <div className="flex items-center gap-2 text-[#fc8019] cursor-pointer font-medium transition-colors">
                <FiHelpCircle size={20} />
                <span>Help</span>
              </div>
              
              {isLoggedIn ? (
                <div
                  className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium transition-colors"
                  onClick={() => setShowInfo((prev) => !prev)}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white font-semibold flex items-center justify-center text-xs">
                    {userData?.fullName?.slice(0, 1).toUpperCase()}
                  </div>
                  <span>{userData?.fullName?.split(" ")[0]}</span>
                </div>
              ) : (
                <div 
                className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium transition-colors"
                onClick={() => navigate("/signin")}
              >
                <FiUser size={20} />
                <span>Sign In</span>
              </div>
            )}

            {(isLoggedIn || location.pathname === "/search") && (
                <div 
                  className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium transition-colors relative group"
                  onClick={() => navigate("/cart")}
                >
                  <div className="relative">
                    <FiShoppingCart size={22} className={cartItems?.length > 0 ? "text-[#60b246]" : "text-gray-700 group-hover:text-[#fc8019]"} />
                    {cartItems?.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#60b246] text-white text-[10px] rounded-full w-[16px] h-[16px] flex items-center justify-center font-bold">
                        {cartItems.length}
                      </span>
                    )}
                  </div>
                  <span>Cart</span>
                </div>
              )}
          </div>

          {/* Mobile Help Page Items */}
            <div className="flex lg:hidden items-center gap-4">
              {(isLoggedIn || location.pathname === "/search") && (
                <div
                  className="relative cursor-pointer"
                  onClick={() => navigate("/cart")}
                >
                  <FiShoppingCart size={22} className={cartItems?.length > 0 ? "text-[#60b246]" : "text-gray-700"} />
                  {cartItems?.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#60b246] text-white text-[9px] rounded-full w-[15px] h-[15px] flex items-center justify-center font-bold">
                      {cartItems.length}
                    </span>
                  )}
                </div>
              )}
              {isLoggedIn ? (
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white font-semibold flex items-center justify-center text-xs cursor-pointer"
                  onClick={() => setShowInfo((prev) => !prev)}
                >
                  {userData?.fullName?.slice(0, 1).toUpperCase()}
                </div>
              ) : (
                <FiUser 
                  size={22} 
                  className="text-gray-700 cursor-pointer"
                  onClick={() => navigate("/signin")}
                />
              )}
            </div>
          </>
        ) : (
          <>
            {/* Navigation Items (Desktop) */}
            {(isUser || !isLoggedIn) && location.pathname === "/search" && (
              <div className="hidden lg:flex items-center gap-8">
                <div 
                  className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium transition-colors relative group"
                  onClick={() => navigate("/offers")}
                >
                  <HiOutlineReceiptPercent size={22} />
                  <span>Offers</span>
                  <span className="absolute -top-2 -right-4 bg-[#fc8019] text-white text-[9px] px-1 rounded font-bold">NEW</span>
                </div>
                <div 
                  className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium transition-colors"
                  onClick={() => navigate("/help")}
                >
                  <FiHelpCircle size={20} />
                  <span>Help</span>
                </div>
              </div>
            )}

            {/* Mobile Search Icon */}
            {(isUser || !isLoggedIn) && location.pathname !== "/search" && (
              <IoIosSearch
                size={25}
                className="text-[#ff2b85] md:hidden cursor-pointer"
                onClick={() => navigate("/search")}
              />
            )}

            {isOwner ? (
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
                {(isLoggedIn || location.pathname === "/search") && (isUser || !isLoggedIn) && (location.pathname === "/search" || location.pathname === "/") && (
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:text-[#fc8019] transition-colors relative group"
                    onClick={() => navigate("/cart")}
                  >
                    <div className="relative">
                      <FiShoppingCart size={22} className={cartItems?.length > 0 ? "text-[#60b246]" : "text-gray-700 group-hover:text-[#fc8019]"} />
                      {cartItems?.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#60b246] text-white text-[10px] rounded-full w-[16px] h-[16px] flex items-center justify-center font-bold">
                          {cartItems.length}
                        </span>
                      )}
                    </div>
                    <span className="hidden lg:inline font-medium">Cart</span>
                  </div>
                )}

                {/* Orders (Only if logged in user) */}
                {isUser && (location.pathname === "/search" || location.pathname === "/") && (
                  <div 
                    className="hidden lg:flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium transition-colors"
                    onClick={() => navigate("/my-orders")}
                  >
                    <TbReceipt2 size={22} />
                    <span>Orders</span>
                  </div>
                )}
              </>
            )}

            {isLoggedIn ? (
              <div className="relative">
                <div
                  className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium transition-colors"
                  onClick={() => setShowInfo((prev) => !prev)}
                >
                  <div className="w-[40px] h-[40px] sm:w-[42px] sm:h-[42px] rounded-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white font-semibold flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md">
                    {userData?.fullName?.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{userData?.fullName?.split(" ")[0]}</span>
                </div>

                {showInfo && (
                  <div className="absolute top-[55px] right-0 bg-white/90 backdrop-blur-2xl shadow-2xl border border-white/40 rounded-2xl p-4 flex flex-col gap-3 w-[200px] animate-fade-in z-[10000]">
                    <div className="font-semibold text-gray-800 text-center border-b border-gray-100 pb-2">
                      {userData.fullName}
                    </div>
                    {userData.role === "user" && (
                      <div
                        onClick={() => {
                          navigate("/my-orders");
                          setShowInfo(false);
                        }}
                        className="text-gray-700 font-medium cursor-pointer hover:text-[#fc8019] transition-all text-sm flex items-center gap-2"
                      >
                        <TbReceipt2 size={18} />
                        My Orders
                      </div>
                    )}
                    {userData.role === "owner" && (
                      <>
                        <div
                          onClick={() => {
                            dispatch(setActiveTab('dashboard'));
                            navigate("/");
                            setShowInfo(false);
                          }}
                          className="text-gray-700 font-medium cursor-pointer hover:text-[#fc8019] transition-all text-sm flex items-center gap-2"
                        >
                          <FaStore size={18} />
                          Dashboard
                        </div>
                        <div
                          onClick={() => {
                            dispatch(setActiveTab('menu'));
                            navigate("/");
                            setShowInfo(false);
                          }}
                          className="text-gray-700 font-medium cursor-pointer hover:text-[#fc8019] transition-all text-sm flex items-center gap-2"
                        >
                          <FaUtensils size={18} />
                          Menu Items
                        </div>
                        <div
                          onClick={() => {
                            dispatch(setActiveTab('categories'));
                            navigate("/");
                            setShowInfo(false);
                          }}
                          className="text-gray-700 font-medium cursor-pointer hover:text-[#fc8019] transition-all text-sm flex items-center gap-2"
                        >
                          <FaList size={18} />
                          Categories
                        </div>
                      </>
                    )}
                    <div
                      onClick={handleLogOut}
                      className="text-[#ff2b85] font-medium cursor-pointer hover:text-[#fc8019] transition-all text-sm flex items-center gap-2 border-t border-gray-100 pt-2"
                    >
                      <FiUser size={18} />
                      Log Out
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => navigate("/signin")}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#fc8019]/40 text-[#fc8019] text-sm font-semibold bg-white hover:bg-[#fc8019]/10 transition-all shadow-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.03] transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showLocationPicker && (isUser || !isLoggedIn) && (
        <div className="absolute top-[70px] left-0 w-full flex justify-center z-[9998]">
          <div className="mt-2 w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold tracking-[0.16em] text-[#ff4d2d] uppercase">
                  Enter your delivery location
                </p>
                <div className="mt-3 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                  <FaLocationDot className="text-[#ff2b85]" size={16} />
                  <input
                    type="text"
                    placeholder="Enter your delivery location"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
                  />
                  <button
                    onClick={() => applyLocation(locationInput)}
                    className="ml-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white text-xs font-semibold shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
                  >
                    Apply
                  </button>
                </div>

                <button
                  onClick={handleUseCurrentLocation}
                  disabled={locationLoading}
                  className="mt-4 w-full inline-flex items-center justify-between rounded-xl border border-[#ff2b85]/40 bg-[#fff4f8] px-3 py-2 text-sm font-medium text-[#ff2b85] hover:bg-[#ffe6f0] transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FaLocationDot className="text-[#ff2b85]" size={16} />
                    <span>Use my current location</span>
                  </span>
                  {locationLoading && (
                    <span className="text-xs text-gray-500">
                      Detecting...
                    </span>
                  )}
                </button>

                {locationError && (
                  <p className="mt-2 text-xs text-red-500">
                    {locationError}
                  </p>
                )}

                {locationInput.trim().length >= 2 && (
                  <div className="mt-4 border-t border-gray-200 pt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                      {locationResultsLoading ? "Searching..." : "Search results"}
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {!locationResultsLoading && locationResults.length === 0 && (
                        <p className="text-xs text-gray-400 px-2">
                          No locations found for "{locationInput.trim()}"
                        </p>
                      )}
                      {locationResults.map((item) => (
                        <button
                          key={item}
                          onClick={() => applyLocation(item)}
                          className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-[#fff4f0] transition-all"
                        >
                          <FaLocationDot className="text-[#fc8019]" size={14} />
                          <span className="truncate">{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowLocationPicker(false)}
                className="text-gray-500 hover:text-gray-800 text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            {recentLocations.length > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Recent searches
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {recentLocations.map((item) => (
                    <button
                      key={item}
                      onClick={() => applyLocation(item)}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-[#fff4f0] transition-all"
                    >
                      <FaLocationDot className="text-[#fc8019]" size={14} />
                      <span className="truncate">{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Nav;
