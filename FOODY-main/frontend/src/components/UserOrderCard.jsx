import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setMyOrders } from '../redux/userSlice'
import { useSelector } from 'react-redux'
import { ClipLoader } from 'react-spinners'
import { ratingAPI, orderAPI, getImageUrl } from '../api'

function UserOrderCard({ data, showMessage }) {
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

    useEffect(() => {
        const fetchRatings = async () => {
            try {
                const res = await ratingAPI.getOrderRating(data._id)
                const ratings = res.data.ratings || []
                const ratingsMap = {}
                ratings.forEach(r => {
                    if (r.type === 'item') {
                        ratingsMap[`${r.target}-item`] = r.stars
                    } else if (r.type === 'shop') {
                        ratingsMap[`${r.shopOrderId}-shop`] = r.stars
                    } else if (r.type === 'deliveryBoy') {
                        ratingsMap[`${r.shopOrderId}-deliveryBoy`] = r.stars
                    }
                })
                setEntityRatings(ratingsMap)
            } catch (err) {
                console.error('Error fetching ratings:', err)
            }
        }
        if (data.shopOrders.some(so => so.status === 'delivered')) {
            fetchRatings()
        }
    }, [data._id, data.shopOrders])

    const handleItemRating = async (shopOrder, itemId, stars) => {
        try {
            const comment = comments[`${itemId}-item`] || ''
            await ratingAPI.submitRating({
                orderId: data._id,
                shopOrderId: shopOrder._id,
                type: 'item',
                targetId: itemId,
                stars,
                comment
            })
            setEntityRatings(prev => ({ ...prev, [`${itemId}-item`]: stars }))
            if (showMessage) showMessage('Item rated successfully!', 'success')
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit rating'
            if (showMessage) showMessage(msg, 'error')
        }
    }

    const handleEntityRating = async (shopOrder, type, stars) => {
        try {
            const key = type === 'shop' ? `${shopOrder._id}-shop` : `${shopOrder._id}-deliveryBoy`
            const targetId = type === 'shop' ? shopOrder.shop._id : shopOrder.assignedDeliveryBoy._id
            const comment = comments[key] || ''
            
            await ratingAPI.submitRating({
                orderId: data._id,
                shopOrderId: shopOrder._id,
                type,
                targetId,
                stars,
                comment
            })
            setEntityRatings(prev => ({ ...prev, [key]: stars }))
            if (showMessage) showMessage(`${type === 'shop' ? 'Restaurant' : 'Delivery'} rated successfully!`, 'success')
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit rating'
            if (showMessage) showMessage(msg, 'error')
        }
    }

    const handleDownloadInvoice = (shopOrder) => {
        const receipt = shopOrder.receipt
        if (!receipt) return

        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice - ${receipt.receiptNumber}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ff4d2d; padding-bottom: 10px; }
                        .logo { color: #ff4d2d; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                        .receipt-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background-color: #f8f8f8; text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
                        td { padding: 12px; border-bottom: 1px solid #eee; }
                        .totals { text-align: right; }
                        .total-row { font-weight: bold; font-size: 1.1em; color: #000; }
                        .footer { text-align: center; margin-top: 50px; font-size: 0.8em; color: #777; border-top: 1px solid #eee; pt: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">FOODY</div>
                        <p>Official Order Receipt</p>
                    </div>
                    <div class="receipt-info">
                        <div>
                            <strong>Order ID:</strong> #${data.orderId || data._id.slice(-6)}<br>
                            <strong>Receipt No:</strong> ${receipt.receiptNumber}<br>
                            <strong>Date:</strong> ${new Date(receipt.generatedAt || Date.now()).toLocaleString()}
                        </div>
                        <div style="text-align: right">
                            <strong>Restaurant:</strong> ${shopOrder.shop.name}<br>
                            <strong>Customer:</strong> ${data.user?.fullName || 'Valued Customer'}
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(receipt.items || []).map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>₹${item.price}</td>
                                    <td>${item.quantity}</td>
                                    <td>₹${item.price * item.quantity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="totals">
                        <p>Items Total: ₹${receipt.itemsTotal || receipt.subtotal}</p>
                        ${receipt.deliveryFee > 0 ? `<p>Delivery Fee: ₹${receipt.deliveryFee}</p>` : ''}
                        ${receipt.platformFee > 0 ? `<p>Platform Fee: ₹${receipt.platformFee}</p>` : ''}
                        ${receipt.tax > 0 ? `<p>Tax: ₹${receipt.tax}</p>` : ''}
                        <p class="total-row">Grand Total: ₹${receipt.totalAmount}</p>
                    </div>
                    <div class="footer">
                        <p>Thank you for ordering with FOODY!</p>
                        <p>This is a computer-generated receipt and does not require a physical signature.</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-GB', {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })

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
            if (showMessage) showMessage('Order cancelled successfully', 'success')
        } catch (error) {
            console.error('Error cancelling order:', error)
            const msg = error.response?.data?.message || 'Failed to cancel order. Please try again.'
            if (showMessage) showMessage(msg, 'error')
            else alert(msg)
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
            if (showMessage) showMessage('Instructions updated successfully', 'success')
        } catch (error) {
            console.error('Error updating special instructions:', error)
            const msg = error.response?.data?.message || 'Failed to update special instructions'
            setSpecialInstructionsError(msg)
            if (showMessage) showMessage(msg, 'error')
        }
    }

    const handleGenerateOtp = async (shopOrderId) => {
        setOtpMessage("")
        setOtpLoading(true)
        try {
            const result = await orderAPI.sendDeliveryOtp(data._id, shopOrderId)
            const msg = result.data.isExisting ? 'Existing OTP resent successfully.' : 'New OTP generated and sent successfully.'
            setOtpMessage(msg)
            if (showMessage) showMessage(msg, 'success')
            setShowOtp(true)
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to generate OTP'
            setOtpMessage(msg)
            if (showMessage) showMessage(msg, 'error')
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
        <div className='bg-white rounded-lg shadow p-4 space-y-4 border border-gray-100'>
            <div className='flex justify-between border-b border-gray-50 pb-3'>
                <div>
                    <p className='font-bold text-gray-900'>
                        Order #{data.orderId || data._id.slice(-6)}
                    </p>
                    <p className='text-xs text-gray-400 font-medium'>
                        {formatDate(data.createdAt)}
                    </p>
                </div>
                <div className='text-right space-y-1'>
                    <div className='flex items-center justify-end gap-2'>
                        {data.paymentMethod === "online" ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${data.payment ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {data.payment ? "Paid" : "Unpaid"}
                            </span>
                        ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${data.payment ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {data.payment ? "Paid" : "COD Pending"}
                            </span>
                        )}
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-tighter ${data.isCancelled ? 'text-red-500' : 'text-[#fc8019]'}`}>
                        {data.isCancelled ? 'Cancelled' : data.shopOrders?.[0].status}
                    </p>
                </div>
            </div>

            {data.shopOrders.map((shopOrder, index) => (
                <div className='"border rounded-lg p-3 bg-[#fffaf7] space-y-3' key={index}>
                    <p>{shopOrder.shop.name}</p>

                    <div className='flex space-x-4 overflow-x-auto pb-2'>
                        {shopOrder.shopOrderItems.map((item, index) => (
                            <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white"'>
                                <img src={getImageUrl(item?.item?.image || item?.image)} alt={item.name} className='w-full h-24 object-cover rounded' />
                                <p className='text-sm font-semibold mt-1'>{item.name}</p>
                                <p className='text-xs text-gray-500'>Qty: {item.quantity} x ₹{item.price}</p>

                                {shopOrder.status == "delivered" && item?.item && (
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
