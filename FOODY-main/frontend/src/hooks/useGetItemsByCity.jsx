import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setItemsInMyCity } from '../redux/userSlice'
import { itemAPI } from '../api'

function useGetItemsByCity() {
    const dispatch=useDispatch()
    const {currentCity, userData}=useSelector(state=>state.user)
  useEffect(()=>{
  const fetchItems=async () => {
  try {
        let result;
        // For admins and owners, fetch all items or handle specially
        const cityParam = (userData?.role === 'superadmin' || userData?.role === 'owner') ? 'all' : currentCity;

        if (cityParam && cityParam !== 'all') {
            result = await itemAPI.getByCity(cityParam)
            
            // If no items found in current city, fallback to getting all items
            if (!result.data || result.data.length === 0) {
                result = await itemAPI.getByCity('all');
            }
        } else {
            // No city or role is admin/owner, get all items
            result = await itemAPI.getByCity('all');
        }
        
        if (result && result.data) {
            dispatch(setItemsInMyCity(result.data))
        }
   } catch (error) {
        console.error("Error fetching items:", error);
    }
}
fetchItems()
 
  },[currentCity, dispatch, userData])
}

export default useGetItemsByCity
