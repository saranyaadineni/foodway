import React, { useEffect, useState, useCallback } from 'react'
import Nav from './Nav'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { orderAPI, userAPI, itemAPI, ratingAPI } from '../api'
import { ClipLoader } from 'react-spinners'
import { FaStar, FaClipboardList, FaTruck, FaRegSmile, FaCalendarAlt, FaListAlt, FaMoneyBillWave, FaTimes, FaMapMarkerAlt } from 'react-icons/fa'

function DeliveryBoy() {
  const { userData, socket } = useSelector(state => state.user)
  const dispatch = useDispatch()

  const [currentOrders, setCurrentOrders] = useState([])
  const [availableAssignments, setAvailableAssignments] = useState([])
  const [rejectedAssignments, setRejectedAssignments] = useState(new Set())
  const [otpValues, setOtpValues] = useState({})
  const [showOtpFor, setShowOtpFor] = useState({})
  const [messages, setMessages] = useState({})
  const [todayDeliveries, setTodayDeliveries] = useState({ totalDeliveries: 0, deliveries: [] })
  const [deliveryCounts, setDeliveryCounts] = useState({ total: 0, month: 0, today: 0, todayEarnings: 0 })
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterDay, setFilterDay] = useState('')
  const [filteredDeliveries, setFilteredDeliveries] = useState({ totalDeliveries: 0, deliveries: [] })
  const [loading, setLoading] = useState(false)
  const [isActive, setIsActive] = useState(userData?.isActive || false)
  const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 })
  const [upiByKey, setUpiByKey] = useState({})
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent)

  // Fetch assignments
  const getAssignments = useCallback(async () => {
    try {
      const result = await orderAPI.getAssignments()
      setAvailableAssignments(result.data || [])
    } catch (error) {
      console.log(error)
    }
  }, [])

  // Toggle Active status
  const toggleActive = async () => {
    try {
      setLoading(true)
      const newActive = !isActive
      await userAPI.setActive(newActive)
      setIsActive(newActive)
      dispatch(setUserData({ ...userData, isActive: newActive }))
      await getAssignments()
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  // Current Orders
  const getCurrentOrders = useCallback(async () => {
    try {
      const { data } = await orderAPI.getCurrentOrders()
      setCurrentOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.log(error)
    }
  }, [])

  const acceptOrder = async (assignmentId) => {
    try {
      await orderAPI.acceptOrder(assignmentId)
      setAvailableAssignments(prev => prev.filter(a => a.assignmentId !== assignmentId))
      await getCurrentOrders()
      await getAssignments()
    } catch (error) {
      console.log(error)
    }
  }

  const handleTodayDeliveries = useCallback(async () => {
    try {
      const result = await orderAPI.getTodayDeliveries()
      setTodayDeliveries(result.data)
    } catch (error) {
      console.log(error)
    }
  }, [])

  const rejectOrder = (assignmentId) => {
    setRejectedAssignments(prev => new Set([...prev, assignmentId]))
  }

  const handleDeliveryCounts = useCallback(async () => {
    try {
      const result = await orderAPI.getDeliveryCounts()
      setDeliveryCounts(result.data)
    } catch (error) {
      console.log(error)
    }
  }, [])

  const handleFetchByMonth = useCallback(async () => {
    try {
      const res = await orderAPI.getDeliveriesByDate(filterYear, filterMonth)
      setFilteredDeliveries(res.data || { totalDeliveries: 0, deliveries: [] })
    } catch (error) {
      console.log(error)
    }
  }, [filterYear, filterMonth])

  const handleFetchByDate = useCallback(async () => {
    try {
      if (!filterDay) return
      const parts = filterDay.split('-')
      const yearInt = parseInt(parts[0])
      const monthInt = parseInt(parts[1])
      const dayInt = parseInt(parts[2])
      const res = await orderAPI.getDeliveriesByDate(yearInt, monthInt, dayInt)
      setFilteredDeliveries(res.data || { totalDeliveries: 0, deliveries: [] })
    } catch (error) {
      console.log(error)
    }
  }, [filterDay])

  // Socket Events
  useEffect(() => {
    if (socket) {
      socket.on('newAssignment', data => setAvailableAssignments(prev => [...prev, data]))
      socket.on('assignmentTaken', data => setAvailableAssignments(prev => prev.filter(a => a.assignmentId !== data.assignmentId)))
      socket.on('update-status', ({ status, deliveryOtp }) => {
        if (status === 'delivered') {
          // Refresh data if an order is marked as delivered
          getCurrentOrders()
          handleTodayDeliveries()
          handleDeliveryCounts()
          handleFetchByMonth()
        } else if (deliveryOtp) {
            // Update OTP values if received via socket
            getCurrentOrders()
        }
      })
      return () => {
        socket.off('newAssignment')
        socket.off('assignmentTaken')
        socket.off('update-status')
      }
    }
  }, [socket, handleFetchByMonth])

  // Build UPI Links for current orders
  useEffect(() => {
    const buildLinks = async () => {
      const next = {}
      for (const co of currentOrders || []) {
        try {
          const key = `${co.orderId}-${co.shopOrder._id}`
          const so = co.shopOrder
          
          // Use totalAmount directly from backend calculation
          const amount = Number(so.totalAmount || 0).toFixed(2)

          const shopId = typeof so.shop === 'string' ? so.shop : so.shop?._id
          if (!shopId) continue
          const res = await itemAPI.getByShop(shopId)
          const shop = res.data?.shop
          const vpa = shop?.upiVpa
          const pn = shop?.upiPayeeName || shop?.name || 'FoodWay'
          if (vpa) {
            const tn = `Delivery Order`
            const link = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}&am=${amount}&cu=INR`
            next[key] = { amount, vpa, pn, link }
          }
        } catch (err) {
          console.log('build UPI link error', err)
        }
      }
      setUpiByKey(next)
    }

    if (currentOrders.length > 0) buildLinks()
    else setUpiByKey({})
  }, [currentOrders])

  // Initial Load
  useEffect(() => {
    if (!userData) return;
    
    (async () => {
      try {
        const res = await ratingAPI.getDeliveryRatings()
        setRatingSummary(res.data?.summary || { average: 0, count: 0 })
      } catch (err) {
        console.log('fetch delivery rating error', err)
      }
    })()
    getAssignments()
    getCurrentOrders()
    handleTodayDeliveries()
    handleDeliveryCounts()
    handleFetchByMonth()
  }, [userData, getAssignments, getCurrentOrders, handleTodayDeliveries, handleDeliveryCounts, handleFetchByMonth])

  // Handle history filtering
  useEffect(() => {
    if (!userData) return;
    if (filterDay) {
      handleFetchByDate();
    } else {
      handleFetchByMonth();
    }
  }, [filterYear, filterMonth, filterDay, userData, handleFetchByMonth, handleFetchByDate]);

  if (!userData) return null;

  return (
    <div className="w-screen min-h-screen flex flex-col items-center bg-[#f8fafc] overflow-y-auto">
      <Nav />

      <div className="w-full max-w-5xl flex flex-col items-center gap-6 p-4">

        {/* --- Profile Section --- */}
        <div className="w-full bg-white shadow-lg rounded-2xl border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-[#ff4d2d] mb-1">Hello, {userData.fullName}</h1>
          <p className="text-gray-600 mb-5">Manage your deliveries efficiently and earn more!</p>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {userData.deliveryBoyId && (
              <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full text-sm font-bold text-orange-600 border border-orange-200">
                ID: {userData.deliveryBoyId}
              </div>
            )}

            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              {isActive ? 'Active' : 'Inactive'}
            </div>

            <button
              onClick={toggleActive}
              disabled={loading}
              className={`px-5 py-2 rounded-full text-white font-semibold shadow transition-all duration-200 ${
                isActive ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {loading ? <ClipLoader size={20} color="white" /> : isActive ? 'Go Inactive' : 'Go Active'}
            </button>
          </div>
        </div>

        {/* --- Stats Section --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
          <div className="bg-white rounded-xl shadow p-5 flex items-center gap-3 border border-gray-100">
            <FaClipboardList className="text-orange-500 text-2xl" />
            <div>
              <p className="text-gray-600 text-sm">Available Orders</p>
              <p className="text-xl font-semibold">{availableAssignments.filter(a => !rejectedAssignments.has(a.assignmentId)).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 flex items-center gap-3 border border-gray-100">
            <FaTruck className="text-green-500 text-2xl" />
            <div>
              <p className="text-gray-600 text-sm">Today's Deliveries</p>
              <p className="text-xl font-semibold">{deliveryCounts.today || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 flex items-center gap-3 border border-gray-100">
            <FaMoneyBillWave className="text-emerald-500 text-2xl" />
            <div>
              <p className="text-gray-600 text-sm">Today's Earnings</p>
              <p className="text-xl font-semibold">₹{Number(deliveryCounts.todayEarnings || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 flex items-center gap-3 border border-gray-100">
            <FaCalendarAlt className="text-blue-500 text-2xl" />
            <div>
              <p className="text-gray-600 text-sm">Monthly Deliveries</p>
              <p className="text-xl font-semibold">{deliveryCounts.month}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 flex items-center gap-3 border border-gray-100">
            <FaStar className="text-yellow-500 text-2xl" />
            <div>
              <p className="text-gray-600 text-sm">My Rating</p>
              <p className="text-xl font-semibold">
                ★ {Number(ratingSummary.average || 0).toFixed(1)} <span className="text-sm text-gray-400">({ratingSummary.count})</span>
              </p>
            </div>
          </div>
        </div>

        {/* --- Filter Section (Delivery History) --- */}
        <div className="w-full bg-white rounded-2xl shadow border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#ff4d2d] flex items-center gap-2">
              <FaListAlt /> Delivery History
            </h2>
            <div className="bg-orange-50 text-orange-600 px-4 py-1 rounded-full text-sm font-bold">
              {filteredDeliveries.totalDeliveries || 0} Deliveries
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Year</label>
              <input
                type="number"
                className="border-2 border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-orange-400 focus:outline-none transition-all"
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                min="2000"
                max="2100"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Month</label>
              <select
                className="border-2 border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-orange-400 focus:outline-none transition-all"
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{new Date(0, m-1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Specific Date (Optional)</label>
              <input
                type="date"
                className="border-2 border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-orange-400 focus:outline-none transition-all"
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredDeliveries.deliveries?.length ? (
              filteredDeliveries.deliveries.map((d, i) => {
                const so = d.shopOrders.find(s => s.assignedDeliveryBoy === userData._id)
                return (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-800">{so?.shop?.name || 'Restaurant'}</p>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +₹{(so?.deliveryBoyShare || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-gray-500 space-y-1">
                        <p className="flex items-center gap-1">
                          <FaCalendarAlt size={10} /> {new Date(d.createdAt).toLocaleDateString()} at {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p>Customer: {d.user?.fullName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-700">₹{so?.subtotal || 0}</p>
                        <p className="text-[10px] text-gray-400">Order Total</p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl">
                <p className="text-gray-400 text-sm italic">No delivery records found for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Available Orders --- */}
        <div className="w-full bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-4 text-[#ff4d2d]">Available Orders</h2>
          {availableAssignments?.filter(a => !rejectedAssignments.has(a.assignmentId)).length ? (
            <div className="space-y-3">
              {availableAssignments.filter(a => !rejectedAssignments.has(a.assignmentId)).map((a, i) => (
                <div key={i} className="border rounded-xl p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-all">
                  <div>
                    <p className="font-semibold text-sm">{a.shopName}</p>
                    <p className="text-sm text-gray-600"><b>Delivery:</b> {a.deliveryAddress?.text || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{a.items.length} items | ₹{a.subtotal}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectOrder(a.assignmentId)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                    >
                      <FaTimes size={12} /> Reject
                    </button>
                    <button
                      onClick={() => acceptOrder(a.assignmentId)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No available orders</p>
          )}
        </div>

        {/* --- Current Orders --- */}
        <div className="w-full bg-white rounded-2xl shadow border border-gray-100 p-6 mb-10">
          <h2 className="text-lg font-bold mb-4 text-[#ff4d2d]">Current Orders</h2>
          {currentOrders?.length ? (
            currentOrders.map((co) => {
              const key = `${co.orderId}-${co.shopOrder._id}`
              return (
                <div key={key} className="border rounded-xl p-5 mb-4 bg-gray-50 border-orange-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-lg text-gray-800">{co.shopOrder.shop.name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <FaTruck className="text-orange-400" /> {co.shopOrder.status}
                      </p>
                    </div>
                    <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Active Delivery
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Customer:</span> {co.user.fullName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Address:</span> {co.deliveryAddress?.text || 'Address not available'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{co.shopOrder.shopOrderItems.length} items</span>
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt size={10} className="text-gray-400" />
                        {co.shopOrder.shop?.city || 'City N/A'}
                      </span>
                      <span>|</span>
                      <span className="font-extrabold text-[#ff4d2d] text-base">₹{co.shopOrder.subtotal}</span>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Payment Method:</span>
                      <span className="font-semibold uppercase text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        {co.paymentMethod === "online" ? "Online" : "Cash on Delivery"}
                      </span>
                    </div>

                    {/* UPI Link for COD orders or pending payments */}
                    {(co.paymentMethod === "cod" || !co.payment) && upiByKey[key] && (
                      <div className="pt-2 border-t border-dashed border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Collect Payment (₹{upiByKey[key].amount})</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (upiByKey[key].link) {
                                navigator.clipboard.writeText(upiByKey[key].link)
                                setMessages(prev => ({ ...prev, [key]: 'UPI Link Copied!' }))
                                setTimeout(() => setMessages(prev => ({ ...prev, [key]: '' })), 3000)
                              }
                            }}
                            className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-purple-200"
                          >
                            {messages[key] === 'UPI Link Copied!' ? '✓ Copied' : 'Copy UPI Link'}
                          </button>
                          {isMobile && (
                            <a
                              href={upiByKey[key].link}
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center"
                            >
                              Open UPI
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OTP Section */}
                  <div className="mt-5">
                    {!showOtpFor[key] ? (
                      <button
                        onClick={() => setShowOtpFor(prev => ({ ...prev, [key]: true }))}
                        disabled={loading}
                        className="w-full bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {loading ? <ClipLoader size={20} color="white" /> : (
                          <>
                            <FaRegSmile /> Complete Delivery
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-4 bg-white border-2 border-green-100 rounded-xl shadow-inner">
                        <p className="text-sm font-bold text-gray-700 mb-3">
                          Enter OTP for <span className="text-orange-500">{co.user.fullName}</span>
                        </p>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            placeholder="Enter 4-digit OTP"
                            className="flex-1 border-2 border-gray-200 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-center tracking-widest text-lg"
                            maxLength={4}
                            value={otpValues[key] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '')
                              if (val.length <= 4) {
                                setOtpValues(prev => ({ ...prev, [key]: val }))
                              }
                            }}
                          />
                          <button
                            className="bg-gray-200 text-gray-600 px-3 rounded-lg hover:bg-gray-300 transition-colors"
                            onClick={() => setShowOtpFor(prev => ({ ...prev, [key]: false }))}
                          >
                            Cancel
                          </button>
                        </div>
                        {messages[key] && messages[key] !== 'UPI Link Copied!' && <p className={`text-center text-xs font-bold mb-3 ${messages[key].includes('Verified') ? 'text-green-600' : 'text-blue-600'}`}>{messages[key]}</p>}
                        <button
                          className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 shadow-md transition-all active:scale-95"
                          onClick={async () => {
                            const otp = (otpValues[key] || '').trim()
                            if (!otp || otp.length !== 4) {
                              alert('Please enter a valid 4-digit OTP')
                              return
                            }
                            setLoading(true)
                            try {
                              const res = await orderAPI.verifyDeliveryOtp(
                                co.orderId,
                                co.shopOrder._id,
                                otp
                              )
                              setMessages(prev => ({ ...prev, [key]: 'Delivery Verified!' }))
                              setTimeout(() => {
                                getCurrentOrders()
                                handleTodayDeliveries()
                                handleDeliveryCounts()
                              }, 1500)
                            } catch (err) {
                              alert(err.response?.data?.message || 'Invalid OTP')
                            } finally {
                              setLoading(false)
                            }
                          }}
                        >
                          Verify & Deliver
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <FaTruck className="mx-auto text-gray-300 text-4xl mb-2" />
              <p className="text-gray-400 font-medium">No active deliveries at the moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeliveryBoy
