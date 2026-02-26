import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateAboutContent, updateContactContent } from '../redux/userSlice';
import { authAPI, superAdminAPI, getImageUrl } from '../api';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { aboutContent, contactContent } = useSelector((state) => state.user);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Content Management State
    const [editAbout, setEditAbout] = useState(aboutContent);
    const [editContact, setEditContact] = useState(contactContent);

    // Dashboard data
    const [dashboardStats, setDashboardStats] = useState({
        userCount: 0,
        ownerCount: 0,
        deliveryBoyCount: 0,
        pendingOwnerCount: 0,
        categoryCount: 0
    });

    // Delivery boy approvals data
    const [pendingDeliveryBoys, setPendingDeliveryBoys] = useState([]);
    const [pendingOwners, setPendingOwners] = useState([]);

    // Categories data
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({ name: '', description: '', image: null });
    const [categoryImagePreview, setCategoryImagePreview] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCategoryData, setEditCategoryData] = useState({ name: '', description: '', image: null });
    const [editCategoryImagePreview, setEditCategoryImagePreview] = useState(null);

    // User management data
    const [users, setUsers] = useState([]);
    const [searchRole, setSearchRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // User types data
    const [userTypes, setUserTypes] = useState([]);
    const [newUserType, setNewUserType] = useState({ name: '', description: '', deliveryAllowed: false });



    // Effects moved below to avoid referencing callbacks before initialization

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

    const handleLogout = async () => {
        try {
            await authAPI.signout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch(logout());
            navigate('/signin');
        }
    };

    const handleSaveAbout = () => {
        dispatch(updateAboutContent(editAbout));
        showMessage('About content updated successfully!');
    };

    const handleSaveContact = () => {
        dispatch(updateContactContent(editContact));
        showMessage('Contact information updated successfully!');
    };

    // Fetch dashboard statistics
    const fetchDashboardStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await superAdminAPI.getDashboardStats();
            setDashboardStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            showMessage('Error fetching dashboard statistics', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch pending delivery boys
    const fetchPendingDeliveryBoys = useCallback(async () => {
        try {
            setLoading(true);
            const response = await superAdminAPI.getPendingDeliveryBoys();
            setPendingDeliveryBoys(response.data);
        } catch (error) {
            console.error('Error fetching pending delivery boys:', error);
            showMessage('Error fetching pending delivery boys', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch pending owners
    const fetchPendingOwners = useCallback(async () => {
        try {
            setLoading(true);
            const response = await superAdminAPI.getPendingOwners();
            setPendingOwners(response.data);
        } catch (error) {
            console.error('Error fetching pending owners:', error);
            showMessage('Error fetching pending owners', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Update delivery boy status
    const updateDeliveryBoyStatus = async (userId, action) => {
        try {
            setLoading(true);
            await superAdminAPI.updateDeliveryBoyStatus(userId, action);
            showMessage(`Delivery boy ${action}d successfully`);
            fetchPendingDeliveryBoys(); // Refresh the list
            fetchDashboardStats(); // Refresh stats
        } catch (error) {
            console.error('Error updating delivery boy status:', error);
            showMessage('Error updating delivery boy status', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Update owner status
    const updateOwnerStatus = async (userId, action) => {
        try {
            setLoading(true);
            await superAdminAPI.updateOwnerStatus(userId, action);
            showMessage(`Owner ${action}d successfully`);
            fetchPendingOwners(); // Refresh the list
            fetchDashboardStats(); // Refresh stats
        } catch (error) {
            console.error('Error updating owner status:', error);
            showMessage('Error updating owner status', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const response = await superAdminAPI.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showMessage('Error fetching categories', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create category
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

            await superAdminAPI.createCategory(formData);
            showMessage('Category created successfully');
            setNewCategory({ name: '', description: '', image: null });
            setCategoryImagePreview(null);
            fetchCategories(); // Refresh the list
            fetchDashboardStats(); // Refresh stats
        } catch (error) {
            console.error('Error creating category:', error);
            const errorMessage = error.response?.data?.message || 'Error creating category';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Delete category
    const deleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            setLoading(true);
            await superAdminAPI.deleteCategory(categoryId);
            showMessage('Category deleted successfully');
            fetchCategories(); // Refresh the list
            fetchDashboardStats(); // Refresh stats
        } catch (error) {
            console.error('Error deleting category:', error);
            showMessage('Error deleting category', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Start editing category
    const startEditCategory = (category) => {
        setEditingCategory(category._id);
        setEditCategoryData({
            name: category.name,
            description: category.description,
            image: null
        });
        setEditCategoryImagePreview(getImageUrl(category.image));
    };

    // Cancel editing category
    const cancelEditCategory = () => {
        setEditingCategory(null);
        setEditCategoryData({ name: '', description: '', image: null });
        setEditCategoryImagePreview(null);
    };

    // Update category
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

            await superAdminAPI.updateCategory(categoryId, formData);
            showMessage('Category updated successfully');
            setEditingCategory(null);
            setEditCategoryData({ name: '', description: '', image: null });
            setEditCategoryImagePreview(null);
            fetchCategories(); // Refresh the list
            fetchDashboardStats(); // Refresh stats
        } catch (error) {
            console.error('Error updating category:', error);
            const errorMessage = error.response?.data?.message || 'Error updating category';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch users
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchRole !== 'all') params.append('role', searchRole);
            if (searchTerm.trim()) params.append('search', searchTerm.trim());

            const response = await superAdminAPI.getUsers(params);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            showMessage('Error fetching users', 'error');
        } finally {
            setLoading(false);
        }
    }, [searchRole, searchTerm]);

    // Fetch user types
    const fetchUserTypes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await superAdminAPI.getUserTypes();
            setUserTypes(response.data);
        } catch (error) {
            console.error('Error fetching user types:', error);
            showMessage('Error fetching user types', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch initial dashboard stats and set auto-refresh
    useEffect(() => {
        fetchDashboardStats();
        const interval = setInterval(fetchDashboardStats, 30000);
        return () => clearInterval(interval);
    }, [fetchDashboardStats]);

    // Fetch data based on active tab
    useEffect(() => {
        if (activeTab === 'deliveryboys') {
            fetchPendingDeliveryBoys();
        } else if (activeTab === 'owners') {
            fetchPendingOwners();
        } else if (activeTab === 'categories') {
            fetchCategories();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'usertypes') {
            fetchUserTypes();
        }
    }, [activeTab, fetchPendingDeliveryBoys, fetchPendingOwners, fetchCategories, fetchUsers, fetchUserTypes]);

    // Debounced search for users
    useEffect(() => {
        if (activeTab === 'users') {
            const debounceTimer = setTimeout(() => {
                fetchUsers();
            }, 500);
            return () => clearTimeout(debounceTimer);
        }
    }, [searchRole, searchTerm, activeTab, fetchUsers]);

    // Create user type
    const createUserType = async () => {
        if (!newUserType.name.trim()) {
            showMessage('User type name is required', 'error');
            return;
        }

        // Prevent client-side duplicates (case-insensitive)
        const normalizedName = newUserType.name.trim().toLowerCase();
        const isDuplicate = userTypes.some(ut => (ut.name || '').trim().toLowerCase() === normalizedName);
        if (isDuplicate) {
            showMessage('User type already exists', 'error');
            return;
        }

        try {
            setLoading(true);
            await superAdminAPI.createUserType({
                name: newUserType.name.trim(),
                description: newUserType.description,
                deliveryAllowed: newUserType.deliveryAllowed
            });
            showMessage('User type created successfully');
            setNewUserType({ name: '', description: '', deliveryAllowed: false });
            fetchUserTypes(); // Refresh the list
        } catch (error) {
            console.error('Error creating user type:', error);
            const msg = error?.response?.data?.message || 'Error creating user type';
            showMessage(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Update user type delivery status
    const updateUserTypeDelivery = async (userTypeId, deliveryAllowed) => {
        try {
            setLoading(true);
            await superAdminAPI.updateUserTypeDelivery(userTypeId, deliveryAllowed);
            showMessage(`Delivery ${deliveryAllowed ? 'enabled' : 'disabled'} successfully`);
            fetchUserTypes(); // Refresh the list
        } catch (error) {
            console.error('Error updating user type delivery:', error);
            showMessage('Error updating delivery status', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Delete user type
    const deleteUserType = async (userTypeId) => {
        if (!window.confirm('Are you sure you want to delete this user type?')) return;

        try {
            setLoading(true);
            await superAdminAPI.deleteUserType(userTypeId);
            showMessage('User type deleted successfully');
            fetchUserTypes(); // Refresh the list
        } catch (error) {
            console.error('Error deleting user type:', error);
            showMessage('Error deleting user type', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fff2eb] via-[#ffe7db] to-[#ffd9c9] relative overflow-hidden">
            {/* Floating blobs for warm depth */}
            <div className="absolute w-[26rem] h-[26rem] bg-[#fc8019]/25 rounded-full blur-3xl top-16 left-10 animate-pulse" />
            <div className="absolute w-[26rem] h-[26rem] bg-[#ff2b85]/25 rounded-full blur-3xl bottom-12 right-10 animate-pulse" />
            <div className="absolute w-[20rem] h-[20rem] bg-[#fc8019]/20 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />

            {/* Content container with backdrop */}
            <div className="relative z-10">
                {/* Header */}
                <div className="border-b border-white/40 backdrop-blur-xl bg-white/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85] drop-shadow-md">
                                <span className="text-[#ff2b85]"></span> Super Admin
                            </h1>
                            <button
                                onClick={handleLogout}
                                className="bg-gradient-to-r from-[#fc8019] to-[#ff2b85] hover:from-[#e67315] hover:to-[#e62579] text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-white/40 backdrop-blur-xl bg-white/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-4 sm:space-x-8 py-4 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
                            {[
                                { id: 'dashboard', label: 'Dashboard' },
                                { id: 'deliveryboys', label: 'Delivery Boy Approvals' },
                                { id: 'owners', label: 'Owner Approvals' },
                                { id: 'categories', label: 'Categories' },
                                { id: 'users', label: 'User Management' },
                                { id: 'usertypes', label: 'User Types' },
                                { id: 'content', label: 'Manage Content' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm inline-block ${
                                        activeTab === tab.id
                                            ? 'border-[#fc8019] text-[#fc8019] bg-[#fc8019]/10'
                                            : 'border-transparent text-gray-600 hover:text-[#fc8019] hover:border-[#fc8019]/50 transition-colors'
                                    } transition-all duration-200`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Messages */}
                    {error && (
                        <div className="mb-4 bg-red-100/90 backdrop-blur-sm border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-md">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 bg-green-100/90 backdrop-blur-sm border border-green-400 text-green-700 px-4 py-3 rounded-xl shadow-md">
                            {success}
                        </div>
                    )}

                    {/* Dashboard Overview */}
                    {activeTab === 'dashboard' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                {[
                                    { label: 'Total Users', value: dashboardStats.userCount, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: 'Total Owners', value: dashboardStats.ownerCount, color: 'text-green-600', bg: 'bg-green-50' },
                                    { label: 'Delivery Boys', value: dashboardStats.deliveryBoyCount, color: 'text-purple-600', bg: 'bg-purple-50' },
                                    { label: 'Pending Owners', value: dashboardStats.pendingOwnerCount, color: 'text-orange-600', bg: 'bg-orange-50' },
                                    { label: 'Categories', value: dashboardStats.categoryCount, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                                ].map((stat, index) => (
                                    <div key={index} className={`${stat.bg} backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl hover:scale-105 transition-all duration-300`}>
                                        <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.label}</h3>
                                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Delivery Boy Approvals */}
                    {activeTab === 'deliveryboys' && (
                        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Delivery Boy Approvals</h2>
                            {loading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : pendingDeliveryBoys.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No pending approvals</div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingDeliveryBoys.map((deliveryBoy) => (
                                        <div key={deliveryBoy._id} className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-medium text-gray-900 truncate">{deliveryBoy.fullName}</h3>
                                                    <p className="text-sm text-gray-500 truncate">{deliveryBoy.email}</p>
                                                    <p className="text-sm text-gray-500">{deliveryBoy.mobile}</p>
                                                </div>
                                                <div className="flex space-x-2 shrink-0">
                                                    <button
                                                        onClick={() => updateDeliveryBoyStatus(deliveryBoy._id, 'approve')}
                                                        className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-60 text-sm font-semibold"
                                                        disabled={loading}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => updateDeliveryBoyStatus(deliveryBoy._id, 'reject')}
                                                        className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-60 text-sm font-semibold"
                                                        disabled={loading}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Owner Approvals */}
                    {activeTab === 'owners' && (
                        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Owner Approvals</h2>
                            {loading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : pendingOwners.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No pending approvals</div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingOwners.map((owner) => (
                                        <div key={owner._id} className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-medium text-gray-900 truncate">{owner.fullName}</h3>
                                                    <p className="text-sm text-gray-500 truncate">{owner.email}</p>
                                                    <p className="text-sm text-gray-500">{owner.mobile}</p>
                                                </div>
                                                <div className="flex space-x-2 shrink-0">
                                                    <button
                                                        onClick={() => updateOwnerStatus(owner._id, 'approve')}
                                                        className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-60 text-sm font-semibold"
                                                        disabled={loading}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => updateOwnerStatus(owner._id, 'reject')}
                                                        className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-60 text-sm font-semibold"
                                                        disabled={loading}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Categories */}
                    {activeTab === 'categories' && (
                        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Management</h2>

                            {/* Add Category Form */}
                            <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-6 mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Category Name"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
                                    />
                                </div>

                                {/* Image Upload Section */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
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
                                        className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fc8019] w-full bg-white/80"
                                    />
                                    {categoryImagePreview && (
                                        <div className="mt-2">
                                            <img
                                                src={categoryImagePreview}
                                                alt="Category preview"
                                                className="w-32 h-32 object-cover rounded-xl border border-white/40"
                                            />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={createCategory}
                                    disabled={loading}
                                    className="mt-4 bg-gradient-to-r from-[#fc8019] to-[#ff2b85] hover:from-[#e67315] hover:to-[#e62579] text-white px-4 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60"
                                >
                                    Add Category
                                </button>
                            </div>

                            {/* Categories List */}
                            {loading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No categories found</div>
                            ) : (
                                <div className="space-y-4">
                                    {categories.map((category) => (
                                        <div key={category._id} className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 transition-colors">
                                            {editingCategory === category._id ? (
                                                // Edit Mode
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <input
                                                            type="text"
                                                            placeholder="Category Name"
                                                            value={editCategoryData.name}
                                                            onChange={(e) => setEditCategoryData({ ...editCategoryData, name: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Description"
                                                            value={editCategoryData.description}
                                                            onChange={(e) => setEditCategoryData({ ...editCategoryData, description: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
                                                        />
                                                    </div>

                                                    {/* Image Upload Section for Edit */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
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
                                                            className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fc8019] w-full bg-white/80"
                                                        />
                                                        {editCategoryImagePreview && (
                                                            <div className="mt-2">
                                                                <img
                                                                    src={editCategoryImagePreview}
                                                                    alt="Category preview"
                                                                    className="w-32 h-32 object-cover rounded-xl border border-white/40"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => updateCategory(category._id)}
                                                            disabled={loading}
                                                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-60"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={cancelEditCategory}
                                                            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // View Mode
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        {category.image && (
                                                            <img
                                                                src={getImageUrl(category.image)}
                                                                alt={category.name}
                                                                className="w-16 h-16 object-cover rounded-xl border border-white/40"
                                                            />
                                                        )}
                                                        <div>
                                                            <h3 className="text-lg font-medium text-gray-900">
                                                                {category.name}
                                                                <span className="text-sm text-blue-600 ml-2">
                                                                    (ID: {category.categoryId || category._id})
                                                                </span>
                                                            </h3>
                                                            <p className="text-sm text-gray-500">{category.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => startEditCategory(category)}
                                                            className="bg-gradient-to-r from-[#fc8019] to-[#ff2b85] hover:from-[#e67315] hover:to-[#e62579] text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-60"
                                                            disabled={loading}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteCategory(category._id)}
                                                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-60"
                                                            disabled={loading}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* User Management */}
                    {activeTab === 'users' && (
                        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>

                            {/* Search and Filter */}
                            <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-6 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <select
                                        value={searchRole}
                                        onChange={(e) => setSearchRole(e.target.value)}
                                        className="border border-gray-300 rounded-xl px-3 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="user">Users</option>
                                        <option value="owner">Owners</option>
                                        <option value="deliveryBoy">Delivery Boys</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="border border-gray-300 rounded-xl px-3 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Users List */}
                            {loading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No users found</div>
                            ) : (
                                <div className="space-y-4">
                                    {users.map((user) => (
                                        <div key={user._id} className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">{user.fullName}</h3>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                    <p className="text-sm text-gray-500">{user.mobile}</p>
                                                    <div className="flex items-center space-x-4 mt-2">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            user.role === 'user' ? 'bg-blue-100 text-blue-800' :
                                                            user.role === 'owner' ? 'bg-green-100 text-green-800' :
                                                            user.role === 'deliveryBoy' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {user.role}
                                                        </span>
                                                        {user.role === 'owner' && (
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                user.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {user.isApproved ? 'Approved' : 'Pending'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* User Types Management */}
                    {activeTab === 'usertypes' && (
                        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">User Types Management</h2>

                            {/* Add User Type Form */}
                            <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-6 mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User Type</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="User Type Name"
                                        value={newUserType.name}
                                        onChange={(e) => setNewUserType({ ...newUserType, name: e.target.value })}
                                        className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={newUserType.description}
                                        onChange={(e) => setNewUserType({ ...newUserType, description: e.target.value })}
                                        className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all"
                                    />
                                </div>
                                <div className="mt-4 flex items-center">
                                    <input
                                        type="checkbox"
                                        id="deliveryAllowed"
                                        checked={newUserType.deliveryAllowed}
                                        onChange={(e) => setNewUserType({ ...newUserType, deliveryAllowed: e.target.checked })}
                                        className="h-4 w-4 text-[#fc8019] focus:ring-[#fc8019] border-gray-300 rounded"
                                    />
                                    <label htmlFor="deliveryAllowed" className="ml-2 block text-sm text-gray-900">
                                        Allow Delivery for this User Type
                                    </label>
                                </div>
                                <button
                                    onClick={createUserType}
                                    disabled={loading}
                                    className="mt-4 bg-gradient-to-r from-[#fc8019] to-[#ff2b85] hover:from-[#e67315] hover:to-[#e62579] text-white px-4 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60"
                                >
                                    Add User Type
                                </button>
                            </div>

                            {/* User Types List */}
                            {loading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : userTypes.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No user types found</div>
                            ) : (
                                <div className="space-y-4">
                                    {userTypes.map((userType) => (
                                        <div key={userType._id} className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-medium text-gray-900 truncate">{userType.name}</h3>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{userType.description}</p>
                                                    <div className="mt-2">
                                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${
                                                            userType.deliveryAllowed
                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                : 'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                            DELIVERY: {userType.deliveryAllowed ? 'ENABLED' : 'DISABLED'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2 shrink-0">
                                                    <button
                                                        onClick={() => updateUserTypeDelivery(userType._id, !userType.deliveryAllowed)}
                                                        className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60 ${
                                                            userType.deliveryAllowed
                                                                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                                        }`}
                                                        disabled={loading}
                                                    >
                                                        {userType.deliveryAllowed ? 'Disable Delivery' : 'Enable Delivery'}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUserType(userType._id)}
                                                        className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60"
                                                        disabled={loading}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Manage Content Tab */}
                    {activeTab === 'content' && (
                        <div className="space-y-8">
                            {/* About Us Content */}
                            <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage About Us</h2>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-600 ml-1">Title</label>
                                        <input
                                            type="text"
                                            value={editAbout.title}
                                            onChange={(e) => setEditAbout({ ...editAbout, title: e.target.value })}
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#fc8019] outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-600 ml-1">Description</label>
                                        <textarea
                                            rows="3"
                                            value={editAbout.description}
                                            onChange={(e) => setEditAbout({ ...editAbout, description: e.target.value })}
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#fc8019] outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-600 ml-1">Mission Statement</label>
                                        <textarea
                                            rows="3"
                                            value={editAbout.mission}
                                            onChange={(e) => setEditAbout({ ...editAbout, mission: e.target.value })}
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#ff2b85] outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <button
                                        onClick={handleSaveAbout}
                                        className="bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:scale-105 transition-all"
                                    >
                                        Save About Content
                                    </button>
                                </div>
                            </div>

                            {/* Contact Us Content */}
                            <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Contact Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-600 ml-1">Support Email</label>
                                        <input
                                            type="email"
                                            value={editContact.email}
                                            onChange={(e) => setEditContact({ ...editContact, email: e.target.value })}
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#fc8019] outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-600 ml-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={editContact.phone}
                                            onChange={(e) => setEditContact({ ...editContact, phone: e.target.value })}
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#fc8019] outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-sm font-bold text-gray-600 ml-1">Office Address</label>
                                        <textarea
                                            rows="2"
                                            value={editContact.address}
                                            onChange={(e) => setEditContact({ ...editContact, address: e.target.value })}
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#fc8019] outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-sm font-bold text-gray-600 ml-1">Google Maps Embed URL (Optional)</label>
                                        <input
                                            type="text"
                                            value={editContact.mapUrl}
                                            onChange={(e) => setEditContact({ ...editContact, mapUrl: e.target.value })}
                                            placeholder="https://www.google.com/maps/embed?..."
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#fc8019] outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveContact}
                                    className="mt-6 bg-gradient-to-r from-[#fc8019] to-[#ff2b85] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:scale-105 transition-all"
                                >
                                    Save Contact Info
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
