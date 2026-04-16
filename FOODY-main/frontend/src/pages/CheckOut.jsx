import React, { useEffect, useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoLocationSharp } from "react-icons/io5";
import { useDispatch, useSelector } from 'react-redux';
import { MdDeliveryDining } from "react-icons/md";
import { FaCreditCard } from "react-icons/fa";
import { FaMobileScreenButton } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { addMyOrder, clearCart, syncCartPrices } from '../redux/userSlice';
import { authAPI, itemAPI, orderAPI } from '../api';

function CheckOut() {
  const { cartItems ,totalAmount, itemsInMyCity, userData } = useSelector(state => state.user)
  const [addressInput, setAddressInput] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [orderType, setOrderType] = useState("delivery") // delivery or pickup
  const [activeTab, setActiveTab] = useState("delivery"); // delivery, payment
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [modalAddress, setModalAddress] = useState("")
  const [modalAddressError, setModalAddressError] = useState("")
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState("")
  const [copyError, setCopyError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const navigate=useNavigate()
  const dispatch = useDispatch()

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

  // Fetch shop details (assumes single-shop cart; uses first item's shop)
  const [shopDetails, setShopDetails] = useState(null)
  const [shopUpi, setShopUpi] = useState({ vpa: null, payeeName: null })
  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        const firstItemShop = cartItems?.[0]?.shop
        const shopId = typeof firstItemShop === 'string' ? firstItemShop : firstItemShop?._id
        if (!shopId) return
        const res = await itemAPI.getByShop(shopId)
        const shop = res.data?.shop
        if (shop) {
          setShopDetails(shop)
          if (shop.upiVpa) {
            setShopUpi({ vpa: shop.upiVpa, payeeName: shop.upiPayeeName || null })
          }
        }
      } catch (error) {
        console.log('fetch shop info error', error)
      }
    }
    fetchShopInfo()
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
    if (!phoneNumber.trim() || !/^[6-9]\d{9}$/.test(phoneNumber)) {
      errors.phone = "Phone number must be 10 digits and start with 6, 7, 8, or 9";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length === 0) {
      setActiveTab("payment");
    }
  };

  const handleCopyUpiLink = async () => {
    setCopyError("")
    setCopyMessage("")
    if (!upiLink) {
      setCopyError("UPI is not configured for this restaurant.")
      return
    }

    const textToCopy = upiLink

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = textToCopy
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(textarea)
        if (!ok) throw new Error('copy failed')
      }

      setCopySuccess(true)
      setCopyMessage("UPI link copied to clipboard successfully.")
      setTimeout(() => {
        setCopySuccess(false)
        setCopyMessage("")
      }, 2000)
    } catch (e) {
      setCopyError("Copy failed. Please try again or copy manually.")
    }
  };

  useEffect(() => {
    if (showAddressForm) {
      window.history.pushState({ modal: true }, "");
    }
    const handlePopState = (e) => {
      if (showAddressForm) {
        setShowAddressForm(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showAddressForm]);

  const handleSaveAddress = (newAddress) => {
    const trimmed = (newAddress || "").trim()
    if (!trimmed) {
      setModalAddressError("Please enter a delivery address")
      return
    }
    setAddressInput(trimmed);
    setFieldErrors(prev => ({ ...prev, address: null }))
    setModalAddressError("")
    setShowAddressForm(false);
    if (window.history.state?.modal) {
      window.history.back();
    }
  };

  const handleCancelAddress = () => {
    setModalAddressError("")
    setShowAddressForm(false);
    if (window.history.state?.modal) {
      window.history.back();
    }
  };

  const handlePlaceOrder = async () => {
    if ((orderType === "delivery" && !addressInput.trim()) || !phoneNumber.trim() || !/^\d{10}$/.test(phoneNumber)) {
      setActiveTab("delivery");
      validateAndProceed();
      return;
    }

    await proceedWithOrderPlacement();
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
    <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-6 relative'>
      <div className=' absolute top-[20px] left-[20px] z-[10]' onClick={() => navigate("/cart")}>
        <IoIosArrowRoundBack size={35} className='text-[#ff4d2d] cursor-pointer' />
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
                        className={`w-full border ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]`}
                        placeholder='Enter your complete delivery address'
                        value={addressInput}
                        onChange={(e) => {
                          setAddressInput(e.target.value)
                          if (fieldErrors.address) {
                            setFieldErrors(prev => ({ ...prev, address: null }))
                          }
                        }}
                      />
                      {fieldErrors.address && <p className="text-red-500 text-xs">{fieldErrors.address}</p>}
                      <button
                        onClick={() => {
                          setModalAddress(addressInput)
                          setModalAddressError("")
                          setShowAddressForm(true)
                        }}
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
                      {upiLink ? (
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="bg-white rounded-lg border border-blue-200 p-3 flex items-center justify-center">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`}
                              alt="UPI QR Code"
                              className="w-40 h-40 object-contain"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1">
                            <button
                              onClick={handleCopyUpiLink}
                              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-blue-700"
                              type="button"
                            >
                              {copySuccess ? "Link Copied!" : "Copy UPI Link"}
                            </button>
                            {copyMessage && (
                              <p className="text-xs text-green-700 mt-2 font-semibold">{copyMessage}</p>
                            )}
                            {copyError && (
                              <p className="text-xs text-red-600 mt-2 font-semibold">{copyError}</p>
                            )}
                            <div className="mt-3 bg-white border border-blue-200 rounded-lg p-2">
                              <p className="text-[10px] text-gray-500 break-all">{upiLink}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 font-semibold">{copyError || "UPI is not configured for this restaurant."}</p>
                      )}
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
                <div>
                    <div class="font-semibold text-gray-800">{shopDetails?.name || cartItems[0]?.shop?.name || 'Your Restaurant'}</div>
                    <div class="text-xs text-gray-500">
                        {shopDetails?.address ? `${shopDetails.address}, ${shopDetails.city}` : "Location"}
                    </div>
                </div>
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
            {activeTab === "payment" && (
              <button
                className="w-full mt-6 bg-[#ff4d2d] hover:bg-[#e64526] text-white py-3 rounded-xl font-semibold disabled:bg-gray-300 flex items-center justify-center"
                onClick={handlePlaceOrder}
                disabled={loading || verifyingPayment || (orderType === 'delivery' && !addressInput.trim()) || !phoneNumber.trim()}
              >
                {loading ? 'Placing Order...' : verifyingPayment ? 'Verifying Payment...' : 'Continue'}
              </button>
            )}
          </div>
        </div>

        {/* Add New Address Modal */}
        {showAddressForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Add New Address</h2>
              <textarea
                className={`w-full border ${modalAddressError ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]`}
                rows="4"
                placeholder="Enter your full address"
                value={modalAddress}
                onChange={(e) => {
                  setModalAddress(e.target.value)
                  if (modalAddressError) setModalAddressError("")
                }}
              ></textarea>
              {modalAddressError && <p className="text-red-500 text-xs mt-2">{modalAddressError}</p>}
              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={handleCancelAddress}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveAddress(modalAddress)}
                  className="bg-[#ff4d2d] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Save Address
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
