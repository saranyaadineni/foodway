import axios from "axios";

/* =======================
   ENV CONFIG
======================= */
let API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("❌ VITE_API_URL is not defined. Check .env files.");
  API_URL = "";
} else {
  API_URL = API_URL.trim();
  API_URL = API_URL.replace(/\/+$/, "");
  API_URL = API_URL.replace(/\/api$/, "");
}

/* =======================
   AXIOS INSTANCE
======================= */
const api = axios.create({
  baseURL: API_URL, // ⚠️ must NOT end with /api
  withCredentials: true,
  timeout: 30000,
});

/* =======================
   AUTH INTERCEPTOR
======================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =======================
   RESPONSE ERROR HANDLER
======================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // Treat unauthenticated /api/user/current as a normal "not logged in" state,
    // so it does not spam the console with red errors.
    const isCurrentUserCheck =
      status === 401 &&
      (url.endsWith("/api/user/current") || url.includes("/api/user/current?"));

    if (!isCurrentUserCheck) {
      if (error.response) {
        console.error(
          "❌ API ERROR:",
          error.response.status,
          error.response.data
        );
      } else {
        console.error("❌ NETWORK ERROR:", error.message);
      }
    }
    return Promise.reject(error);
  }
);

/* =======================
   UTILS
======================= */
export const serverUrl = API_URL;

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;

  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${serverUrl}${path}`;
};

/* =======================
   AUTH APIs
======================= */
export const authAPI = {
  signup: (data) => api.post("/api/auth/signup", data),
  signin: (data) => api.post("/api/auth/signin", data),
  signout: () => api.get("/api/auth/signout"),

  sendOtp: (email) =>
    api.post("/api/auth/send-otp", { email }),

  verifyOtp: (email, otp) =>
    api.post("/api/auth/verify-otp", { email, otp }),

  resetPassword: (email, newPassword) =>
    api.post("/api/auth/reset-password", {
      email,
      newPassword,
    }),

  getUserTypes: () =>
    api.get("/api/auth/user-types"),
};

/* =======================
   USER APIs
======================= */
export const userAPI = {
  getCurrentUser: () =>
    api.get("/api/user/current"),

  updateLocation: (lat, lon) =>
    api.post("/api/user/update-location", { lat, lon }),

  setActive: (isActive) =>
    api.put("/api/user/set-active", { isActive }),
};

/* =======================
   SHOP APIs
======================= */
export const shopAPI = {
  createEdit: (formData) =>
    api.post("/api/shop/create-edit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getMy: () =>
    api.get("/api/shop/get-my"),

  getAll: () =>
    api.get("/api/shop/get-all"),

  getByCity: (city) =>
    api.get(`/api/shop/get-by-city/${city}`),

  updateStatus: (isOpen) =>
    api.put("/api/shop/update-status", { isOpen }),

  getBestSelling: () =>
    api.get("/api/shop/best-selling"),

  getTopRated: () =>
    api.get("/api/shop/top-rated"),
};

/* =======================
   ITEM APIs
======================= */
export const itemAPI = {
  addItem: (formData) =>
    api.post("/api/item/add-item", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  editItem: (itemId, formData) =>
    api.post(`/api/item/edit-item/${itemId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getById: (itemId) =>
    api.get(`/api/item/get-by-id/${itemId}`),

  getByCity: (city, params) =>
    api.get(`/api/item/get-by-city/${city}`, { params }),

  getByShop: (shopId) =>
    api.get(`/api/item/get-by-shop/${shopId}`),

  deleteItem: (itemId) =>
    api.delete(`/api/item/delete/${itemId}`),

  updateStock: (itemId, stockStatus) =>
    api.put(`/api/item/update-stock/${itemId}`, {
      stockStatus,
    }),

  searchItems: (query, city) =>
    api.get("/api/item/search-items", {
      params: { query, city },
    }),

  getOffers: (city) =>
    api.get(`/api/item/offers/${city}`),
};

/* =======================
   ORDER APIs
======================= */
export const orderAPI = {
  placeOrder: (data) =>
    api.post("/api/order/place-order", data),

  verifyPayment: (data) =>
    api.post("/api/order/verify-payment", data),

  getMyOrders: () =>
    api.get("/api/order/my-orders"),

  getOrderById: (id) =>
    api.get(`/api/order/get-order-by-id/${id}`),

  getAssignments: () =>
    api.get("/api/order/get-assignments"),

  acceptOrder: (assignmentId) =>
    api.get(`/api/order/accept-order/${assignmentId}`),

  getCurrentOrders: () =>
    api.get("/api/order/get-current-orders"),

  getTodayDeliveries: () =>
    api.get("/api/order/get-today-deliveries"),

  getDeliveryCounts: () =>
    api.get("/api/order/delivery-counts"),

  getDeliveriesByDate: (year, month, day) => {
    return api.get("/api/order/get-deliveries-by-date", {
      params: day ? { year, month, day } : { year, month },
    });
  },

  sendDeliveryOtp: (orderId, shopOrderId) =>
    api.post("/api/order/send-delivery-otp", {
      orderId,
      shopOrderId,
    }),

  verifyDeliveryOtp: (orderId, shopOrderId, otp) =>
    api.post("/api/order/verify-delivery-otp", {
      orderId,
      shopOrderId,
      otp,
    }),

  updateStatus: (orderId, shopId, status) =>
    api.post(`/api/order/update-status/${orderId}/${shopId}`, {
      status,
    }),

  deleteOrder: (orderId) =>
    api.delete(`/api/order/delete-order/${orderId}`),

  cancelOrder: (orderId, reason) =>
    api.post(`/api/order/cancel-order/${orderId}`, {
      reason,
    }),

  updateSpecialInstructions: (orderId, instructions) =>
    api.post(`/api/order/update-instructions/${orderId}`, {
      instructions,
    }),
};

/* =======================
   CATEGORY APIs
======================= */
export const categoryAPI = {
  getCategories: () =>
    api.get("/api/categories"),

  createCategory: (formData) =>
    api.post("/api/categories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateCategory: (categoryId, formData) =>
    api.put(`/api/categories/${categoryId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteCategory: (categoryId) =>
    api.delete(`/api/categories/${categoryId}`),
};

/* =======================
   RATING APIs
======================= */
export const ratingAPI = {
  submitRating: (data) =>
    api.post("/api/rating/submit", data),

  getOrderRating: (orderId) =>
    api.get(`/api/rating/order/${orderId}`),

  getMyShopRatings: () =>
    api.get("/api/rating/my-shop"),

  getDeliveryRatings: () =>
    api.get("/api/rating/delivery/my"),
};

/* =======================
   SUPER ADMIN APIs
======================= */
export const superAdminAPI = {
  getDashboardStats: () =>
    api.get("/api/superadmin/dashboard-stats"),

  getPendingDeliveryBoys: () =>
    api.get("/api/superadmin/pending-delivery-boys"),

  getPendingOwners: () =>
    api.get("/api/superadmin/pending-owners"),

  updateDeliveryBoyStatus: (userId, action) =>
    api.post(`/api/superadmin/update-delivery-boy-status/${userId}`, {
      action,
    }),

  updateOwnerStatus: (userId, action) =>
    api.post(`/api/superadmin/update-owner-status/${userId}`, {
      action,
    }),

  getUsers: (params) =>
    api.get("/api/superadmin/users", { params }),

  getUserTypes: () =>
    api.get("/api/superadmin/user-types"),

  createUserType: (data) =>
    api.post("/api/superadmin/create-user-type", data),

  updateUserTypeDelivery: (userTypeId, deliveryAllowed) =>
    api.post(
      `/api/superadmin/update-user-type-delivery/${userTypeId}`,
      { deliveryAllowed }
    ),

  deleteUserType: (userTypeId) =>
    api.delete(`/api/superadmin/delete-user-type/${userTypeId}`),
};

export default api;
