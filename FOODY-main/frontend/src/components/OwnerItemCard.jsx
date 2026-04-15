import React, { useState } from 'react'
import { FaPen } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setMyShopData } from '../redux/ownerSlice';
import { itemAPI, shopAPI, getImageUrl } from '../api';
function OwnerItemCard({data, showMessage}) {
    const navigate=useNavigate()
    const dispatch=useDispatch()
    const [stockStatus, setStockStatus] = useState(data.stockStatus || 'in_stock')
    const [isUpdatingStock, setIsUpdatingStock] = useState(false)

    const handleDelete=async () => {
      if (window.confirm("Are you sure you want to delete this item?")) {
        try {
          const result = await itemAPI.deleteItem(data._id)
          dispatch(setMyShopData(result.data))
          if (showMessage) {
            showMessage("Item Deleted Successfully", "success");
          }
        } catch (error) {
          console.log(error)
          if (showMessage) {
            showMessage("Failed to Delete Item", "error");
          }
        }
      }
    }

    const handleStockStatusChange = async (newStatus) => {
      try {
        setIsUpdatingStock(true)
        await itemAPI.updateStock(data._id, newStatus)
        setStockStatus(newStatus)
        // Update the shop data to reflect the change
        const updatedShopData = await shopAPI.getMy()
        dispatch(setMyShopData(updatedShopData.data))
      } catch (error) {
        console.log('Error updating stock status:', error)
      } finally {
        setIsUpdatingStock(false)
      }
    }

    const getStockStatusColor = (status) => {
      switch (status) {
        case 'in_stock': return 'text-green-600 bg-green-50 border-green-200'
        case 'out_of_stock': return 'text-red-600 bg-red-50 border-red-200'
        case 'limited': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        default: return 'text-gray-600 bg-gray-50 border-gray-200'
      }
    }

    const getStockStatusText = (status) => {
      switch (status) {
        case 'in_stock': return 'In Stock'
        case 'out_of_stock': return 'Out of Stock'
        case 'limited': return 'Limited Stock'
        default: return 'Unknown'
      }
    }
  return (
    <div className='flex bg-white rounded-lg shadow-md overflow-hidden border border-[#ff4d2d] w-full max-w-2xl'>
      <div className='w-36  flex-shrink-0 bg-gray-50'>
        <img src={getImageUrl(data.image)} alt="" className='w-full h-full object-cover'/>
      </div>
      <div className='flex flex-col justify-between p-3 flex-1'>
          <div>
<h2 className='text-lg font-bold text-[#ff4d2d] flex items-center gap-2'>
  {data.name}
  <span className='inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200'>
    ★ {Number(data?.rating?.average || 0).toFixed(1)}
    <span className='text-[10px] text-gray-500 ml-1'>({data?.rating?.count || 0})</span>
  </span>
</h2>
<p className='text-sm text-gray-600'><span className='font-bold text-gray-800'>Category:</span> {data.category.charAt(0).toUpperCase() + data.category.slice(1)}</p>
<p className='text-sm text-gray-600'><span className='font-bold text-gray-800'>Food Type:</span> {data.foodType.charAt(0).toUpperCase() + data.foodType.slice(1)}</p>
{data.hasOffer && (
  <p className='mt-1'>
    <span className='font-medium text-gray-70'>Offer:</span> 
    <span className='ml-1 px-1.5 py-0.5 rounded-md bg-[#60b246]/10 text-[#60b246] text-xs font-bold border border-[#60b246]/20'>
      {data.offerPercentage}% OFF
    </span>
  </p>
)}
{/* Stock Status Display */}
<div className='mt-2'>
  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStockStatusColor(stockStatus)}`}>
    {getStockStatusText(stockStatus)}
  </span>
</div>
          </div>
          
          {/* Stock Status Control */}
          <div className='mt-3 mb-2'>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Stock Status:</label>
            <select 
              value={stockStatus} 
              onChange={(e) => handleStockStatusChange(e.target.value)}
              disabled={isUpdatingStock}
              className='w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#ff4d2d] focus:border-[#ff4d2d] disabled:opacity-50'
            >
              <option value="in_stock">In Stock</option>
              <option value="limited">Limited Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div className='flex items-center justify-between'>
            <div className='text-[#ff4d2d] font-bold'>₹{data.price}</div>
          <div className='flex items-center gap-2'>
<div className='p-2 cursor-pointer rounded-full hover:bg-[#ff4d2d]/10  text-[#ff4d2d]' onClick={()=>navigate(`/edit-item/${data._id}`)}>
<FaPen size={16}/>
</div>
<div className='p-2 cursor-pointer rounded-full hover:bg-[#ff4d2d]/10  text-[#ff4d2d]' onClick={handleDelete}>
<FaTrashAlt size={16}/>
</div>
          </div>

          </div>
      </div>
    </div>
  )
}

export default OwnerItemCard
