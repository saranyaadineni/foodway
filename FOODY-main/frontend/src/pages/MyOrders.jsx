import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import UserOrderCard from '../components/UserOrderCard';
import OwnerOrderCard from '../components/OwnerOrderCard';
import DeliveryBoyOrderCard from '../components/DeliveryBoyOrderCard';
import ErrorBoundary from '../components/ErrorBoundary';
import useGetMyOrders from '../hooks/useGetMyOrders';
import { setMyOrders, updateRealtimeOrderStatus } from '../redux/userSlice';
import DeliveryRatingPopup from '../components/DeliveryRatingPopup';


function MyOrders() {
  const { userData, myOrders,socket} = useSelector(state => state.user)
  const navigate = useNavigate()
const dispatch=useDispatch()
  const [searchTerm, setSearchTerm] = useState('')
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
  };
  
  // Fetch orders data
  useGetMyOrders()
  
  // Socket events for owners and users
  useEffect(()=>{
    socket?.on('newOrder',(data)=>{
      if(data.shopOrders?.owner._id==userData?._id){
        dispatch(setMyOrders([data,...myOrders]))
      }
    })

    socket?.on('update-status',({orderId,shopId,status,userId,deliveryOtp,otpExpires})=>{
      if(userId==userData?._id){
        dispatch(updateRealtimeOrderStatus({orderId,shopId,status,deliveryOtp,otpExpires}))
      }
    })

    return ()=>{
      socket?.off('newOrder')
      socket?.off('update-status')
    }
  },[socket, dispatch, myOrders, userData?._id])



  // Filter orders for owners by customer name or receipt number
  const filteredOrders = useMemo(() => {
    if (!myOrders) return []
    if (userData?.role !== 'owner') return myOrders
    const term = searchTerm.trim().toLowerCase()
    if (!term) return myOrders
    return myOrders.filter((order) => {
      const nameMatch = (order?.user?.fullName || '').toLowerCase().includes(term)
      // Owner view may expose a single shopOrder under order.shopOrders
      let receiptMatch = false
      const so = order?.shopOrders
      if (Array.isArray(so)) {
        receiptMatch = so.some(s => (s?.receipt?.receiptNumber || '').toLowerCase().includes(term))
      } else {
        receiptMatch = ((so?.receipt?.receiptNumber || '').toLowerCase().includes(term))
      }
      return nameMatch || receiptMatch
    })
  }, [myOrders, searchTerm, userData?.role])

  return (
    <div className='w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
      {/* Message Notifications */}
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-2">
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl shadow-lg animate-fade-in-down">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-lg animate-fade-in-down">
            {error}
          </div>
        )}
      </div>

      <div className='w-full max-w-[800px] p-4'>

        <div className='flex items-center gap-[20px] mb-6 '>
          <div className=' z-[10] ' onClick={() => navigate("/")}>
            <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
          </div>
          <h1 className='text-2xl font-bold  text-start'>My Orders</h1>
        </div>
        {/* Owner search input */}
        {userData?.role === 'owner' && (
          <div className='mb-4'>
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Search by Customer Name or Receipt Number'
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]'
            />
          </div>
        )}

        <div className='space-y-6'>
          {filteredOrders && filteredOrders.length > 0 ? (
            filteredOrders.map((order,index)=>(
              <ErrorBoundary key={`error-boundary-${index}`}>
                {userData?.role=="user" ?
                  (
                    <UserOrderCard data={order} key={index} showMessage={showMessage}/>
                  ) :
                  userData?.role=="owner" ?
                  (
                    <OwnerOrderCard data={order} key={index} showMessage={showMessage}/>
                  ) :
                  userData?.role=="deliveryBoy" ?
                  (
                    <DeliveryBoyOrderCard data={order} key={index} showMessage={showMessage}/>
                  ) : null
                }
              </ErrorBoundary>
            ))
          ) : (
            <div className='text-center py-10'>
              <p className='text-gray-500'>No orders found.</p>
            </div>
          )}
        </div>
      </div>
      {userData?.role === 'user' && <DeliveryRatingPopup />}
    </div>
  )
}

export default MyOrders
