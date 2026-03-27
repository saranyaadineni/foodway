import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setMyOrders } from '../redux/userSlice'
import { useSelector } from 'react-redux'
import { ClipLoader } from 'react-spinners'
import { ratingAPI, orderAPI, getImageUrl } from '../api'

function UserOrderCard({ data }) {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { myOrders } = useSelector(state => state.user)
    const [entityRatings, setEntityRatings] = useState({}) // keys: `${shopOrderId}-shop`, `${shopOrderId}-deliveryBoy`, `${itemId}-item`
    const [isCancelling, setIsCancelling] = useState(false)
    const [isEditingInstructions, setIsEditingInstructions] = useState(false)
    const [specialInstructions, setSpecialInstructions] = useState(data.specialInstructions || '')
    const [specialInstructionsError, setSpecialInstructionsError] = useState("")
    const [otpMessage, setOtpMessage] = useState("")
    const [otpLoading, setOtpLoading] = useState(false)
    const [showOtp, setShowOtp] = useState(false)
    const [comments, setComments] = useState({})
    
    const handleDownloadInvoice = (shopOrder) => {
        try {
            const win = window.open('', '_blank')
            if (!win) {
                alert('Please allow popups to download the invoice.')
                return
            }

            const items = (shopOrder.receipt?.items && shopOrder.receipt.items.length
                ? shopOrder.receipt.items
                : (shopOrder.shopOrderItems || []).map(i => ({
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity
                }))
            )

            const rows = items.map(i => `
              <tr>
                <td style="padding:4px 8px;border:1px solid #ddd;">${i.name}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${i.quantity}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;">₹${i.price}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;">₹${Number(i.price) * Number(i.quantity)}</td>
              </tr>
            `).join('')

            const calculatedSubtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)
            const itemsTotal = shopOrder.itemsTotal || shopOrder.subtotal || calculatedSubtotal
            const deliveryFee = shopOrder.deliveryFee || 0
            const platformFee = shopOrder.platformFee || 0
            const tax = shopOrder.tax || 0
            const grandTotal = shopOrder.totalAmount || (Number(itemsTotal) + Number(deliveryFee) + Number(platformFee) + Number(tax))
            const receiptNumber = shopOrder.receipt?.receiptNumber || `R-${data.orderId || data._id.slice(-6)}`

            win.document.write(`
              <!doctype html>
              <html>
              <head>
                <meta charset="utf-8" />
                <title>Invoice ${receiptNumber}</title>
              </head>
              <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding:24px; color:#111827;">
                <h1 style="font-size:20px;margin-bottom:4px;">FoodWay Invoice</h1>
                <p style="margin:0 0 16px 0;font-size:13px;color:#4b5563;">Receipt: ${receiptNumber}</p>

                <div style="margin-bottom:16px;font-size:13px;">
                  <p style="margin:0;"><strong>Customer:</strong> ${data.user?.fullName || ''}</p>
                  <p style="margin:0;"><strong>Email:</strong> ${data.user?.email || ''}</p>
                  <p style="margin:0;"><strong>Order ID:</strong> ${data.orderId || data._id}</p>
                  <p style="margin:0;"><strong>Date:</strong> ${formatDate(data.createdAt)}</p>
                </div>

                <table style="border-collapse:collapse;width:100%;font-size:13px;margin-bottom:12px;">
                  <thead>
                    <tr style="background:#f3f4f6;">
                      <th style="padding:6px 8px;border:1px solid #d1d5db;text-align:left;">Item</th>
                      <th style="padding:6px 8px;border:1px solid #d1d5db;text-align:center;">Qty</th>
                      <th style="padding:6px 8px;border:1px solid #d1d5db;text-align:right;">Price</th>
                      <th style="padding:6px 8px;border:1px solid #d1d5db;text-align:right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>

                <div style="text-align:right;font-size:14px;margin-top:8px;">
                  <p style="margin:0;"><strong>Items Total:</strong> ₹${itemsTotal}</p>
                  ${deliveryFee > 0 ? `<p style="margin:0;"><strong>Delivery Fee:</strong> ₹${deliveryFee}</p>` : ''}
                  ${platformFee > 0 ? `<p style="margin:0;"><strong>Platform Fee:</strong> ₹${platformFee}</p>` : ''}
                  ${tax > 0 ? `<p style="margin:0;"><strong>Tax:</strong> ₹${tax}</p>` : ''}
                  <p style="margin:8px 0 0 0;font-size:16px;"><strong>Grand Total:</strong> ₹${grandTotal}</p>
                </div>

                <p style="margin-top:24px;font-size:12px;color:#6b7280;">Thank you for ordering with FoodWay.</p>
              </body>
              </html>
            `)
            win.document.close()
            win.focus()
            win.print()
        } catch (e) {
            console.error('invoice download error', e)
            alert('Failed to generate invoice. Please try again.')
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-GB', {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })

    }

    // Load any existing ratings for this order (persist star colors)
    useEffect(() => {
        const fetchExistingRatings = async () => {
            try {
                const res = await ratingAPI.getOrderRating(data._id)
                if (res.data?.map) {
                    setEntityRatings(res.data.map)
                }
            } catch (e) {
                // non-blocking
                console.log('load order ratings error', e?.response?.data || e)
            }
        }
        if (data?.shopOrders?.length) fetchExistingRatings()
    }, [data?._id, data?.shopOrders?.length])

    const handleItemRating = async (shopOrder, itemId, stars) => {
        try {
            const key = `${itemId}-item`
            if (entityRatings[key]) return
            await ratingAPI.submitRating({
                orderId: data._id,
                shopOrderId: shopOrder._id,
                type: 'item',
                targetId: itemId,
                stars
            })
            setEntityRatings(prev => ({ ...prev, [key]: stars }))
        } catch (error) {
            console.log('submit item rating error', error?.response?.data || error)
        }
    }

    const handleEntityRating = async (shopOrder, type, stars) => {
        try {
            const key = `${shopOrder._id}-${type}`
            if (entityRatings[key]) return
            const targetId = type === 'shop' ? shopOrder.shop._id : shopOrder.assignedDeliveryBoy?._id
            if (!targetId) return
            await ratingAPI.submitRating({
                orderId: data._id,
                shopOrderId: shopOrder._id,
                type,
                targetId,
                stars,
                comment: comments[key] || ''
            })
            setEntityRatings(prev => ({ ...prev, [key]: stars }))
        } catch (error) {
            console.log('submit rating error', error?.response?.data || error)
        }
    }

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
            return
        }
        
        setIsCancelling(true)
        try {
            await orderAPI.cancelOrder(data._id, 'User cancelled')
            // Update the order status in local state
            const updatedOrders = myOrders.map(order => {
                if (order._id === data._id) {
                    return {
                        ...order,
                        isCancelled: true,
                        cancellationReason: 'User cancelled',
                        shopOrders: order.shopOrders.map(shopOrder => ({
                            ...shopOrder,
                            status: 'cancelled'
                        }))
                    }
                }
                return order
            })
            dispatch(setMyOrders(updatedOrders))
        } catch (error) {
            console.error('Error cancelling order:', error)
            alert(error.response?.data?.message || 'Failed to cancel order. Please try again.')
        } finally {
            setIsCancelling(false)
        }
    }

    const handleUpdateSpecialInstructions = async () => {
        setSpecialInstructionsError("");
        
        if (!specialInstructions || !specialInstructions.trim()) {
            setSpecialInstructionsError("Please enter special instructions");
            return;
        }

        if (specialInstructions.trim().length > 500) {
            setSpecialInstructionsError("Instructions must be less than 500 characters");
            return;
        }

        // Basic check for potentially harmful characters or just ensure it's readable text
        // Allow alphabets, numbers, common punctuation: . , ! ? ( ) -
        if (!/^[A-Za-z0-9\s.,!?( )\-]+$/.test(specialInstructions.trim())) {
            setSpecialInstructionsError("Instructions contain unsupported special characters");
            return;
        }

        try {
            const trimmedInstructions = specialInstructions.trim();
            await orderAPI.updateSpecialInstructions(data._id, trimmedInstructions)
            
            // Update the order in local state
            const updatedOrders = myOrders.map(order => {
                if (order._id === data._id) {
                    return {
                        ...order,
                        specialInstructions: trimmedInstructions
                    }
                }
                return order
            })
            dispatch(setMyOrders(updatedOrders))
            setIsEditingInstructions(false)
            setSpecialInstructions(trimmedInstructions)
        } catch (error) {
            console.error('Error updating special instructions:', error)
            setSpecialInstructionsError(error.response?.data?.message || 'Failed to update special instructions')
        }
    }

    const handleGenerateOtp = async (shopOrderId) => {
        setOtpMessage("")
        setOtpLoading(true)
        try {
            const result = await orderAPI.sendDeliveryOtp(data._id, shopOrderId)
            if (result.data.isExisting) {
                setOtpMessage('Existing OTP resent successfully.')
            } else {
                setOtpMessage('New OTP generated and sent successfully.')
            }
            setShowOtp(true)
        } catch (error) {
            setOtpMessage(error.response?.data?.message || 'Failed to generate OTP')
        } finally {
            setOtpLoading(false)
        }
    }

    const canEditInstructions = () => {
        return data.shopOrders.some(shopOrder => 
            shopOrder.status === 'pending' || shopOrder.status === 'preparing'
        ) && !data.isCancelled
    }


    return (
        <div className='bg-white rounded-lg shadow p-4 space-y-4'>
            <div className='flex justify-between border-b pb-2'>
                <div>
                    <p className='font-semibold'>
                        order #{data.orderId || data._id.slice(-6)}
                    </p>
                    <p className='text-sm text-gray-500'>
                        Date: {formatDate(data.createdAt)}
                    </p>
                </div>
                <div className='text-right'>
                    {data.paymentMethod == "cod" ? <p className='text-sm text-gray-500'>{data.paymentMethod?.toUpperCase()}</p> : <p className='text-sm text-gray-500 font-semibold'>Payment: {data.payment ? "true" : "false"}</p>}

                    <p className='font-medium text-blue-600'>
                        {data.isCancelled ? 'cancelled' : data.shopOrders?.[0].status}
                    </p>
                </div>
            </div>

            {data.shopOrders.map((shopOrder, index) => (
                <div className='"border rounded-lg p-3 bg-[#fffaf7] space-y-3' key={index}>
                    <p>{shopOrder.shop.name}</p>

                    <div className='flex space-x-4 overflow-x-auto pb-2'>
                        {shopOrder.shopOrderItems.map((item, index) => (
                            <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white"'>
                                <img src={getImageUrl(item.item.image)} alt="" className='w-full h-24 object-cover rounded' />
                                <p className='text-sm font-semibold mt-1'>{item.name}</p>
                                <p className='text-xs text-gray-500'>Qty: {item.quantity} x ₹{item.price}</p>

                                {shopOrder.status == "delivered" && (
                                    <div className='flex space-x-1 mt-2'>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                className={`text-lg ${ (entityRatings[`${item.item._id}-item`] || 0) >= star ? 'text-yellow-400' : 'text-gray-400'}`}
                                                onClick={() => handleItemRating(shopOrder, item.item._id, star)}
                                                disabled={Boolean(entityRatings[`${item.item._id}-item`])}
                                            >★</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className='flex flex-col border-t pt-2 space-y-1'>
                        <div className='flex justify-between text-sm text-gray-600'>
                            <span>Items Total:</span>
                            <span>₹{shopOrder.itemsTotal || shopOrder.subtotal}</span>
                        </div>
                        {shopOrder.deliveryFee > 0 && (
                            <div className='flex justify-between text-sm text-gray-600'>
                                <span>Delivery Fee:</span>
                                <span>₹{shopOrder.deliveryFee}</span>
                            </div>
                        )}
                        {shopOrder.platformFee > 0 && (
                            <div className='flex justify-between text-sm text-gray-600'>
                                <span>Platform Fee:</span>
                                <span>₹{shopOrder.platformFee}</span>
                            </div>
                        )}
                        {shopOrder.tax > 0 && (
                            <div className='flex justify-between text-sm text-gray-600'>
                                <span>Tax:</span>
                                <span>₹{shopOrder.tax}</span>
                            </div>
                        )}
                        <div className='flex justify-between items-center pt-1'>
                            <p className='font-bold text-gray-900'>Total: ₹{shopOrder.totalAmount || (Number(shopOrder.itemsTotal || shopOrder.subtotal || 0) + Number(shopOrder.deliveryFee || 0) + Number(shopOrder.platformFee || 0) + Number(shopOrder.tax || 0))}</p>
                            <span className='text-sm font-medium text-blue-600'>
                                {data.isCancelled ? 'cancelled' : shopOrder.status}
                            </span>
                        </div>
                    </div>

                    {/* Receipt Details for User */}
                    {shopOrder?.receipt?.receiptNumber && (
                        <div className='mt-3 p-3 border rounded-lg bg-green-50 text-sm'>
                            <p className='font-semibold text-green-800'>Receipt Generated</p>
                            <p className='text-green-700'>Number: {shopOrder.receipt.receiptNumber}</p>
                            <p className='text-green-700'>Items: {shopOrder.receipt.items?.length || 0} | Subtotal: ₹{shopOrder.receipt.subtotal}</p>
                            <button
                                onClick={() => handleDownloadInvoice(shopOrder)}
                                className='mt-2 inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700'
                            >
                                Download invoice
                            </button>
                        </div>
                    )}

                    {/* Rate Restaurant after delivery */}
                    {shopOrder.status === 'delivered' && (
                        <div className='mt-3'>
                            <div className='p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border rounded-lg'>
                                <p className='text-sm font-semibold text-indigo-800 mb-1'>Rate Restaurant</p>
                                <div className='flex space-x-1'>
                                    {[1,2,3,4,5].map(star => (
                                        <button key={star} className={`text-xl ${ (entityRatings[`${shopOrder._id}-shop`] || 0) >= star ? 'text-yellow-400' : 'text-gray-300' } ${ entityRatings[`${shopOrder._id}-shop`] ? 'cursor-not-allowed opacity-50' : ''}`}
                                            onClick={() => !entityRatings[`${shopOrder._id}-shop`] && handleEntityRating(shopOrder, 'shop', star)}
                                            disabled={Boolean(entityRatings[`${shopOrder._id}-shop`])}
                                        >★</button>
                                    ))}
                                </div>
                                <input
                                    type='text'
                                    placeholder='Write a review (optional)'
                                    value={comments[`${shopOrder._id}-shop`] || ''}
                                    onChange={(e) => setComments(prev => ({ ...prev, [`${shopOrder._id}-shop`]: e.target.value }))}
                                    className='mt-2 w-full border rounded px-2 py-1 text-sm'
                                    disabled={Boolean(entityRatings[`${shopOrder._id}-shop`])}
                                />
                                {entityRatings[`${shopOrder._id}-shop`] && (
                                    <p className='text-xs text-gray-500 mt-1'>You already rated this restaurant.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Rate Delivery Boy after delivery */}
                    {shopOrder.status === 'delivered' && shopOrder.assignedDeliveryBoy && (
                        <div className='mt-3'>
                            <div className='p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border rounded-lg'>
                                <p className='text-sm font-semibold text-orange-800 mb-1'>Rate Delivery</p>
                                <div className='flex space-x-1'>
                                    {[1,2,3,4,5].map(star => (
                                        <button key={star} className={`text-xl ${ (entityRatings[`${shopOrder._id}-deliveryBoy`] || 0) >= star ? 'text-yellow-500' : 'text-gray-300' } ${ entityRatings[`${shopOrder._id}-deliveryBoy`] ? 'cursor-not-allowed opacity-50' : ''}`}
                                            onClick={() => !entityRatings[`${shopOrder._id}-deliveryBoy`] && handleEntityRating(shopOrder, 'deliveryBoy', star)}
                                            disabled={Boolean(entityRatings[`${shopOrder._id}-deliveryBoy`])}
                                        >★</button>
                                    ))}
                                </div>
                                <input
                                    type='text'
                                    placeholder='Share feedback about delivery (optional)'
                                    value={comments[`${shopOrder._id}-deliveryBoy`] || ''}
                                    onChange={(e) => setComments(prev => ({ ...prev, [`${shopOrder._id}-deliveryBoy`]: e.target.value }))}
                                    className='mt-2 w-full border rounded px-2 py-1 text-sm'
                                    disabled={Boolean(entityRatings[`${shopOrder._id}-deliveryBoy`])}
                                />
                                {entityRatings[`${shopOrder._id}-deliveryBoy`] && (
                                    <p className='text-xs text-gray-500 mt-1'>You already rated this delivery.</p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* OTP Section - Show if out of delivery OR if OTP exists */}
                    {(shopOrder.status === "out of delivery" || shopOrder.deliveryOtp) && (
                        <div className='mt-3'>
                            {shopOrder.deliveryOtp ? (
                                <div className='p-4 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 rounded-lg shadow-sm'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <h4 className='text-lg font-bold text-orange-800 mb-1'>🔐 Delivery OTP</h4>
                                            <p className='text-sm text-orange-600 mb-2'>Share this OTP with your delivery person</p>
                                            <p className='text-[10px] text-orange-500 font-bold uppercase'>OTP valid for 10 minutes</p>
                                        </div>
                                        <div className='text-right'>
                                            {showOtp ? (
                                                <>
                                                    <div className='bg-white px-4 py-2 rounded-lg border-2 border-orange-300 shadow-sm'>
                                                        <span className='text-2xl font-bold text-orange-800 tracking-wider'>{shopOrder.deliveryOtp}</span>
                                                    </div>
                                                    <button 
                                                        className='text-xs text-orange-500 mt-2 font-semibold hover:underline'
                                                        onClick={() => setShowOtp(false)}
                                                    >
                                                        Hide OTP
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    className='bg-orange-500 text-white px-4 py-2 rounded-lg shadow hover:bg-orange-600 transition-all active:scale-95 text-sm font-bold'
                                                    onClick={() => setShowOtp(true)}
                                                >
                                                    View OTP
                                                </button>
                                            )}
                                            {shopOrder.otpExpires && showOtp && (
                                                <p className='text-[10px] text-orange-500 mt-1'>
                                                    Expires: {new Date(shopOrder.otpExpires).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {otpMessage && (
                                        <p className='text-xs text-orange-700 mt-2 font-medium'>{otpMessage}</p>
                                    )}
                                </div>
                            ) : (
                                <div className='p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg shadow-sm'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <h4 className='text-lg font-bold text-orange-800 mb-1'>Generate Delivery OTP</h4>
                                            <p className='text-sm text-orange-600'>Tap to generate and share with delivery person</p>
                                        </div>
                                        <button 
                                            className='bg-orange-500 text-white px-4 py-2 rounded-lg shadow hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-95'
                                            onClick={() => handleGenerateOtp(shopOrder._id)}
                                            disabled={otpLoading}
                                        >
                                            {otpLoading ? <ClipLoader size={20} color='white' /> : 'Generate OTP'}
                                        </button>
                                    </div>
                                    {otpMessage && (
                                        <p className='text-xs text-orange-700 mt-2 font-medium'>{otpMessage}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {/* Special Instructions Section */}
            {(data.specialInstructions || canEditInstructions()) && (
                <div className='mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-lg'>
                    <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                            <h4 className='text-lg font-bold text-blue-800 mb-2 flex items-center'>
                                📝 Special Instructions
                            </h4>
                            {isEditingInstructions ? (
                                <div className='space-y-3'>
                                    <textarea
                                        value={specialInstructions}
                                        onChange={(e) => {
                                            setSpecialInstructions(e.target.value);
                                            if (specialInstructionsError) setSpecialInstructionsError("");
                                        }}
                                        placeholder="Add any special instructions for your order..."
                                        className={`w-full p-3 border ${specialInstructionsError ? 'border-red-500' : 'border-blue-300'} rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        rows={3}
                                        maxLength={500}
                                    />
                                    {specialInstructionsError && (
                                        <p className='text-red-500 text-xs mt-1 font-semibold uppercase'>{specialInstructionsError}</p>
                                    )}
                                    <div className='flex gap-2'>
                                        <button
                                            onClick={handleUpdateSpecialInstructions}
                                            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm'
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditingInstructions(false)
                                                setSpecialInstructions(data.specialInstructions || '')
                                            }}
                                            className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm'
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className='bg-white p-3 rounded-lg border border-blue-200 shadow-sm'>
                                    <p className='text-blue-700 text-sm leading-relaxed'>
                                        {data.specialInstructions || 'No special instructions added'}
                                    </p>
                                </div>
                            )}
                        </div>
                        {canEditInstructions() && !isEditingInstructions && (
                            <button
                                onClick={() => setIsEditingInstructions(true)}
                                className='ml-3 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm'
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className='flex justify-between items-center border-t pt-2'>
                <p className='font-semibold'>Total: ₹{data.totalAmount}</p>
                <div className='flex gap-2'>
                    {/* Show cancel button only for pending orders and not cancelled orders */}
                    {data.shopOrders.some(shopOrder => shopOrder.status === 'pending') && !data.isCancelled && (
                        <button 
                            className='bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50' 
                            onClick={handleCancelOrder}
                            disabled={isCancelling}
                        >
                            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                    )}

                    <button className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm' onClick={() => navigate(`/track-order/${data._id}`)}>Track Order</button>
                </div>
            </div>



        </div>
    )
}

export default UserOrderCard
