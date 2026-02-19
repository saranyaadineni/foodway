import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { itemAPI, getImageUrl } from '../api'
import { useNavigate, useParams } from 'react-router-dom'
import { FaStore } from "react-icons/fa6";
import { FaLocationDot } from "react-icons/fa6";
import { FaUtensils } from "react-icons/fa";
import { FaFilter } from "react-icons/fa";
import FoodCard from '../components/FoodCard';
import { FaArrowLeft } from "react-icons/fa";
import { useSelector } from 'react-redux';
import Nav from '../components/Nav.jsx';

function Shop() {
    const {shopId}=useParams()
    const [items,setItems]=useState([])
    const [shop,setShop]=useState([])
    const [shopClosed, setShopClosed] = useState(false)
    const navigate=useNavigate()
    const { socket } = useSelector(state => state.user)
    const [sortBy, setSortBy] = useState('')
    const [filterFoodType, setFilterFoodType] = useState('All')
    const [showFilters, setShowFilters] = useState(false)
    
    const handleShop = useCallback(async () => {
        try {
           const result = await itemAPI.getByShop(shopId)
           setShop(result.data.shop)
           setItems(result.data.items)
           setShopClosed(!result.data.shop.isOpen)
        } catch (error) {
            console.log(error)
        }
    }, [shopId])

    // Real-time shop status updates
    useEffect(() => {
        if (socket && shopId) {
            socket.on('shopStatusUpdate', (data) => {
                if (data.shopId === shopId) {
                    console.log('Shop status update received for current shop:', data)
                    setShop(prevShop => ({ ...prevShop, isOpen: data.isOpen }))
                    setShopClosed(!data.isOpen)
                    
                    // If shop closed, clear items
                    if (!data.isOpen) {
                        setItems([])
                    } else {
                        // If shop reopened, refetch items
                        handleShop()
                    }
                }
            })

            return () => {
                socket.off('shopStatusUpdate')
            }
        }
    }, [socket, shopId, handleShop])

    useEffect(() => {
        handleShop()
    }, [handleShop])
    
    const filteredItems = useMemo(() => {
        let arr = [...items]
        if (filterFoodType && filterFoodType !== 'All') {
            arr = arr.filter(i => (i.foodType || '').toLowerCase() === filterFoodType.toLowerCase())
        }
        switch (sortBy) {
            case 'price_low_high':
                arr.sort((a, b) => (a.price || 0) - (b.price || 0))
                break
            case 'price_high_low':
                arr.sort((a, b) => (b.price || 0) - (a.price || 0))
                break
            case 'prep_time':
                arr.sort((a, b) => (a.prepTime || 0) - (b.prepTime || 0))
                break
            case 'popularity':
                arr.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                break
            case 'rating':
                arr.sort((a, b) => (b.rating || 0) - (a.rating || 0))
                break
            case 'available_now':
                arr.sort((a, b) => (b.stockStatus === 'available') - (a.stockStatus === 'available'))
                break
            default:
                break
        }
        return arr
    }, [items, sortBy, filterFoodType])
  return (
    <div className='min-h-screen bg-gray-50'>
        <Nav />
      {shop && <div className='relative w-full h-64 md:h-80 lg:h-96'>
          <img src={getImageUrl(shop.image)} alt="" className='w-full h-full object-cover'/>
          <div className='absolute inset-0 bg-gradient-to-b from-black/70 to-black/30 flex flex-col justify-center items-center text-center px-4'>
          <FaStore className='text-white text-4xl mb-3 drop-shadow-md'/>
          <h1 className='text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg'>{shop.name}</h1>
          <div className='flex items-center  gap-[10px]'>
          <FaLocationDot size={22} color='red'/>
             <p className='text-lg font-medium text-gray-200 mt-[10px]'>{shop.address}</p>
             </div>
          </div>
       
        </div>}

<div className='max-w-7xl mx-auto px-6 py-10'>
<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10'>
  <div className='flex items-center gap-3'>
    <button onClick={()=>navigate(-1)} className='flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-full shadow-md transition'>
      <FaArrowLeft />
      <span>Back</span>
    </button>
    <h2 className='flex items-center gap-3 text-3xl font-bold text-gray-800'><FaUtensils color='red'/> Our Menu</h2>
  </div>
  <div className='flex flex-wrap gap-2'>
    <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className='px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d] text-sm'>
      <option value=''>Sort By</option>
      <option value='price_low_high'>Price: Low to High</option>
      <option value='price_high_low'>Price: High to Low</option>
      <option value='prep_time'>Preparation Time: Fastest First</option>
      <option value='popularity'>Most Popular</option>
      <option value='rating'>Highest Rated</option>
      <option value='available_now'>Available Now</option>
    </select>
    <button onClick={()=>setShowFilters(!showFilters)} className='flex items-center gap-2 px-3 py-2 bg-[#ff4d2d] text-white rounded-lg hover:bg-[#e64528] transition-colors text-sm'>
      <FaFilter /> Filters
    </button>
  </div>
</div>
{showFilters && (
  <div className='w-full bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-8'>
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Food Type</label>
        <select value={filterFoodType} onChange={(e)=>setFilterFoodType(e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d] text-sm'>
          <option value='All'>All Types</option>
          <option value='veg'>Veg</option>
          <option value='non veg'>Non-Veg</option>
          <option value='vegan'>Vegan</option>
        </select>
      </div>
    </div>
  </div>
)}

{shopClosed ? (
    <div className='text-center py-20'>
        <FaStore className='text-gray-400 text-6xl mx-auto mb-4' />
        <h3 className='text-2xl font-bold text-gray-600 mb-2'>Shop is Currently Closed</h3>
        <p className='text-gray-500'>This restaurant is temporarily closed. Please check back later.</p>
    </div>
) : filteredItems.length > 0 ? (
    <div className='flex flex-wrap justify-center gap-8'>
        {filteredItems.map((item)=>(
            <FoodCard key={item._id} data={item}/>
        ))}
    </div>
) : (
    <p className='text-center text-gray-500 text-lg'>No Items Available</p>
)}
</div>



    </div>
  )
}

export default Shop
