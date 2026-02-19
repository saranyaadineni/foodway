import { createSlice } from "@reduxjs/toolkit";

/* ======================
   LOCAL STORAGE HELPERS
====================== */
const loadJSON = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`LocalStorage save failed for ${key}`, e);
  }
};

/* ======================
   INITIAL STATE
====================== */
const initialState = {
  userData: null,
  authLoading: true,

  currentCity: null,
  currentState: null,
  currentAddress: null,

  shopInMyCity: [],
  itemsInMyCity: [],

  cartItems: loadJSON("cartItems", []),
  totalAmount: Number(localStorage.getItem("totalAmount")) || 0,

  myOrders: [],
  searchItems: [],

  socket: null,

  cartClearedForNewShop: false,
  newOrdersCount: 0,
};

/* ======================
   SLICE
====================== */
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    /* ---------- AUTH ---------- */
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setAuthLoading: (state, action) => {
      state.authLoading = action.payload;
    },

    /* ---------- LOCATION ---------- */
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload;
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload;
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload;
    },

    /* ---------- SHOPS & ITEMS ---------- */
    setShopsInMyCity: (state, action) => {
      state.shopInMyCity = Array.isArray(action.payload)
        ? action.payload
        : [];
    },
    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = Array.isArray(action.payload)
        ? action.payload
        : [];
    },
    setSearchItems: (state, action) => {
      state.searchItems = Array.isArray(action.payload)
        ? action.payload
        : [];
    },

    /* ---------- SOCKET ---------- */
    setSocket: (state, action) => {
      state.socket = action.payload;
    },

    /* ---------- CART ---------- */
    addToCart: (state, action) => {
      const item = action.payload;

      // Clear cart if item belongs to another shop
      if (
        state.cartItems.length > 0 &&
        state.cartItems[0].shop !== item.shop
      ) {
        state.cartItems = [item];
        state.cartClearedForNewShop = true;
      } else {
        const existing = state.cartItems.find(
          (i) => i.id === item.id
        );

        if (existing) {
          existing.quantity += item.quantity;
        } else {
          state.cartItems.push(item);
        }

        state.cartClearedForNewShop = false;
      }

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      saveJSON("cartItems", state.cartItems);
      localStorage.setItem("totalAmount", state.totalAmount);
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find((i) => i.id === id);
      if (item) item.quantity = quantity;

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      saveJSON("cartItems", state.cartItems);
      localStorage.setItem("totalAmount", state.totalAmount);
    },

    removeCartItem: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (i) => i.id !== action.payload
      );

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      saveJSON("cartItems", state.cartItems);
      localStorage.setItem("totalAmount", state.totalAmount);
    },

    clearCart: (state) => {
      state.cartItems = [];
      state.totalAmount = 0;
      state.cartClearedForNewShop = false;

      localStorage.removeItem("cartItems");
      localStorage.removeItem("totalAmount");
    },

    clearCartNotification: (state) => {
      state.cartClearedForNewShop = false;
    },

    syncCartPrices: (state, action) => {
      const latestItems = action.payload || [];

      state.cartItems = state.cartItems.map((cartItem) => {
        const latest = latestItems.find(
          (i) => i._id === cartItem.id
        );
        return latest
          ? { ...cartItem, price: latest.price }
          : cartItem;
      });

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      saveJSON("cartItems", state.cartItems);
      localStorage.setItem("totalAmount", state.totalAmount);
    },

    /* ---------- ORDERS ---------- */
    setMyOrders: (state, action) => {
      state.myOrders = Array.isArray(action.payload)
        ? action.payload
        : [];
    },

    addMyOrder: (state, action) => {
      state.myOrders.unshift(action.payload);
    },

    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.myOrders.find(
        (o) => o._id === orderId
      );
      if (order) order.status = status;
    },

    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, shopId, status, deliveryOtp, otpExpires } = action.payload;
      const order = state.myOrders.find((o) => o._id === orderId);
      if (order) {
        // Update main status
        order.status = status;
        
        // Update shop-specific status if it exists
        if (order.shopOrders) {
          const shopOrder = order.shopOrders.find(so => 
            so.shop?._id === shopId || so.shop === shopId
          );
          if (shopOrder) {
            shopOrder.status = status;
          }
        }

        // Update delivery OTP if provided
        if (deliveryOtp) {
          order.deliveryOtp = deliveryOtp;
          order.otpExpires = otpExpires;
        }
      }
    },

    incrementNewOrdersCount: (state) => {
      state.newOrdersCount += 1;
    },
    resetNewOrdersCount: (state) => {
      state.newOrdersCount = 0;
    },

    /* ---------- LOGOUT ---------- */
    logout: (state) => {
      Object.assign(state, {
        ...initialState,
        authLoading: false,
      });

      try {
        localStorage.clear();
      } catch (e) {
        console.error("LocalStorage clear failed", e);
      }
    },
  },
});

/* ======================
   EXPORTS
====================== */
export const {
  setUserData,
  setAuthLoading,
  setCurrentCity,
  setCurrentState,
  setCurrentAddress,
  setShopsInMyCity,
  setItemsInMyCity,
  setSearchItems,
  setSocket,
  addToCart,
  updateQuantity,
  removeCartItem,
  clearCart,
  clearCartNotification,
  syncCartPrices,
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  updateRealtimeOrderStatus,
  incrementNewOrdersCount,
  resetNewOrdersCount,
  logout,
} = userSlice.actions;

export default userSlice.reducer;
