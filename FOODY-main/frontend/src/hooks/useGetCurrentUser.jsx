import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserData, setAuthLoading } from '../redux/userSlice'
import { userAPI } from '../api'

function useGetCurrentUser() {
    const dispatch = useDispatch()
    
    useEffect(() => {
        const fetchUser = async () => {
            dispatch(setAuthLoading(true))
            try {
                const result = await userAPI.getCurrentUser()
                if (result.status === 200) {
                    dispatch(setUserData(result.data))
                } else {
                    dispatch(setUserData(null))
                }
            } catch {
                dispatch(setUserData(null))
            } finally {
                dispatch(setAuthLoading(false))
            }
        }
        
        fetchUser()
    }, [dispatch])
}

export default useGetCurrentUser
