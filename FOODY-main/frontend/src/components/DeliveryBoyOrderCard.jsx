import React, { useState } from 'react'
import { MdPhone, MdLocationOn } from 'react-icons/md'
import { ClipLoader } from 'react-spinners'
import { orderAPI, getImageUrl } from '../api'
import { useDispatch } from 'react-redux'
import { updateOrderStatus } from '../redux/userSlice'

function DeliveryBoyOrderCard({ data, onOrderUpdate }) {
    const dispatch = useDispatch()
    const [showOtpBox, setShowOtpBox] = useState(false)
    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const updateStatus = async (status) => {
        setLoading(true)
        try {
            const shopId = data.shopOrders.shop?._id || data.shopOrders.shop;
            await orderAPI.updateOrderStatus(data._id, shopId, status)
            dispatch(updateOrderStatus({ orderId: data._id, status, shopId }))
            if (onOrderUpdate) {
                onOrderUpdate()
            }
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to update status")
        }
        setLoading(false)
    }

    const sendOtp = async () => {
        // Delivery boy should not generate OTP; only prompt for entry
        setShowOtpBox(true)
        setMessage('Ask customer to generate OTP from their app.')
    }

    const verifyOtp = async () => {
        if (!otp || otp.trim().length !== 4) {
            setMessage("Please enter a valid 4-digit OTP")
            return
        }
        setLoading(true)
        try {
            const result = await orderAPI.verifyDeliveryOtp(data._id, data.shopOrders._id, otp.trim())
            setMessage(result.data.message)
            // Update the order status locally and notify parent component
            dispatch(updateOrderStatus({ orderId: data._id, status: 'delivered' }))
            setOtp("")
            setShowOtpBox(false)
            // Call parent callback to refresh data if provided
            if (onOrderUpdate) {
                onOrderUpdate()
            }
        } catch (error) {
            setMessage(error.response?.data?.message || "Invalid OTP")
        }
        setLoading(false)
    }

    return (
        <div className='bg-white rounded-lg shadow p-4 space-y-4'>
            {/* Customer Information */}
            <div>
                <h2 className='text-lg font-semibold text-gray-800'>{data.user.fullName}</h2>
                <p className='text-sm text-gray-500'>{data.user.email}</p>
                <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
                    <MdPhone />
                    <span>{data.user.mobile}</span>
                </p>
                <p className='text-sm text-gray-600'>
                    Payment: {data.paymentMethod === "online" ? (data.payment ? "Paid" : "Pending") : "Cash on Delivery"}
                </p>
            </div>

            {/* Delivery Address */}
            <div className='flex items-start gap-2 text-gray-600 text-sm'>
                <MdLocationOn className='mt-1 text-red-500' />
                <div>
                    <p className='font-medium'>Delivery Address:</p>
                    <p>{data?.deliveryAddress?.text}</p>
                </div>
            </div>

            {/* Shop Information */}
            <div className='bg-orange-50 p-3 rounded-lg'>
                <p className='font-semibold text-orange-800'>Shop: {data.shopOrders.shop.name}</p>
                <p className='text-sm text-orange-600'>
                    Owner: {data.shopOrders.owner.fullName} - {data.shopOrders.owner.mobile}
                </p>
                {data?.shopOrders?.receipt?.receiptNumber && (
                    <p className='text-xs text-green-700 mt-1'>Receipt: {data.shopOrders.receipt.receiptNumber}</p>
                )}
            </div>

            {/* Order Items */}
            <div className='flex space-x-4 overflow-x-auto pb-2'>
                {data.shopOrders.shopOrderItems.map((item, index) => (
                        <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
                            <img src={getImageUrl(item.item.image)} alt="" className='w-full h-24 object-cover rounded' />
                            <p className='text-sm font-semibold mt-1'>{item.name}</p>
                        <p className='text-xs text-gray-500'>Qty: {item.quantity} x ₹{item.price}</p>
                    </div>
                ))}
            </div>

            {/* Order Status and Actions */}
            <div className='flex flex-col space-y-4 pt-3 border-t border-gray-100'>
                <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium text-gray-600'>
                            Status: <span className='font-bold capitalize text-[#ff4d2d] bg-orange-50 px-3 py-1 rounded-full border border-orange-100'>{data.shopOrders.status}</span>
                        </span>
                    </div>
                    <span className='text-lg font-extrabold text-gray-900'>
                        Total: ₹{data.shopOrders.subtotal}
                    </span>
                </div>

                {message && (
                    <div className={`text-center text-sm font-medium p-2 rounded-lg ${message.toLowerCase().includes('failed') || message.toLowerCase().includes('invalid') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {message}
                    </div>
                )}

                {/* Delivery Boy Action Buttons */}
                <div className='grid grid-cols-1 gap-3'>
                    {data.shopOrders.status === "accepted" && (
                        <button 
                            className='w-full bg-[#fc8019] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#e67316] transition-all active:scale-95 disabled:opacity-50'
                            onClick={() => updateStatus("picked up")}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color='white' /> : "Mark Picked Up"}
                        </button>
                    )}

                    {data.shopOrders.status === "picked up" && (
                        <button 
                            className='w-full bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50'
                            onClick={() => updateStatus("out of delivery")}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color='white' /> : "Start Delivery"}
                        </button>
                    )}

                    {data.shopOrders.status === "out of delivery" && (
                        <div className='bg-green-50 p-4 border border-green-200 rounded-xl space-y-4 shadow-sm'>
                            {!showOtpBox ? (
                                <button 
                                    className='w-full bg-[#60b246] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#529a3c] transition-all active:scale-95 disabled:opacity-50' 
                                    onClick={sendOtp} 
                                    disabled={loading}
                                >
                                    {loading ? <ClipLoader size={20} color='white' /> : "Mark As Delivered"}
                                </button>
                            ) : (
                                <div className='space-y-4'>
                                    <div className='flex flex-col space-y-1'>
                                        <p className='text-sm font-bold text-gray-700'>
                                            Enter 4-digit OTP from: <span className='text-[#fc8019]'>{data.user.fullName}</span>
                                        </p>
                                        <p className='text-[10px] text-gray-500'>Ask customer to generate OTP from their order page.</p>
                                    </div>
                                    <input 
                                        type="text" 
                                        maxLength={4}
                                        className='w-full border-2 border-orange-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc8019] text-center text-2xl font-bold tracking-[1rem] placeholder:tracking-normal placeholder:text-base' 
                                        placeholder='----' 
                                        onChange={(e) => setOtp(e.target.value)} 
                                        value={otp}
                                    />
                                    <div className='flex gap-2'>
                                        <button 
                                            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all" 
                                            onClick={() => setShowOtpBox(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            className="flex-[2] bg-[#fc8019] text-white py-3 rounded-xl font-bold hover:bg-[#e67316] transition-all shadow-md active:scale-95" 
                                            onClick={verifyOtp}
                                            disabled={loading}
                                        >
                                            {loading ? <ClipLoader size={20} color='white' /> : "Verify OTP"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delivered Status */}
            {data.shopOrders.status === "delivered" && (
                <div className='mt-4 p-5 bg-green-50 border border-green-200 rounded-2xl text-center shadow-inner'>
                    <p className='text-green-700 font-extrabold flex items-center justify-center gap-2'>
                        <span className='text-xl'>✅</span> Order Delivered Successfully
                    </p>
                    <p className='text-xs text-green-600 mt-1 font-medium'>Great job! Payment details have been updated.</p>
                </div>
            )}
        </div>
    );
}

export default DeliveryBoyOrderCard
