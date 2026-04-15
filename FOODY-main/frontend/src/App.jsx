import React, { useEffect, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import { ClipLoader } from "react-spinners";

// 🚀 Lazy Loading Components
const SignUp = lazy(() => import("./pages/SignUp"));
const SignIn = lazy(() => import("./pages/SignIn"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Home = lazy(() => import("./pages/Home"));
const CreateEditShop = lazy(() => import("./pages/CreateEditShop"));
const AddItem = lazy(() => import("./pages/AddItem"));
const Search = lazy(() => import("./pages/Search"));
const EditItem = lazy(() => import("./pages/EditItem"));
const Offers = lazy(() => import("./pages/Offers"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckOut = lazy(() => import("./pages/CheckOut"));
const OrderPlaced = lazy(() => import("./pages/OrderPlaced"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const TrackOrderPage = lazy(() => import("./pages/TrackOrderPage"));
const Shop = lazy(() => import("./pages/Shop"));
const CategoryResults = lazy(() => import("./pages/CategoryResults"));
const Help = lazy(() => import("./pages/Help"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));

import SuperAdminDashboard from "./components/SuperAdminDashboard";
import CartNotification from "./components/CartNotification";
import Footer from "./components/Footer";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import useUpdateLocation from "./hooks/useUpdateLocation";
import useGetCity from "./hooks/useGetCity";
import useGetMyshop from "./hooks/useGetMyShop";
import useGetShopByCity from "./hooks/useGetShopByCity";
import useGetItemsByCity from "./hooks/useGetItemsByCity";
import useGetMyOrders from "./hooks/useGetMyOrders";
import useGetSettings from "./hooks/useGetSettings";

import { setSocket } from "./redux/userSlice";
import { serverUrl } from "./api";

// 🌀 Loading Spinner for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff2eb] via-[#ffe7db] to-[#ffd9c9]">
    <ClipLoader color="#fc8019" size={50} />
  </div>
);

// 🔐 Protected Route Wrapper
const ProtectedRoute = ({ user, loading, children }) => {
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
};

// 👑 Super Admin Route
const SuperAdminRoute = ({ user, loading, children }) => {
  if (loading) return <PageLoader />;
  if (user?.role !== "superadmin") return <Navigate to="/signin" replace />;
  return children;
};

function App() {
  const { userData, authLoading } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const location = useLocation();

  // 🔄 Initial Data Fetching
  useGetCurrentUser();
  useUpdateLocation();
  useGetCity();
  useGetMyshop();
  useGetShopByCity();
  useGetItemsByCity();
  useGetMyOrders();
  useGetSettings();

  // 🔌 Socket Connection
  useEffect(() => {
    if (!userData?._id) {
      dispatch(setSocket(null));
      return;
    }

    // Strip /api from serverUrl if it exists, as socket.io usually listens at the root
    const socketBaseUrl = serverUrl.replace(/\/api$/, "");
    
    // In production, allow both websocket and polling. Polling first is safer for proxies.
    const socket = io(socketBaseUrl, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      path: "/socket.io/",
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      secure: socketBaseUrl.startsWith('https') || window.location.protocol === 'https:',
      rejectUnauthorized: false,
      autoConnect: true,
      timeout: 30000
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

  const noFooterPaths = ["/signin", "/signup", "/forgot-password", "/superadmin"];
  const showFooter = !noFooterPaths.includes(location.pathname);

  return (
    <>
      <CartNotification />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* 🔓 Public Routes */}
          <Route path="/signup" element={authLoading ? null : (!userData ? <SignUp /> : <Navigate to="/" />)} />
          <Route path="/signin" element={authLoading ? null : (!userData ? <SignIn /> : <Navigate to="/" />)} />
          <Route path="/forgot-password" element={authLoading ? null : (!userData ? <ForgotPassword /> : <Navigate to="/" />)} />
          <Route path="/search" element={<Search />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/offers" element={<Offers />} />

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

          <Route path="/cart" element={<CartPage />} />

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

          <Route path="/shop/:shopId" element={<Shop />} />
          <Route path="/collection/:categoryName" element={<CategoryResults />} />

          {/* 👑 Super Admin */}
          <Route path="/superadmin" element={
            <SuperAdminRoute user={userData} loading={authLoading}>
              <SuperAdminDashboard />
            </SuperAdminRoute>
          } />

          {/* ✅ Fallback: any unknown route goes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {showFooter && <Footer />}
    </>
  );
}

export default App;
