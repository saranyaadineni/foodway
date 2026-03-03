import React, { useState } from 'react'
import { FaLeaf } from "react-icons/fa";
import { FaDrumstickBite } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { FaShoppingCart } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/userSlice';
import { getImageUrl } from '../api';

function FoodCard({data}) {
const [quantity,setQuantity]=useState(0)
const dispatch=useDispatch()
const navigate=useNavigate()
const {cartItems}=useSelector(state=>state.user)

// Check if item is available for ordering
const isAvailable = data.stockStatus === 'in_stock' || data.stockStatus === 'limited'
const isShopOpen = data.shop?.isOpen !== false
const canOrder = isAvailable && isShopOpen

// Offer calculation
const hasOffer = data.hasOffer && data.offerPercentage > 0;
const discountedPrice = hasOffer 
  ? (data.price - (data.price * data.offerPercentage) / 100).toFixed(2) 
  : data.price;

const isTopRated = (data.rating?.average || 0) >= 4.5;

    const renderStars=(rating)=>{   //r=3
        const stars=[];
        for (let i = 1; i <= 5; i++) {
           stars.push(
            (i<=rating)?(
                <FaStar key={i} className='text-yellow-500 text-lg'/>
            ):(
                <FaRegStar key={i} className='text-yellow-500 text-lg'/>
            )
           )
            
        }
return stars
    }

const handleIncrease=()=>{
    if (!canOrder) return
    const newQty=quantity+1
    setQuantity(newQty)
}
const handleDecrease=()=>{
    if(quantity>0){
const newQty=quantity-1
    setQuantity(newQty)
    }
    
}

  return (
    <div className={`group w-full max-w-[280px] rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col ${!canOrder ? 'opacity-70 grayscale-[0.5]' : ''}`}>
      <div className='relative w-full h-[180px] overflow-hidden bg-gray-50'>
        <div className='absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm'>{data.foodType=="veg"?<FaLeaf className='text-green-600 text-base'/>:<FaDrumstickBite className='text-red-600 text-base'/>}</div>
        
        {/* Status & Rating indicators */}
        <div className='absolute top-3 left-3 z-10 flex flex-col gap-2'>
          {!isShopOpen && (
            <div className='bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg'>
              Closed
            </div>
          )}
          {!isAvailable && isShopOpen && (
            <div className='bg-orange-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg'>
              Sold Out
            </div>
          )}
          {isTopRated && (
            <div className='bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1'>
              ⭐ Top Rated
            </div>
          )}
        </div>

        {hasOffer && (
          <div className='absolute bottom-3 left-3 bg-[#60b246] text-white px-3 py-1 rounded-md text-[11px] font-black shadow-lg z-10 flex flex-col items-center leading-none border border-white/20'>
            <span className='mb-0.5'>{data.offerPercentage}% OFF</span>
            <span className='text-[7px] opacity-90 uppercase tracking-tighter'>Limited Deal</span>
          </div>
        )}

<img src={getImageUrl(data.image)} alt={data.name} className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'/>
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <div className='flex justify-between items-start gap-2'>
          <h1 className='font-semibold text-gray-900 text-base truncate'>{data.name}</h1>
          <span className='text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap'>
            {data.category || 'Food'}
          </span>
        </div>
        
        {/* Shop Name Display */}
        <div className='flex items-center gap-1 mt-1 cursor-pointer hover:underline' onClick={() => navigate(`/shop/${data.shop?._id || data.shop}`)}>
          <span className='text-xs text-orange-600 font-medium truncate'>
            by {data.shop?.name || 'Unknown Shop'}
          </span>
        </div>

        <div className='flex items-center gap-1 mt-1'>
          {renderStars(data.rating?.average || 0)}
          <span className='text-xs text-gray-500'>
            ({data.rating?.count || 0})
          </span>
        </div>
      </div>

<div className='flex items-center justify-between mt-auto p-4 bg-gray-50/50'>
<div className='flex flex-col'>
  {hasOffer && (
    <span className='text-[11px] text-gray-400 line-through font-medium leading-none mb-1'>
      ₹{data.price}
    </span>
  )}
  <span className='font-extrabold text-gray-900 text-xl leading-none'>
      ₹{discountedPrice}
  </span>
</div>

<div className={`flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-[#ff4d2d]/20 ${!canOrder ? 'opacity-50 pointer-events-none' : 'hover:border-[#ff4d2d]/30'}`}>
<button className='px-2.5 py-1.5 hover:bg-gray-100 transition-colors text-gray-600' onClick={handleDecrease} disabled={!canOrder}>
<FaMinus size={10}/>
</button>
<span className="w-6 text-center text-sm font-bold text-gray-800">{quantity}</span>
<button className='px-2.5 py-1.5 hover:bg-gray-100 transition-colors text-gray-600' onClick={handleIncrease} disabled={!canOrder}>
<FaPlus size={10}/>
</button>
<button className={`${cartItems.some(i=>i.id==data._id)?"bg-gray-900":"bg-[#ff4d2d]"} text-white px-3.5 py-2.5 hover:opacity-90 active:scale-95 transition-all shadow-inner`}  
  onClick={()=>{
    if (!canOrder) return
    quantity>0?dispatch(addToCart({
          id:data._id,
          name:data.name,
          price:data.price,
          image:data.image,
          shop:typeof data.shop === 'object' ? data.shop._id : data.shop,
          quantity,
          foodType:data.foodType
})):null}}
  disabled={!canOrder}>
<FaShoppingCart size={14}/>
</button>
</div>
</div>


    </div>
  )
}

export default FoodCard
