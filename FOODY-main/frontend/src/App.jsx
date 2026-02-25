import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import CreateEditShop from "./pages/CreateEditShop";
import AddItem from "./pages/AddItem";
import Search from "./pages/Search";
import EditItem from "./pages/EditItem";
import CartPage from "./pages/CartPage";
import CheckOut from "./pages/CheckOut";
import OrderPlaced from "./pages/OrderPlaced";
import MyOrders from "./pages/MyOrders";
import TrackOrderPage from "./pages/TrackOrderPage";
import Shop from "./pages/Shop";
import Help from "./pages/Help";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import CartNotification from "./components/CartNotification";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import useUpdateLocation from "./hooks/useUpdateLocation";
import useGetCity from "./hooks/useGetCity";
import useGetMyshop from "./hooks/useGetMyShop";
import useGetShopByCity from "./hooks/useGetShopByCity";
import useGetItemsByCity from "./hooks/useGetItemsByCity";
import useGetMyOrders from "./hooks/useGetMyOrders";



import { setSocket } from "./redux/userSlice";
import { serverUrl } from "./api";


import { ClipLoader } from "react-spinners";

// 🔐 Protected Route Wrapper
const ProtectedRoute = ({ user, loading, children }) => {
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff2eb] via-[#ffe7db] to-[#ffd9c9]">
      <ClipLoader color="#fc8019" size={50} />
    </div>
  );
  if (!user) return <Navigate to="/signin" replace />;
  return children;
};

// 👑 Super Admin Route
const SuperAdminRoute = ({ user, loading, children }) => {
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff2eb] via-[#ffe7db] to-[#ffd9c9]">
      <ClipLoader color="#fc8019" size={50} />
    </div>
  );
  if (user?.role !== "superadmin") return <Navigate to="/signin" replace />;
  return children;
};

function App() {
  const { userData, authLoading } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // 🔄 Initial Data Fetching
  useGetCurrentUser();
  useUpdateLocation();
  useGetCity();
  useGetMyshop();
  useGetShopByCity();
  useGetItemsByCity();
  useGetMyOrders();

  // 🔌 Socket Connection
  useEffect(() => {
    if (!userData?._id) {
      dispatch(setSocket(null));
      return;
    }

    // Strip /api from serverUrl if it exists, as socket.io usually listens at the root
    const socketBaseUrl = serverUrl.replace(/\/api$/, "");
    
    const isProd = window.location.hostname !== 'localhost';
    
    // In production, force polling to avoid WebSocket connection failed errors
    // and noisy console logs. Polling works everywhere.
    const socket = io(socketBaseUrl, {
      withCredentials: true,
      transports: isProd ? ["polling"] : ["polling", "websocket"],
      path: "/socket.io/",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      secure: socketBaseUrl.startsWith('https'),
      rejectUnauthorized: false,
      autoConnect: true
    });

    dispatch(setSocket(socket));

    socket.on("connect", () => {
      socket.emit("identity", { userId: userData._id });
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket error:", error);
    });

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
      dispatch(setSocket(null));
    };
  }, [userData?._id, dispatch]);

  return (
    <>
      <CartNotification />

      <Routes>
        {/* 🔓 Public Routes */}
        <Route path="/signup" element={authLoading ? null : (!userData ? <SignUp /> : <Navigate to="/" />)} />
        <Route path="/signin" element={authLoading ? null : (!userData ? <SignIn /> : <Navigate to="/" />)} />
        <Route path="/forgot-password" element={authLoading ? null : (!userData ? <ForgotPassword /> : <Navigate to="/" />)} />
        <Route path="/search" element={<Search />} />
        <Route path="/help" element={<Help />} />

        {/* 🔐 Protected Routes */}
        <Route path="/" element={<Home />} />

        <Route path="/create-edit-shop" element={
          <ProtectedRoute user={userData} loading={authLoading}>
            <CreateEditShop />
          </ProtectedRoute>
        } />

        <Route path="/add-item" element={
          <ProtectedRoute user={userData} loading={authLoading}>
            <AddItem />
          </ProtectedRoute>
        } />

        <Route path="/edit-item/:itemId" element={
          <ProtectedRoute user={userData} loading={authLoading}>
            <EditItem />
          </ProtectedRoute>
        } />

        <Route path="/cart" element={
          <ProtectedRoute user={userData} loading={authLoading}>
            <CartPage />
          </ProtectedRoute>
        } />

        <Route path="/checkout" element={
          <ProtectedRoute user={userData} loading={authLoading}>
            <CheckOut />
          </ProtectedRoute>
        } />

        <Route path="/order-placed" element={
          <ProtectedRoute user={userData} loading={authLoading}>
            <OrderPlaced />
          </ProtectedRoute>
        } />

        <Route path="/my-orders" element={
          <ProtectedRoute user={userData} loading={authLoading}>
            <MyOrders />
          </ProtectedRoute>
        } />

        <Route path="/track-order/:orderId" element={
          <ProtectedRoute user={userData} loading={authLoading}>
            <TrackOrderPage />
          </ProtectedRoute>
        } />

        <Route path="/shop/:shopId" element={
          <ProtectedRoute user={userData} loading={authLoading}>
            <Shop />
          </ProtectedRoute>
        } />

        {/* 👑 Super Admin */}
        <Route path="/superadmin" element={
          <SuperAdminRoute user={userData} loading={authLoading}>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        } />

        {/* ✅ Fallback: any unknown route goes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
