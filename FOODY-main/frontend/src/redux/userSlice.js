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

  aboutContent: loadJSON("aboutContent", {
    title: "About FoodWay",
    description: "Delivering happiness to your doorstep. Order from the best restaurants and enjoy fresh, delicious food in minutes.",
    mission: "Our mission is to elevate the quality of life for the urban consumer by offering unparalleled convenience. Convenience is what makes us tick. It's what makes us get out of bed and say, \"Let's do this.\"",
    image: ""
  }),
  contactContent: loadJSON("contactContent", {
    email: "support@foodway.com",
    phone: "+1 (555) 123-4567",
    address: "123 Foodie Street, Gourmet City, GC 54321",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.422198353894!2d-73.985428!3d40.748817!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a147!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1614123456789!5m2!1sen!2sus"
  }),
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

    removeFromCart: (state, action) => {
      const item = action.payload;
      const existing = state.cartItems.find((i) => i.id === item.id);

      if (existing) {
        if (existing.quantity > 1) {
          existing.quantity -= 1;
        } else {
          state.cartItems = state.cartItems.filter(
            (i) => i.id !== item.id
          );
        }
      }

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
      const { orderId, status, shopId } = action.payload;
      const order = state.myOrders.find((o) => o._id === orderId);
      if (order) {
        order.status = status;
        
        // Update shop-specific status if shopId is provided
        if (shopId && order.shopOrders) {
          const shopOrder = order.shopOrders.find(so => {
            const currentShopId = so.shop?._id || so.shop;
            return String(currentShopId) === String(shopId);
          });
          if (shopOrder) shopOrder.status = status;
        }
      }
    },

    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, shopId, status, deliveryOtp, otpExpires } = action.payload;
      const order = state.myOrders.find((o) => o._id === orderId);
      if (order) {
        // Update main status
        order.status = status;
        
        // Update shop-specific status and OTP if it exists
        if (order.shopOrders) {
          const shopOrder = order.shopOrders.find(so => {
            const currentShopId = so.shop?._id || so.shop;
            return String(currentShopId) === String(shopId);
          });
          
          if (shopOrder) {
            shopOrder.status = status;
            if (deliveryOtp) {
              shopOrder.deliveryOtp = deliveryOtp;
              shopOrder.otpExpires = otpExpires;
            }
          }
        }

        // Also update top-level for backward compatibility or if needed
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

    /* ---------- CONTENT MANAGEMENT ---------- */
    updateAboutContent: (state, action) => {
      state.aboutContent = { ...state.aboutContent, ...action.payload };
      saveJSON("aboutContent", state.aboutContent);
    },
    updateContactContent: (state, action) => {
      state.contactContent = { ...state.contactContent, ...action.payload };
      saveJSON("contactContent", state.contactContent);
    },

    setGlobalSettings: (state, action) => {
      if (action.payload.aboutContent) {
        state.aboutContent = action.payload.aboutContent;
        saveJSON("aboutContent", state.aboutContent);
      }
      if (action.payload.contactContent) {
        state.contactContent = action.payload.contactContent;
        saveJSON("contactContent", state.contactContent);
      }
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
  removeFromCart,
  clearCart,
  clearCartNotification,
  syncCartPrices,
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  updateRealtimeOrderStatus,
  incrementNewOrdersCount,
  resetNewOrdersCount,
  updateAboutContent,
  updateContactContent,
  setGlobalSettings,
  logout,
} = userSlice.actions;

export default userSlice.reducer;
