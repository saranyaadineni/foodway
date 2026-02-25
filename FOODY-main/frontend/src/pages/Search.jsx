import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { IoIosSearch } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import { getCategories } from "../category";
import { itemAPI, shopAPI } from "../api";
import FoodCard from "../components/FoodCard";

function Search() {
  const { currentCity } = useSelector((state) => state.user);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchResults, setSearchResults] = useState({ items: [], shops: [] });
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch categories for popular cuisines
    getCategories()
      .then((res) => setCategories(res || []))
      .catch(() => setCategories([]));

    // Fetch recent searches from localStorage
    const stored = localStorage.getItem("fw_recent_searches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults({ items: [], shops: [] });
      return;
    }
    setIsLoading(true);
    try {
      // 1. Search items
      const itemRes = await itemAPI.searchItems(searchQuery, currentCity || "");
      
      // 2. Search shops (clientside filter for now if no backend search, or use getByCity)
      const shopRes = await shopAPI.getByCity(currentCity || "all");
      const filteredShops = shopRes.data.filter(shop => 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults({
        items: Array.isArray(itemRes.data) ? itemRes.data : [],
        shops: filteredShops
      });
      
      // Save to recent searches
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("fw_recent_searches", JSON.stringify(updated));
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentCity, recentSearches]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        handleSearch(query);
      } else {
        setSearchResults({ items: [], shops: [] });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("fw_recent_searches");
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResults({ items: [], shops: [] });
  };

  return (
    <div className="min-h-screen bg-white pt-[100px]">
      <Nav />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Input Area */}
        <div className="relative flex items-center border border-gray-300 rounded-lg px-4 py-3 shadow-sm focus-within:border-[#fc8019] transition-all">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for restaurants and food"
            className="w-full outline-none text-lg text-gray-700 placeholder-gray-400"
            autoFocus
          />
          {query ? (
            <RxCross2 
              size={24} 
              className="text-gray-500 cursor-pointer hover:text-gray-700" 
              onClick={clearSearch}
            />
          ) : (
            <IoIosSearch size={24} className="text-gray-400" />
          )}
        </div>

        {!query && (
          <div className="mt-10 space-y-10">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Recent Searches</h2>
                  <button 
                    onClick={clearRecentSearches}
                    className="text-sm font-semibold text-[#fc8019] hover:text-[#ff2b85] transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(s)}
                      className="w-full flex items-center gap-3 px-2 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all group"
                    >
                      <IoIosSearch size={20} className="text-gray-400 group-hover:text-gray-600" />
                      <span className="text-[15px] font-medium">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Cuisines */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Popular Cuisines</h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {categories.map((cat) => (
                  <div 
                    key={cat._id} 
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                    onClick={() => setQuery(cat.name)}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-transparent group-hover:border-[#fc8019] transition-all shadow-sm">
                      <img 
                        src={cat.image} 
                        alt={cat.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 group-hover:text-[#fc8019] text-center">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {query && (
          <div className="mt-8 relative min-h-[200px]">
            {/* Smooth Loader - no flickering */}
            {isLoading && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-100 overflow-hidden z-10">
                <div className="h-full bg-[#fc8019] animate-progress-indefinite"></div>
              </div>
            )}

            <div className={`space-y-8 transition-opacity duration-200`}>
              {(searchResults.shops.length > 0 || searchResults.items.length > 0) ? (
                <>
                  {/* Shops Results */}
                  {searchResults.shops.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-gray-800">Restaurants</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {searchResults.shops.map((shop) => (
                          <div 
                            key={shop._id} 
                            onClick={() => navigate(`/shop/${shop._id}`)}
                            className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:shadow-md transition-all cursor-pointer group"
                          >
                            <img 
                              src={shop.image} 
                              alt={shop.name} 
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div>
                              <h3 className="font-bold text-gray-900 group-hover:text-[#fc8019]">{shop.name}</h3>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{shop.address}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${shop.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {shop.isOpen ? 'OPEN' : 'CLOSED'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items Results */}
                  {searchResults.items.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-gray-800">Dishes</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {searchResults.items.map((item) => (
                          <FoodCard key={item._id} data={item} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                !isLoading && (
                  <div className="text-center py-20 text-gray-500">
                    <p className="text-lg">No results found for "{query}"</p>
                    <p className="text-sm mt-2">Try searching for something else!</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
