import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaCircleChevronLeft, FaCircleChevronRight } from "react-icons/fa6";

import Nav from "./Nav.jsx";
import CategoryCard from "./CategoryCard";
import FoodCard from "./FoodCard";

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
                setSelectedCategory(cat.name)
              }
            />
          ))}
        </div>
      </section>

      {/* ---------------- SHOPS ---------------- */}
      <section className="max-w-6xl mx-auto p-4">
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

      {/* ---------------- ITEMS ---------------- */}
      <section className="max-w-6xl mx-auto p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Suggested Food Items
        </h2>

        <div className="flex flex-wrap gap-8 justify-center sm:justify-start">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <FoodCard key={item._id} data={item} />
            ))
          ) : (
            <div className="w-full text-center py-10">
              <p className="text-gray-500">
                {selectedCategory === "All"
                  ? "Loading delicious items for you..."
                  : `No items found in "${selectedCategory}"`}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default UserDashboard;
