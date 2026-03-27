import React from 'react';
import { useDispatch } from 'react-redux';
import { FaLeaf, FaDrumstickBite } from 'react-icons/fa';
import { addToCart, removeFromCart } from '../redux/userSlice';

function CartItemCard({ item }) {
  const dispatch = useDispatch();

  const handleIncrease = () => {
    dispatch(addToCart({ ...item, quantity: 1 }));
  };

  const handleDecrease = () => {
    dispatch(removeFromCart(item));
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 flex-1">
        <div className={`w-3 h-3 border-2 ${item.foodType === 'veg' ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-[1px]`}>
          <div className={`w-1 h-1 rounded-full ${item.foodType === 'veg' ? 'bg-green-600' : 'bg-red-600'}`}></div>
        </div>
        <span className="text-[#3d4152] font-medium">{item.name}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-gray-200 px-2 py-1 text-[#60b246] font-bold">
          <span className="w-4 text-center cursor-pointer hover:bg-gray-50" onClick={handleDecrease}>-</span>
          <span className="w-6 text-center text-xs">{item.quantity}</span>
          <span className="w-4 text-center cursor-pointer hover:bg-gray-50" onClick={handleIncrease}>+</span>
        </div>
        <span className="text-[#535665] w-12 text-right">₹{item.price * item.quantity}</span>
      </div>
    </div>
  );
}

export default CartItemCard;
