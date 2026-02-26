import React, { useState } from 'react'
import { FaLeaf } from "react-icons/fa";
import { FaDrumstickBite } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/userSlice';
import { getImageUrl } from '../api';

function FoodCard({data}) {
const [quantity,setQuantity]=useState(0)
const dispatch=useDispatch()
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
    <div className={`w-[250px] rounded-2xl border-2 ${canOrder ? 'border-[#ff4d2d]' : 'border-gray-300'} bg-white shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col ${!canOrder ? 'opacity-70' : ''}`}>
      <div className='relative w-full h-[170px] flex justify-center items-center bg-white'>
        <div className='absolute top-3 right-3 bg-white rounded-full p-1 shadow'>{data.foodType=="veg"?<FaLeaf className='text-green-600 text-lg'/>:<FaDrumstickBite className='text-red-600 text-lg'/>}</div>
        
        {/* Status indicators */}
        {!isShopOpen && (
          <div className='absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold'>
            Shop Closed
          </div>
        )}
        {!isAvailable && isShopOpen && (
          <div className='absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold'>
            Out of Stock
          </div>
        )}

        {hasOffer && (
          <div className='absolute bottom-3 left-3 bg-[#60b246] text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-lg z-10 flex flex-col items-center leading-none'>
            <span className='mb-1'>{data.offerPercentage}% OFF</span>
            <span className='text-[8px] opacity-80'>SPECIAL OFFER</span>
          </div>
        )}

<img src={getImageUrl(data.image)} alt="" className='w-full h-full object-cover transition-transform duration-300 hover:scale-105'/>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <div className='flex justify-between items-start gap-2'>
          <h1 className='font-semibold text-gray-900 text-base truncate'>{data.name}</h1>
          <span className='text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap'>
            {data.category || 'Food'}
          </span>
        </div>
        
        {/* Shop Name Display */}
        <div className='flex items-center gap-1 mt-1'>
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

<div className='flex items-center justify-between mt-auto p-3'>
<div className='flex flex-col'>
  {hasOffer && (
    <span className='text-[10px] text-gray-400 line-through font-medium leading-none mb-1'>
      ₹{data.price}
    </span>
  )}
  <span className='font-bold text-gray-900 text-lg leading-none'>
      ₹{discountedPrice}
  </span>
</div>

<div className={`flex items-center border rounded-full overflow-hidden shadow-sm ${!canOrder ? 'opacity-50 pointer-events-none' : ''}`}>
<button className='px-2 py-1 hover:bg-gray-100 transition' onClick={handleDecrease} disabled={!canOrder}>
<FaMinus size={12}/>
</button>
<span>{quantity}</span>
<button className='px-2 py-1 hover:bg-gray-100 transition' onClick={handleIncrease} disabled={!canOrder}>
<FaPlus size={12}/>
</button>
<button className={`${cartItems.some(i=>i.id==data._id)?"bg-gray-800":canOrder ? "bg-[#ff4d2d]" : "bg-gray-400"} text-white px-3 py-2 transition-colors`}  
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
<FaShoppingCart size={16}/>
</button>
</div>
</div>


    </div>
  )
}

export default FoodCard
