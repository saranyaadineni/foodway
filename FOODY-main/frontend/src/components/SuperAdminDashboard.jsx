import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setGlobalSettings } from '../redux/userSlice';
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

    // Sync content when Redux state changes (e.g. after refresh or update)
    useEffect(() => {
        setEditAbout(aboutContent);
    }, [aboutContent]);

    useEffect(() => {
        setEditContact(contactContent);
    }, [contactContent]);

    // Dashboard data
    const [dashboardStats, setDashboardStats] = useState({
        userCount: 0,
        ownerCount: 0,
        deliveryBoyCount: 0,
        pendingOwnerCount: 0
    });

    // Delivery boy approvals data
    const [pendingDeliveryBoys, setPendingDeliveryBoys] = useState([]);
    const [pendingOwners, setPendingOwners] = useState([]);

    // User management data
    const [users, setUsers] = useState([]);
    const [searchRole, setSearchRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // User types data
    const [userTypes, setUserTypes] = useState([]);
    const [newUserType, setNewUserType] = useState({ name: '', description: '', deliveryAllowed: false });

    // Validation errors state
    const [validationErrors, setValidationErrors] = useState({});

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

    const handleSaveAbout = async () => {
        const { title, description, mission } = editAbout;

        // Title validation: 3-100 characters, no symbols at start
        if (!title || !title.trim()) {
            showMessage('Title cannot be empty', 'error');
            return;
        }
        if (!/^[A-Za-z0-9]/.test(title.trim()) || title.trim().length < 3 || title.trim().length > 100) {
            showMessage('Title must be 3-100 characters and start with a letter or number', 'error');
            return;
        }

        // Description validation: 10-500 characters
        if (!description || !description.trim()) {
            showMessage('Description cannot be empty', 'error');
            return;
        }
        if (description.trim().length < 10 || description.trim().length > 500) {
            showMessage('Description must be between 10 and 500 characters', 'error');
            return;
        }

        // Mission validation: 10-500 characters
        if (!mission || !mission.trim()) {
            showMessage('Mission Statement cannot be empty', 'error');
            return;
        }
        if (mission.trim().length < 10 || mission.trim().length > 500) {
            showMessage('Mission Statement must be between 10 and 500 characters', 'error');
            return;
        }

        try {
            setLoading(true);
            const res = await superAdminAPI.updateSettings({ aboutContent: editAbout });
            dispatch(setGlobalSettings(res.data));
            showMessage('About content updated successfully!');
        } catch (error) {
            console.error('Error updating about content:', error);
            
            // Fallback for when backend is not updated (404) or offline
            if (error.response?.status === 404) {
                dispatch(setGlobalSettings({ aboutContent: editAbout }));
                showMessage('Saved to local session (Backend update pending)');
            } else {
                showMessage('Error updating about content', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveContact = async () => {
        const { email, phone, address, mapUrl } = editContact;
        
        // Support Email validation
        if (!email || !email.trim()) {
            showMessage('Support email is required', 'error');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (email.length > 50) {
            showMessage('Email must be under 50 characters', 'error');
            return;
        }

        // Phone Number validation
        if (!phone || !phone.trim()) {
            showMessage('Phone number is required', 'error');
            return;
        }
        
        const phoneRegex = /^[0-9\s+()-]{10,20}$/;
        if (!phoneRegex.test(phone)) {
            showMessage('Please enter a valid phone number (10-20 characters)', 'error');
            return;
        }

        // Office Address validation
        if (!address || !address.trim()) {
            showMessage('Office address is required', 'error');
            return;
        }

        if (address.trim().length < 10 || address.trim().length > 200) {
            showMessage('Office address must be between 10 and 200 characters', 'error');
            return;
        }

        // Google Maps URL validation (if provided)
        if (mapUrl && mapUrl.trim()) {
            if (!mapUrl.trim().startsWith('https://www.google.com/maps/embed')) {
                showMessage('Invalid Google Maps Embed URL. It should start with "https://www.google.com/maps/embed"', 'error');
                return;
            }
        }

        try {
            setLoading(true);
            const res = await superAdminAPI.updateSettings({ contactContent: editContact });
            dispatch(setGlobalSettings(res.data));
            showMessage('Contact information updated successfully!');
        } catch (error) {
            console.error('Error updating contact information:', error);

            // Fallback for when backend is not updated (404) or offline
            if (error.response?.status === 404) {
                dispatch(setGlobalSettings({ contactContent: editContact }));
                showMessage('Saved to local session (Backend update pending)');
            } else {
                showMessage('Error updating contact information', 'error');
            }
        } finally {
            setLoading(false);
        }
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
            const statusMsg = action === 'reject' ? 'Rejected' : 'approved';
            showMessage(`Delivery boy ${statusMsg} successfully`);
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
            const statusMsg = action === 'reject' ? 'Rejected' : 'approved';
            showMessage(`Owner ${statusMsg} successfully`);
            fetchPendingOwners(); // Refresh the list
            fetchDashboardStats(); // Refresh stats
        } catch (error) {
            console.error('Error updating owner status:', error);
            showMessage('Error updating owner status', 'error');
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
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'usertypes') {
            fetchUserTypes();
        }
    }, [activeTab, fetchPendingDeliveryBoys, fetchPendingOwners, fetchUsers, fetchUserTypes]);

    // Debounced search for users
    useEffect(() => {
        if (activeTab === 'users') {
            const term = searchTerm.trim();
            if (term) {
                const nameRegex = /^[A-Za-z\s]+$/;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^[0-9+()-\s]{3,20}$/; // Basic phone validation
                
                if (!nameRegex.test(term) && !emailRegex.test(term) && !phoneRegex.test(term)) {
                    setError('Please enter a valid Name, Email, or Phone number');
                    setUsers([]); // Clear list on invalid search
                    return;
                }
            }
            
            setError(''); // Clear error if valid or empty
            const debounceTimer = setTimeout(() => {
                fetchUsers();
            }, 500);
            return () => clearTimeout(debounceTimer);
        }
    }, [searchRole, searchTerm, activeTab, fetchUsers]);

    // Create user type
    const createUserType = async () => {
        const normalizedName = newUserType.name.trim();
        const normalizedDesc = newUserType.description.trim();
        const alphaRegex = /^[A-Za-z\s]+$/;

        // Validation
        if (!normalizedName) {
            showMessage('User type name is required', 'error');
            return;
        }
        if (!alphaRegex.test(normalizedName) || normalizedName.length < 3 || normalizedName.length > 50) {
            showMessage('User Type Name must be 3–50 letters only', 'error');
            return;
        }

        if (!normalizedDesc) {
            showMessage('Description is required', 'error');
            return;
        }
        if (!alphaRegex.test(normalizedDesc) || normalizedDesc.length < 3 || normalizedDesc.length > 50) {
            showMessage('Description must be 3–50 letters only', 'error');
            return;
        }

        // Prevent client-side duplicates (case-insensitive)
        const checkName = normalizedName.toLowerCase();
        const isDuplicate = userTypes.some(ut => (ut.name || '').trim().toLowerCase() === checkName);
        if (isDuplicate) {
            showMessage('User type already exists', 'error');
            return;
        }

        try {
            setLoading(true);
            await superAdminAPI.createUserType({
                name: normalizedName,
                description: normalizedDesc,
                deliveryAllowed: newUserType.deliveryAllowed
            });
            showMessage('User type created successfully');
            setNewUserType({ name: '', description: '', deliveryAllowed: false });
            setValidationErrors({});
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
                                    { label: 'Pending Owners', value: dashboardStats.pendingOwnerCount, color: 'text-orange-600', bg: 'bg-orange-50' }
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
                                        placeholder="Search by name, email, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`border ${error === 'Please enter a valid Name, Email, or Phone number' ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl px-3 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
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
                                                            {user.role === 'user' ? 'User' : 
                                                             user.role === 'owner' ? 'Owner' : 
                                                             user.role === 'deliveryBoy' ? 'Delivery Boy' : 
                                                             user.role}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-gray-500 ml-1">USER TYPE NAME</label>
                                        <input
                                            type="text"
                                            placeholder="User Type Name (e.g. Students)"
                                            value={newUserType.name}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewUserType({ ...newUserType, name: val });
                                                
                                                // Real-time validation
                                                let errors = { ...validationErrors };
                                                const alphaRegex = /^[A-Za-z\s]+$/;
                                                if (val && (!alphaRegex.test(val) || val.trim().length < 3 || val.trim().length > 50)) {
                                                    errors.ut_name = "Input must be 3–50 letters only";
                                                } else {
                                                    delete errors.ut_name;
                                                }
                                                setValidationErrors(errors);
                                            }}
                                            className={`border ${validationErrors.ut_name ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
                                        />
                                        {validationErrors.ut_name && (
                                            <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase tracking-wider">{validationErrors.ut_name}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-gray-500 ml-1">DESCRIPTION</label>
                                        <input
                                            type="text"
                                            placeholder="Description (e.g. University Students)"
                                            value={newUserType.description}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setNewUserType({ ...newUserType, description: val });
                                                
                                                // Real-time validation
                                                let errors = { ...validationErrors };
                                                const alphaRegex = /^[A-Za-z\s]+$/;
                                                if (val && (!alphaRegex.test(val) || val.trim().length < 3 || val.trim().length > 50)) {
                                                    errors.ut_desc = "Input must be 3–50 letters only";
                                                } else {
                                                    delete errors.ut_desc;
                                                }
                                                setValidationErrors(errors);
                                            }}
                                            className={`border ${validationErrors.ut_desc ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'} rounded-xl px-4 py-2.5 bg-white/80 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc8019] hover:border-[#ff4d2d]/60 transition-all`}
                                        />
                                        {validationErrors.ut_desc && (
                                            <p className="text-red-500 text-[10px] font-bold ml-1 mt-1 uppercase tracking-wider">{validationErrors.ut_desc}</p>
                                        )}
                                    </div>
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
                                    disabled={loading || !!validationErrors.ut_name || !!validationErrors.ut_desc || !newUserType.name.trim() || !newUserType.description.trim()}
                                    className="mt-6 bg-gradient-to-r from-[#fc8019] to-[#ff2b85] hover:from-[#e67315] hover:to-[#e62579] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
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
                                            maxLength={50}
                                            onChange={(e) => setEditContact(prev => ({ ...prev, email: e.target.value }))}
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#fc8019] outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-600 ml-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={editContact.phone}
                                            maxLength={20}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9\s+()-]/g, '');
                                                setEditContact(prev => ({ ...prev, phone: val }));
                                            }}
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#fc8019] outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-sm font-bold text-gray-600 ml-1">Office Address</label>
                                        <textarea
                                            rows="2"
                                            value={editContact.address}
                                            maxLength={200}
                                            onChange={(e) => setEditContact(prev => ({ ...prev, address: e.target.value }))}
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#fc8019] outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-sm font-bold text-gray-600 ml-1">Google Maps Embed URL (Optional)</label>
                                        <input
                                            type="text"
                                            value={editContact.mapUrl}
                                            maxLength={500}
                                            onChange={(e) => setEditContact(prev => ({ ...prev, mapUrl: e.target.value }))}
                                            placeholder="https://www.google.com/maps/embed?..."
                                            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white/80 focus:ring-2 focus:ring-[#fc8019] outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-gray-400 ml-1 font-medium italic">* Paste the 'src' attribute from Google Maps 'Embed a map' iframe</p>
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
