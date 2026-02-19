import React, { useEffect, useState, useCallback } from 'react'
import Nav from './Nav'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { orderAPI, userAPI, itemAPI, ratingAPI } from '../api'
import { ClipLoader } from 'react-spinners'
import { FaStar, FaClipboardList, FaTruck, FaRegSmile, FaCalendarAlt, FaListAlt } from 'react-icons/fa'

function DeliveryBoy() {
  const { userData, socket } = useSelector(state => state.user)
  const dispatch = useDispatch()

  const [currentOrders, setCurrentOrders] = useState([])
  const [availableAssignments, setAvailableAssignments] = useState([])
  const [otpValues, setOtpValues] = useState({})
  const [showOtpFor, setShowOtpFor] = useState({})
  const [messages, setMessages] = useState({})
  const [todayDeliveries, setTodayDeliveries] = useState({ totalDeliveries: 0, deliveries: [] })
  const [deliveryCounts, setDeliveryCounts] = useState({ total: 0, month: 0 })
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
  const getAssignments = async () => {
    try {
      const result = await orderAPI.getAssignments()
      setAvailableAssignments(result.data || [])
    } catch (error) {
      console.log(error)
    }
  }

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
  const getCurrentOrders = async () => {
    try {
      const { data } = await orderAPI.getCurrentOrders()
      setCurrentOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.log(error)
    }
  }

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

  const handleTodayDeliveries = async () => {
    try {
      const result = await orderAPI.getTodayDeliveries()
      setTodayDeliveries(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  const handleDeliveryCounts = async () => {
    try {
      const result = await orderAPI.getDeliveryCounts()
      setDeliveryCounts({ total: result.data?.total || 0, month: result.data?.month || 0 })
    } catch (error) {
      console.log(error)
    }
  }

  const handleFetchByMonth = useCallback(async () => {
    try {
      const res = await orderAPI.getDeliveriesByDate(filterYear, filterMonth)
      setFilteredDeliveries(res.data || { totalDeliveries: 0, deliveries: [] })
    } catch (error) {
      console.log(error)
    }
  }, [filterYear, filterMonth])

  const handleFetchByDate = async () => {
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
  }

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
          const subtotal = Number(so.subtotal || 0)
          const ownerShare = subtotal
          const deliveryBoyShare = Number(so.deliveryBoyShare || 0)
          const superadminFee = Number(so.superadminFee || 0)
          const paymentFee = Number(so.paymentFee || 0)
          const amount = (ownerShare + deliveryBoyShare + superadminFee + paymentFee).toFixed(2)

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
  }, [userData, handleFetchByMonth])

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
              <p className="text-xl font-semibold">{availableAssignments.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 flex items-center gap-3 border border-gray-100">
            <FaTruck className="text-green-500 text-2xl" />
            <div>
              <p className="text-gray-600 text-sm">Today's Deliveries</p>
              <p className="text-xl font-semibold">{todayDeliveries.totalDeliveries || 0}</p>
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
            <FaListAlt className="text-purple-500 text-2xl" />
            <div>
              <p className="text-gray-600 text-sm">Total Deliveries</p>
              <p className="text-xl font-semibold">{deliveryCounts.total}</p>
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

        {/* --- Filter Section --- */}
        <div className="w-full bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-4 text-[#ff4d2d]">Filter Deliveries</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Year</label>
              <input
                type="number"
                className="border rounded-lg p-2"
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                min="2000"
                max="2100"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Month</label>
              <select
                className="border rounded-lg p-2"
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{new Date(0, m-1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Pick a Date (optional)</label>
              <input
                type="date"
                className="border rounded-lg p-2"
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleFetchByMonth}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Fetch by Month
            </button>
            <button
              onClick={handleFetchByDate}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              disabled={!filterDay}
            >
              Fetch by Date
            </button>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-600">Results</p>
            <p className="text-lg font-semibold">{filteredDeliveries.totalDeliveries} deliveries</p>
            <div className="mt-3 space-y-3">
              {filteredDeliveries.deliveries?.length ? (
                filteredDeliveries.deliveries.map((order, idx) => (
                  <div key={idx} className="border rounded-xl p-4 bg-gray-50">
                    <p className="font-semibold text-sm">{order.shopOrders?.shop?.name || 'Shop'}</p>
                    <p className="text-sm text-gray-600"><b>Delivery:</b> {order.deliveryAddress?.text || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Subtotal: ₹{order.shopOrders?.subtotal || order.totalAmount}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No deliveries in selected period</p>
              )}
            </div>
          </div>
        </div>

        {/* --- Available Orders --- */}
        <div className="w-full bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-4 text-[#ff4d2d]">Available Orders</h2>
          {availableAssignments?.length ? (
            <div className="space-y-3">
              {availableAssignments.map((a, i) => (
                <div key={i} className="border rounded-xl p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-all">
                  <div>
                    <p className="font-semibold text-sm">{a.shopName}</p>
                    <p className="text-sm text-gray-600"><b>Delivery:</b> {a.deliveryAddress?.text || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{a.items.length} items | ₹{a.subtotal}</p>
                  </div>
                  <button
                    onClick={() => acceptOrder(a.assignmentId)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Accept
                  </button>
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
                <div key={key} className="border rounded-xl p-5 mb-4 bg-gray-50">
                  <p className="font-semibold">{co.shopOrder.shop.name}</p>
                  <p className="text-sm text-gray-600">{co.deliveryAddress?.text || 'Address not available'}</p>
                  <p className="text-xs text-gray-500 mb-2">{co.shopOrder.shopOrderItems.length} items | ₹{co.shopOrder.subtotal}</p>

                  {/* Payment */}
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-orange-800">Collect via UPI</p>
                        <p className="text-xs text-orange-700">Amount: ₹{upiByKey[key]?.amount || co.shopOrder.subtotal}</p>
                      </div>
                      {upiByKey[key]?.link ? (
                        isMobile ? (
                          <a href={upiByKey[key].link} target="_blank" rel="noreferrer" className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">Open UPI</a>
                        ) : (
                          <button
                            onClick={() => navigator.clipboard.writeText(upiByKey[key].link)}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                          >
                            Copy Link
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-red-600">UPI not configured</span>
                      )}
                    </div>

                    {!isMobile && upiByKey[key]?.link && (
                      <div className="mt-3 flex justify-end">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiByKey[key].link)}`}
                          alt="QR"
                          className="rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  {/* OTP Section */}
                  {!showOtpFor[key] ? (
                    <button
                      onClick={() => setShowOtpFor(prev => ({ ...prev, [key]: true }))}
                      disabled={loading}
                      className="mt-4 w-full bg-green-500 text-white font-semibold py-2 rounded-xl shadow hover:bg-green-600 transition-all"
                    >
                      {loading ? <ClipLoader size={20} color="white" /> : 'Mark as Delivered'}
                    </button>
                  ) : (
                    <div className="mt-4 p-4 bg-white border rounded-lg">
                      <p className="text-sm font-semibold mb-2">Enter OTP for <span className="text-orange-500">{co.user.fullName}</span></p>
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        className="w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={otpValues[key] || ''}
                        onChange={(e) => setOtpValues(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                      {messages[key] && <p className="text-center text-green-600 mb-3">{messages[key]}</p>}
                      <button
                        className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600"
                        onClick={async () => {
                          const otp = (otpValues[key] || '').trim()
                          if (!otp || otp.length !== 4) {
                            setMessages(prev => ({ ...prev, [key]: 'Please enter a valid 4-digit OTP' }))
                            return
                          }
                          try {
                            setLoading(true)
                            const res = await orderAPI.verifyDeliveryOtp(co.orderId, co.shopOrder._id, otp)
                            setMessages(prev => ({ ...prev, [key]: res.data.message }))
                            setCurrentOrders(prev => prev.filter(o => `${o.orderId}-${o.shopOrder._id}` !== key))
                            await getAssignments()
                            await handleTodayDeliveries()
                            await handleDeliveryCounts()
                            await handleFetchByMonth()
                          } catch (error) {
                            setMessages(prev => ({ ...prev, [key]: error.response?.data?.message || 'Failed to verify OTP' }))
                          } finally {
                            setLoading(false)
                          }
                        }}
                      >
                        Submit OTP
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-sm text-gray-500">No current orders</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeliveryBoy
