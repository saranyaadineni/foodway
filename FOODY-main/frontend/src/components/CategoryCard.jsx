import React from 'react'
import { getImageUrl } from '../api'

function CategoryCard({name,image,onClick,isOpen}) {
  // Avoid empty string src warnings by passing null when image is falsy/empty
  const imgSrc = getImageUrl(image)
  const isShopClosed = isOpen === false;

  return (
    <div className={`w-[120px] h-[120px] md:w-[180px] md:h-[180px] rounded-2xl border-2 ${isShopClosed ? 'border-gray-300 grayscale' : 'border-[#ff4d2d]'} shrink-0 overflow-hidden bg-white shadow-xl shadow-gray-200 hover:shadow-lg transition-shadow relative cursor-pointer`} onClick={onClick}>
     {imgSrc ? (
       <img src={imgSrc} alt="" className=' w-full h-full object-cover transform hover:scale-110 transition-transform duration-300'/>
     ) : (
       <div className='w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm'>
         No Image
       </div>
     )}
     {isShopClosed && (
       <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
         <span className='bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider'>Closed</span>
       </div>
     )}
     <div className='absolute bottom-0 w-full left-0 bg-white/90 px-3 py-2 text-center text-sm md:text-base font-bold text-gray-900 backdrop-blur-sm border-t border-gray-100'>
       {name}
     </div>
    </div>
  )
}

export default CategoryCard
