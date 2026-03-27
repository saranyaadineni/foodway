import React, { useEffect, useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoLocationSharp } from "react-icons/io5";
import { useDispatch, useSelector } from 'react-redux';
import { MdDeliveryDining } from "react-icons/md";
import { FaCreditCard } from "react-icons/fa";
import { FaMobileScreenButton } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { addMyOrder, clearCart, syncCartPrices } from '../redux/userSlice';
import { itemAPI, orderAPI } from '../api';

function CheckOut() {
  const { cartItems ,totalAmount, itemsInMyCity, userData } = useSelector(state => state.user)
  const [addressInput, setAddressInput] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [orderType, setOrderType] = useState("delivery") // delivery or pickup
  const [activeTab, setActiveTab] = useState("delivery"); // delivery, payment
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpResent, setOtpResent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const navigate=useNavigate()
  const dispatch = useDispatch()

  // OTP Timer Logic
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Redirect to home if cart is empty (e.g., after successful order or manual clear)
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/')
    }
  }, [cartItems, navigate])

  useEffect(() => {
    if (itemsInMyCity && itemsInMyCity.length) {
      dispatch(syncCartPrices(itemsInMyCity))
    }
  }, [itemsInMyCity, dispatch])
  // Fee breakdown per your specification
  const round2 = (n) => Math.round(n * 100) / 100
  const itemsTotal = round2(totalAmount)
  const deliveryFee = orderType === "delivery" ? round2(itemsTotal * 0.20) : 0
  const platformFee = round2(itemsTotal * 0.08)
  const tax = round2(itemsTotal * 0.02)
  const grandTotal = round2(itemsTotal + deliveryFee + platformFee + tax)

  // Fetch shop UPI details (assumes single-shop cart; uses first item's shop)
  const [shopUpi, setShopUpi] = useState({ vpa: null, payeeName: null })
  useEffect(() => {
    const fetchShopUpi = async () => {
      try {
        const firstItemShop = cartItems?.[0]?.shop
        const shopId = typeof firstItemShop === 'string' ? firstItemShop : firstItemShop?._id
        if (!shopId) return
        const res = await itemAPI.getByShop(shopId)
        const shop = res.data?.shop
        if (shop?.upiVpa) {
          setShopUpi({ vpa: shop.upiVpa, payeeName: shop.upiPayeeName || null })
        }
      } catch (error) {
        console.log('fetch shop UPI error', error)
      }
    }
    fetchShopUpi()
  }, [cartItems])

  // UPI deep link with auto amount for online payments (from shop settings)
  const upiAmount = grandTotal.toFixed(2)
  const upiPa = shopUpi.vpa || null
  const upiPn = shopUpi.payeeName || 'FoodWay'
  const upiNote = `Order`
  const upiLink = upiPa ? `upi://pay?pa=${encodeURIComponent(upiPa)}&pn=${encodeURIComponent(upiPn)}&tn=${encodeURIComponent(upiNote)}&am=${upiAmount}&cu=INR` : null
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent)

  const validateAndProceed = () => {
    const errors = {};
    if (orderType === "delivery" && !addressInput.trim()) {
      errors.address = "Please enter a delivery address";
    }
    if (!phoneNumber.trim() || !/^\d{10}$/.test(phoneNumber)) {
      errors.phone = "Please enter a valid 10-digit mobile number";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length === 0) {
      setActiveTab("payment");
    }
  };

  const handleCopyUpiLink = () => {
    if (upiLink && navigator.clipboard) {
      navigator.clipboard.writeText(upiLink).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); // Hide message after 2 seconds
      });
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    try {
      await authAPI.sendOtp(userData.email);
      setOtpResent(true);
      setOtpTimer(60); // 60 seconds cooldown
      setTimeout(() => setOtpResent(false), 3000);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to resend OTP");
    }
  };

  const handleVerifyAndPlaceOrder = async () => {
    if (!otpInput || otpInput.length !== 4) {
      alert("Please enter a valid 4-digit OTP");
      return;
    }

    setVerifyingOtp(true);
    try {
      await authAPI.verifyOtp(userData.email, otpInput);
      setShowOtpModal(false);
      // Proceed with actual order placement
      await proceedWithOrderPlacement();
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP, please try again");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSaveAddress = (newAddress) => {
    setAddressInput(newAddress);
    setShowAddressForm(false);
  };

  const handlePlaceOrder = async () => {
    if ((orderType === "delivery" && !addressInput.trim()) || !phoneNumber.trim() || !/^\d{10}$/.test(phoneNumber)) {
      setActiveTab("delivery");
      validateAndProceed();
      return;
    }

    setLoading(true);
    try {
      // Trigger OTP first
      await authAPI.sendOtp(userData.email);
      setShowOtpModal(true);
      setOtpTimer(60);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const proceedWithOrderPlacement = async () => {
    setLoading(true);
    try {
      const result = await orderAPI.placeOrder({
        paymentMethod,
        orderType,
        deliveryAddress: orderType === "delivery" ? { text: addressInput.trim() } : null,
        phoneNumber: phoneNumber.trim(),
        totalAmount: grandTotal,
        cartItems
      });

      dispatch(addMyOrder(result.data));
      dispatch(clearCart());

      if (paymentMethod === "cod") {
        navigate("/order-placed");
      } else {
        const orderId = result.data.orderId;
        const razorOrder = result.data.razorOrder;
        if (orderId && razorOrder) {
          openRazorpayWindow(orderId, razorOrder);
        } else {
          navigate("/order-placed");
        }
      }
    } catch (error) {
      console.error("Place order error:", error);
      if (error.response) {
        alert(`Order failed: ${error.response.data.message || 'Unknown error'}`);
      } else {
        alert('Order failed: Network error');
      }
    } finally {
      setLoading(false);
    }
  }

const openRazorpayWindow=(orderId,razorOrder)=>{
  const razorKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!razorKey) {
    alert('Online payment is not configured. Please use Cash on Delivery for now.');
    return;
  }
  if (typeof window.Razorpay === 'undefined') {
    alert('Payment service is currently unavailable. Please try again later or use Cash on Delivery.');
    return;
  }

  const options={
 key:razorKey,
 amount:razorOrder.amount,
 currency:'INR',
 name:"FoodWay",
 description:"Food Delivery Website",
 order_id:razorOrder.id,
 prefill: {
   name: userData?.fullName || '',
   email: userData?.email || '',
   contact: phoneNumber || ''
 },
 handler:async function (response) {
  setVerifyingPayment(true);
  try {
    await orderAPI.verifyPayment({
      razorpay_payment_id:response.razorpay_payment_id,
      orderId
    });
    navigate("/order-placed");
  } catch (error) {
    console.log(error);
    alert('Payment verification failed. Please contact support.');
  } finally {
    setVerifyingPayment(false);
  }
 },
 modal: {
   ondismiss: function() {
     alert('Payment cancelled. You can try again or use Cash on Delivery.');
   }
 }
  }

  try {
    const rzp=new window.Razorpay(options)
    rzp.open()
  } catch (error) {
    console.error('Razorpay initialization error:', error);
    alert('Payment service error. Please try Cash on Delivery or refresh the page.');
  }
}



  return (
    <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-6'>
      <div className=' absolute top-[20px] left-[20px] z-[10]' onClick={() => navigate("/")}>
        <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
      </div>
      <div className='w-full max-w-[900px] bg-white rounded-2xl shadow-xl p-6 space-y-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Side: Tabs and Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Tabs Navigation */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("delivery")}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === "delivery"
                    ? "border-b-2 border-[#ff4d2d] text-[#ff4d2d]"
                    : "text-gray-500"
                }`}
              >
                1. Delivery
              </button>
              <button
                onClick={() => setActiveTab("payment")}
                disabled={(orderType === 'delivery' && !addressInput.trim()) || !phoneNumber.trim()}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === "payment"
                    ? "border-b-2 border-[#ff4d2d] text-[#ff4d2d]"
                    : "text-gray-500"
                } disabled:text-gray-300 disabled:cursor-not-allowed`}
              >
                2. Payment
              </button>
            </div>

            {/* Delivery Tab Content */}
            {activeTab === "delivery" && (
              <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
                <section>
                  <h2 className='text-lg font-semibold mb-3 text-gray-800'>Order Type</h2>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className={`flex items-center gap-3 rounded-xl border p-4 text-left transition cursor-pointer ${orderType === "delivery" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`}
                         onClick={() => setOrderType("delivery")}>
                      <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                        <MdDeliveryDining className='text-blue-600 text-xl' />
                      </span>
                      <div>
                        <p className='font-medium text-gray-800'>Delivery</p>
                        <p className='text-xs text-gray-500'>Get food delivered to your location</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 rounded-xl border p-4 text-left transition cursor-pointer ${orderType === "pickup" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`}
                         onClick={() => setOrderType("pickup")}>
                      <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                        <IoLocationSharp className='text-green-600 text-xl' />
                      </span>
                      <div>
                        <p className='font-medium text-gray-800'>Pickup</p>
                        <p className='text-xs text-gray-500'>Collect your order from restaurant</p>
                      </div>
                    </div>
                  </div>
                </section>

                {orderType === "delivery" && (
                  <section>
                    <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'><IoLocationSharp className='text-[#ff4d2d]' /> Delivery Location</h2>
                    <div className='space-y-3'>
                      <input
                        type="text"
                        className='w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]'
                        placeholder='Enter your complete delivery address'
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                      />
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="text-sm text-[#ff4d2d] font-semibold hover:underline"
                      >
                        + Add New Address
                      </button>
                    </div>
                  </section>
                )}

                <section>
                  <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'>
                    <FaMobileScreenButton className='text-[#ff4d2d]' /> Phone Number *
                  </h2>
                  <div className='space-y-3'>
                    <input
                      type="tel"
                      className={`w-full border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]`}
                      placeholder='Enter your 10-digit phone number'
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhoneNumber(value);
                        if (fieldErrors.phone) {
                          setFieldErrors(prev => ({ ...prev, phone: null }));
                        }
                      }}
                      maxLength="10"
                    />
                    {fieldErrors.phone && <p className="text-red-500 text-xs">{fieldErrors.phone}</p>}
                  </div>
                </section>

                <button
                  onClick={validateAndProceed}
                  className="w-full bg-[#ff4d2d] text-white py-2.5 rounded-lg font-semibold mt-4"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Payment Tab Content */}
            {activeTab === "payment" && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <section>
                  <h2 className='text-lg font-semibold mb-3 text-gray-800'>Payment Method</h2>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className={`flex items-center gap-3 rounded-xl border p-4 text-left transition cursor-pointer ${paymentMethod === "cod" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`}
                         onClick={() => setPaymentMethod("cod")}>
                      <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                        <MdDeliveryDining className='text-green-600 text-xl' />
                      </span>
                      <div>
                        <p className='font-medium text-gray-800'>Cash On Delivery</p>
                        <p className='text-xs text-gray-500'>Pay when your food arrives</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 rounded-xl border p-4 text-left transition cursor-pointer ${paymentMethod === "online" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`}
                         onClick={() => setPaymentMethod("online")}>
                      <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
                        <FaMobileScreenButton className='text-purple-700 text-lg' />
                      </span>
                      <div>
                        <p className='font-medium text-gray-800'>UPI / Credit / Debit Card</p>
                        <p className='text-xs text-gray-500'>Pay Securely Online</p>
                      </div>
                    </div>
                  </div>
                  {paymentMethod === "online" && (
                    <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                      <p className="text-sm font-semibold text-blue-800">Pay via UPI</p>
                      <p className="text-xs text-blue-600 mb-3">You can use any UPI app to pay.</p>
                      <button
                        onClick={handleCopyUpiLink}
                        disabled={!upiLink}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold text-sm disabled:bg-gray-400"
                      >
                        {copySuccess ? "Link Copied!" : "Copy UPI Link"}
                      </button>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>

          {/* Right Side: Order Summary */}
          <div className="md:col-span-1">
            <section>
              <h2 class="text-lg font-semibold mb-3 text-gray-800">Order Summary</h2>
              <div class="rounded-xl border bg-gray-50 p-4 space-y-2">
                <div class="font-semibold text-gray-800">{cartItems[0]?.shop?.name || 'Your Restaurant'}</div>
                {cartItems.map((item, index) => (
                  <div key={index} class="flex justify-between text-sm text-gray-700">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <hr class="border-gray-200 my-2" />
                <div class="flex justify-between font-medium text-gray-800">
                  <span>Items Total</span>
                  <span>{itemsTotal}</span>
                </div>
                {orderType === "delivery" && (
                  <div class="flex justify-between text-gray-700">
                    <span>Delivery Partner Fee</span>
                    <span>{deliveryFee}</span>
                  </div>
                )}
                <div class="flex justify-between text-gray-700">
                  <span>Platform Fee</span>
                  <span>{platformFee}</span>
                </div>
                <div class="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span>{tax}</span>
                </div>
                <div class="flex justify-between text-lg font-bold text-[#ff4d2d] pt-2">
                  <span>Total</span>
                  <span>{grandTotal}</span>
                </div>
              </div>
            </section>
            <button
              className="w-full mt-6 bg-[#ff4d2d] hover:bg-[#e64526] text-white py-3 rounded-xl font-semibold disabled:bg-gray-300 flex items-center justify-center"
              onClick={handlePlaceOrder}
              disabled={loading || verifyingPayment || (orderType === 'delivery' && !addressInput.trim()) || !phoneNumber.trim()}
            >
              {loading ? 'Placing Order...' : verifyingPayment ? 'Verifying Payment...' : 'Continue'}
            </button>
          </div>
        </div>

        {/* Add New Address Modal */}
        {showAddressForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Add New Address</h2>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]"
                rows="4"
                placeholder="Enter your full address"
                onChange={(e) => setAddressInput(e.target.value)}
              ></textarea>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveAddress(addressInput)}
                  className="bg-[#ff4d2d] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Save Address
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Verification Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-orange-100 text-[#ff4d2d] rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaMobileScreenButton size={30} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">OTP Verification</h2>
                <p className="text-gray-500 text-sm mt-2">
                  We've sent a 4-digit verification code to your registered mobile number
                </p>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  maxLength="4"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-digit OTP"
                  className="w-full text-center text-2xl font-bold tracking-[0.5em] border-b-2 border-gray-300 focus:border-[#ff4d2d] focus:outline-none py-2 transition-colors"
                />
              </div>

              <div className="mb-8">
                {otpResent ? (
                  <p className="text-green-600 text-sm font-semibold flex items-center justify-center gap-1">
                    ✓ OTP resent successfully
                  </p>
                ) : otpTimer > 0 ? (
                  <p className="text-gray-400 text-xs">
                    Resend OTP in <span className="font-bold">{otpTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-[#ff4d2d] text-sm font-bold hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleVerifyAndPlaceOrder}
                  disabled={otpInput.length !== 4 || verifyingOtp}
                  className="w-full bg-[#ff4d2d] hover:bg-[#e64526] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-100 disabled:bg-gray-300 disabled:shadow-none transition-all"
                >
                  {verifyingOtp ? "Verifying..." : "Verify & Complete Order"}
                </button>
                <button
                  onClick={() => setShowOtpModal(false)}
                  className="text-gray-400 text-sm font-semibold hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default CheckOut
