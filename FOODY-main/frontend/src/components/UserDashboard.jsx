import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaCircleChevronLeft, FaCircleChevronRight } from "react-icons/fa6";

import Nav from "./Nav.jsx";
import CategoryCard from "./CategoryCard";
import FoodCard from "./FoodCard";

import heroImage from "../assets/image7.jpg";
import { itemAPI } from "../api";
import { getCategories } from "../category";
import {
  setItemsInMyCity,
  setShopsInMyCity,
} from "../redux/userSlice";

/* =====================
   HELPERS
===================== */
const normalize = (val = "") =>
  val.toString().trim().toLowerCase();

function UserDashboard() {
  const {
    currentCity,
    shopInMyCity,
    itemsInMyCity,
    socket,
    userData,
  } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cateRef = useRef(null);
  const shopRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  /* =====================
     ITEMS FETCH
  ===================== */
  const fetchItems = useCallback(async () => {
    try {
      let cityParam = "all";

      if (
        userData?.role !== "superadmin" &&
        userData?.role !== "owner"
      ) {
        cityParam = currentCity ? normalize(currentCity) : "all";
      }

      const res =
        cityParam !== "all"
          ? await itemAPI.getByCity(cityParam)
          : await itemAPI.searchItems("", "");

      dispatch(
        setItemsInMyCity(
          Array.isArray(res.data) ? res.data : []
        )
      );
    } catch (error) {
      console.error("❌ Fetch items failed:", error);
      dispatch(setItemsInMyCity([]));
    }
  }, [currentCity, userData?.role, dispatch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const topRatedItems = useMemo(() => {
    return [...itemsInMyCity]
      .filter(item => (item.rating?.average || 0) > 0)
      .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
      .slice(0, 8);
  }, [itemsInMyCity]);

  /* =====================
     FILTERED ITEMS
  ===================== */
  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return itemsInMyCity;

    return itemsInMyCity.filter(
      (item) =>
        item.category &&
        item.category.toLowerCase() ===
          selectedCategory.toLowerCase()
    );
  }, [itemsInMyCity, selectedCategory]);

  /* =====================
     SOCKET LISTENERS
  ===================== */
  useEffect(() => {
    if (!socket) return;

    const handleStockUpdate = () => fetchItems();

    const handleShopStatusUpdate = ({ shopId, isOpen }) => {
      dispatch(
        setShopsInMyCity(
          shopInMyCity.map((shop) =>
            shop._id === shopId
              ? { ...shop, isOpen }
              : shop
          )
        )
      );
    };

    socket.on("stockStatusUpdate", handleStockUpdate);
    socket.on("shopStatusUpdate", handleShopStatusUpdate);

    return () => {
      socket.off("stockStatusUpdate", handleStockUpdate);
      socket.off("shopStatusUpdate", handleShopStatusUpdate);
    };
  }, [socket, shopInMyCity, fetchItems, dispatch]);

  /* =====================
     CATEGORIES
  ===================== */
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res || []))
      .catch(() => setCategories([]));
  }, []);

  /* =====================
     UI
  ===================== */
  return (
    <div className="w-screen min-h-screen bg-[#fff9f6]">
      <Nav />

      <section className="max-w-6xl mx-auto pt-8 px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-10 rounded-3xl bg-gradient-to-r from-[#fff0e6] via-[#ffe4f0] to-[#ffe0d1] px-6 md:px-10 py-8 md:py-12 shadow-md">
          <div className="flex-1 space-y-4 md:space-y-6">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#ff4d2d]">
              {currentCity ? `Food delivery in ${currentCity}` : "Craving something tasty?"}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Order from top restaurants near you in minutes
            </h1>
            <p className="text-sm md:text-base text-gray-600 max-w-md">
              Explore nearby favorites, trending dishes and late-night cravings, all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                onClick={() => {
                  const el = document.getElementById("restaurants-section");
                  if (el) {
                    const offset = 80;
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = el.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: "smooth"
                    });
                  }
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.03] transition-all text-sm md:text-base"
              >
                Browse restaurants
              </button>
              {!userData && (
                <button
                  onClick={() => navigate("/signup")}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-[#ff2b85]/40 text-[#ff2b85] bg-white/80 font-semibold hover:bg-[#ff2b85]/5 transition-all text-sm md:text-base"
                >
                  Create free account
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="relative w-full max-w-sm mx-auto">
              <div className="absolute -top-3 -left-3 w-16 h-16 bg-[#ffecd9] rounded-full blur-xl" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#ffe0f0] rounded-full blur-2xl" />
              <img
                src={heroImage}
                alt="Delicious food illustration"
                className="relative z-[1] w-full rounded-3xl shadow-xl object-cover h-[220px] md:h-[260px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CATEGORIES ---------------- */}
      <section className="max-w-6xl mx-auto p-4 mt-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Inspiration for your first order
            </h2>

            {selectedCategory !== "All" && (
              <p className="text-sm text-[#fc8019] font-medium">
                Showing: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="ml-2 underline text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                cateRef.current?.scrollBy({
                  left: -200,
                  behavior: "smooth",
                })
              }
              className="text-[#fc8019]"
            >
              <FaCircleChevronLeft size={30} />
            </button>

            <button
              onClick={() =>
                cateRef.current?.scrollBy({
                  left: 200,
                  behavior: "smooth",
                })
              }
              className="text-[#fc8019]"
            >
              <FaCircleChevronRight size={30} />
            </button>
          </div>
        </div>

        <div
          ref={cateRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-4 scroll-smooth"
        >
          {categories.map((cat) => (
            <CategoryCard
              key={cat._id}
              name={cat.name}
              image={cat.image}
              onClick={() =>
                navigate(`/collection/${cat.name}`)
              }
            />
          ))}
        </div>
      </section>

      {/* ---------------- SHOPS ---------------- */}
      <section id="restaurants-section" className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Best Shops
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() =>
                shopRef.current?.scrollBy({
                  left: -300,
                  behavior: "smooth",
                })
              }
              className="text-[#fc8019]"
            >
              <FaCircleChevronLeft size={30} />
            </button>

            <button
              onClick={() =>
                shopRef.current?.scrollBy({
                  left: 300,
                  behavior: "smooth",
                })
              }
              className="text-[#fc8019]"
            >
              <FaCircleChevronRight size={30} />
            </button>
          </div>
        </div>

        <div
          ref={shopRef}
          className="flex gap-6 overflow-x-auto no-scrollbar pb-4 scroll-smooth"
        >
          {shopInMyCity.length > 0 ? (
            shopInMyCity.map((shop) => (
              <CategoryCard
                key={shop._id}
                name={shop.name}
                image={shop.image}
                isOpen={shop.isOpen}
                shopId={shop._id}
                onClick={() =>
                  navigate(`/shop/${shop._id}`)
                }
              />
            ))
          ) : (
            <div className="w-full text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500">
                No shops available in your area yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ---------------- TOP RATED ITEMS ---------------- */}
      <section className="max-w-6xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Top Rated Food Items
          </h2>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200 uppercase tracking-wider">
            Best Choices
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center sm:justify-items-start">
          {topRatedItems.length > 0 ? (
            topRatedItems.map((item) => (
              <FoodCard key={item._id} data={item} hideFooter={false} />
            ))
          ) : (
            <div className="w-full text-center py-10 col-span-full">
              <p className="text-gray-500">Loading top rated items for you...</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

export default UserDashboard;
