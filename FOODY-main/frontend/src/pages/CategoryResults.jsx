import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaArrowLeft, FaUtensils, FaFilter } from "react-icons/fa6";
import Nav from "../components/Nav";
import FoodCard from "../components/FoodCard";
import { itemAPI } from "../api";

function CategoryResults() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { currentCity } = useSelector((state) => state.user);
  
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterFoodType, setFilterFoodType] = useState("All");

  const fetchCategoryItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const cityParam = currentCity ? currentCity.toLowerCase() : "all";
      // We'll use the API's query params
      const res = await itemAPI.getByCity(cityParam, { category: categoryName });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("❌ Fetch category items failed:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [categoryName, currentCity]);

  useEffect(() => {
    fetchCategoryItems();
  }, [fetchCategoryItems]);

  const filteredItems = useMemo(() => {
    let arr = [...items];
    
    // Client-side food type filtering
    if (filterFoodType && filterFoodType !== "All") {
      arr = arr.filter(i => (i.foodType || "").toLowerCase() === filterFoodType.toLowerCase());
    }

    // Client-side sorting (or we could use API but this is faster for existing data)
    switch (sortBy) {
      case "price_low_high":
        arr.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_high_low":
        arr.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "rating":
        arr.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
        break;
      case "prep_time":
        arr.sort((a, b) => (a.preparationTime || 0) - (b.preparationTime || 0));
        break;
      default:
        break;
    }
    return arr;
  }, [items, sortBy, filterFoodType]);

  return (
    <div className="min-h-screen bg-[#fff9f6] pt-[100px]">
      <Nav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all text-gray-700 hover:text-[#fc8019]"
            >
              <FaArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                {categoryName} <span className="text-[#fc8019] text-xl font-medium">Collection</span>
              </h1>
              <p className="text-gray-500 mt-1">
                Explore the best {categoryName.toLowerCase()} options in {currentCity || "your city"}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#fc8019] cursor-pointer"
            >
              <option value="">Sort By</option>
              <option value="price_low_high">Price: Low to High</option>
              <option value="price_high_low">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="prep_time">Fastest Delivery</option>
            </select>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm text-sm font-medium transition-all ${showFilters ? 'bg-[#fc8019] border-[#fc8019] text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <FaFilter /> Filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dietary Preference</label>
                <div className="flex gap-2">
                  {["All", "Veg", "Non Veg"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterFoodType(type)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${filterFoodType === type ? 'bg-[#fc8019] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#fc8019] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Finding the best {categoryName} for you...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center sm:justify-items-start">
            {filteredItems.map((item) => (
              <FoodCard key={item._id} data={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUtensils size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No results found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-6">
              Try adjusting your filters or sorting to find what you're looking for.
            </p>
            <button 
              onClick={() => {
                setSortBy("");
                setFilterFoodType("All");
              }}
              className="px-6 py-2 border-2 border-[#fc8019] text-[#fc8019] font-bold rounded-full hover:bg-[#fc8019] hover:text-white transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default CategoryResults;
