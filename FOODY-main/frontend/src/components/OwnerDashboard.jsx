import React, { useState, useEffect, useCallback } from 'react';
import Nav from './Nav.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { FaUtensils, FaStore, FaToggleOn, FaToggleOff, FaPen, FaStar, FaList, FaClipboardList } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import OwnerItemCard from './OwnerItemCard';
import { setMyShopData, setActiveTab } from '../redux/ownerSlice';
import { shopAPI, categoryAPI, getImageUrl } from '../api';
import { ClipLoader } from "react-spinners";

function OwnerDashboard() {
  const { myShopData, activeTab } = useSelector(state => state.owner);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dashboard stats state
  const [bestSellingItems, setBestSellingItems] = useState([]);
  const [topRatedItems, setTopRatedItems] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: null });
  const [categoryImagePreview, setCategoryImagePreview] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryData, setEditCategoryData] = useState({ name: '', description: '', image: null });
  const [editCategoryImagePreview, setEditCategoryImagePreview] = useState(null);

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showMessage('Error fetching categories', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const [bestSellingRes, topRatedRes] = await Promise.all([
        shopAPI.getBestSelling(),
        shopAPI.getTopRated()
      ]);
      setBestSellingItems(bestSellingRes.data);
      setTopRatedItems(topRatedRes.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
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
    fetchCategories();
    fetchDashboardStats();
  }, [dispatch, fetchCategories, fetchDashboardStats]);

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

  const createCategory = async () => {
    if (!newCategory.name.trim()) {
      showMessage('Category name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', newCategory.name);
      formData.append('description', newCategory.description);
      if (newCategory.image) {
        formData.append('image', newCategory.image);
      }

      await categoryAPI.createCategory(formData);
      showMessage('Category created successfully');
      setNewCategory({ name: '', description: '', image: null });
      setCategoryImagePreview(null);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      showMessage(error.response?.data?.message || 'Error creating category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditCategory = (category) => {
    setEditingCategory(category._id);
    setEditCategoryData({
      name: category.name,
      description: category.description,
      image: null
    });
    setEditCategoryImagePreview(getImageUrl(category.image));
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryData({ name: '', description: '', image: null });
    setEditCategoryImagePreview(null);
  };

  const updateCategory = async (categoryId) => {
    if (!editCategoryData.name.trim()) {
      showMessage('Category name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', editCategoryData.name);
      formData.append('description', editCategoryData.description);
      if (editCategoryData.image) {
        formData.append('image', editCategoryData.image);
      }

      await categoryAPI.updateCategory(categoryId, formData);
      showMessage('Category updated successfully');
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      showMessage(error.response?.data?.message || 'Error updating category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      setLoading(true);
      await categoryAPI.deleteCategory(categoryId);
      showMessage('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showMessage('Error deleting category', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex flex-col items-center">
      <Nav />

      {/* Message Notifications */}
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-2">
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl shadow-lg animate-fade-in-down">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-lg animate-fade-in-down">
            {error}
          </div>
        )}
      </div>

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
        <div className="w-full flex flex-col items-center gap-6 px-4 sm:px-6 mt-8 max-w-6xl">
          
          {/* Tab Content: Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="w-full flex flex-col gap-8">
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

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
                {/* Shop Status */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Shop Status</h3>
                    <p className={`text-2xl font-black ${myShopData.isOpen ? 'text-green-500' : 'text-red-500'} mb-2`}>
                      {myShopData.isOpen ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={myShopData.isOpen}
                        onChange={handleShopStatusToggle}
                        disabled={isUpdatingStatus}
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                    </label>
                  </div>
                </div>

                {/* Average Rating */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[160px]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Average Rating</h3>
                  <div className="flex flex-col items-center">
                    <p className="text-4xl font-black text-orange-500">
                      {Number(myShopData?.rating?.average || 0).toFixed(1)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">from {myShopData?.rating?.count || 0} reviews</p>
                  </div>
                </div>

                {/* Total Menu Items */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[160px]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Menu Items</h3>
                  <p className="text-5xl font-black text-[#ff2b85]">{myShopData.items.length}</p>
                </div>
              </div>

              {/* Dashboard Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mb-10">
                {/* 🔥 Best Selling Items */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <h2 className="text-xl font-bold text-gray-800">Best Selling Items</h2>
                  </div>
                  {statsLoading ? (
                    <div className="flex justify-center py-10">
                      <ClipLoader color="#ff4d2d" size={30} />
                    </div>
                  ) : bestSellingItems.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                      <p className="text-gray-500 italic">No order data available yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {bestSellingItems.map((item) => (
                        <div key={item._id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                          <img 
                            src={getImageUrl(item.image)} 
                            alt={item.name} 
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                            <p className="text-sm text-[#ff4d2d] font-semibold">₹{item.price}</p>
                          </div>
                          <div className="bg-orange-50 px-3 py-1 rounded-full">
                            <p className="text-xs font-bold text-[#fc8019] whitespace-nowrap">
                              {item.popularity || 0} orders
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ⭐ Top Rated Items */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <h2 className="text-xl font-bold text-gray-800">Top Rated Items</h2>
                  </div>
                  {statsLoading ? (
                    <div className="flex justify-center py-10">
                      <ClipLoader color="#ff4d2d" size={30} />
                    </div>
                  ) : topRatedItems.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                      <p className="text-gray-500 italic">No highly rated items yet (min. 3 reviews).</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {topRatedItems.map((item) => (
                        <div key={item._id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                          <img 
                            src={getImageUrl(item.image)} 
                            alt={item.name} 
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              <FaStar className="text-yellow-400 text-xs" />
                              <span className="text-sm font-bold text-gray-700">{item.rating?.average?.toFixed(1)}</span>
                              <span className="text-xs text-gray-400">({item.rating?.count} reviews)</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[#ff4d2d] font-semibold">₹{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Menu Items */}
          {activeTab === 'menu' && (
            <div className="w-full flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Your Menu</h2>
                <button
                  onClick={() => navigate("/add-item")}
                  className="bg-[#ff4d2d] text-white px-4 py-2 rounded-xl font-semibold shadow-md hover:bg-orange-600 transition-colors"
                >
                  Add New Item
                </button>
              </div>

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
                    <OwnerItemCard key={index} data={item} showMessage={showMessage} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Categories */}
          {activeTab === 'categories' && (
            <div className="w-full bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Management</h2>

              {/* Add Category Form */}
              <div className="bg-orange-50/50 rounded-xl p-6 mb-8 border border-orange-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600 ml-1 uppercase">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Italian, Desserts"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff4d2d] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600 ml-1 uppercase">Description</label>
                    <input
                      type="text"
                      placeholder="Short description of the category"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff4d2d] transition-all"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-600 ml-1 uppercase block mb-1">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewCategory({ ...newCategory, image: file });
                        setCategoryImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-sm"
                  />
                  {categoryImagePreview && (
                    <div className="mt-3">
                      <img
                        src={categoryImagePreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={createCategory}
                  disabled={loading}
                  className="bg-[#ff4d2d] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  {loading ? <ClipLoader size={20} color="white" /> : "Add Category"}
                </button>
              </div>

              {/* Categories List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Categories</h3>
                {loading && categories.length === 0 ? (
                  <div className="text-center py-10">
                    <ClipLoader color="#ff4d2d" size={40} />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 italic bg-gray-50 rounded-2xl">
                    No categories found. Add your first category above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {categories.map((category) => (
                      <div key={category._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                        {editingCategory === category._id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                value={editCategoryData.name}
                                onChange={(e) => setEditCategoryData({ ...editCategoryData, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]"
                              />
                              <input
                                type="text"
                                value={editCategoryData.description}
                                onChange={(e) => setEditCategoryData({ ...editCategoryData, description: e.target.value })}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]"
                              />
                            </div>
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setEditCategoryData({ ...editCategoryData, image: file });
                                    setEditCategoryImagePreview(URL.createObjectURL(file));
                                  }
                                }}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                              />
                              {editCategoryImagePreview && (
                                <img src={editCategoryImagePreview} alt="Preview" className="w-20 h-20 object-cover mt-2 rounded-lg" />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateCategory(category._id)}
                                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditCategory}
                                className="bg-gray-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {category.image && (
                                <img
                                  src={getImageUrl(category.image)}
                                  alt={category.name}
                                  className="w-16 h-16 object-cover rounded-xl border border-gray-100"
                                />
                              )}
                              <div>
                                <h4 className="font-bold text-gray-900">{category.name}</h4>
                                <p className="text-sm text-gray-500">{category.description}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditCategory(category)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                              >
                                <FaPen size={16} />
                              </button>
                              <button
                                onClick={() => deleteCategory(category._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all"
                              >
                                <FaUtensils size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
