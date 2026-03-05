import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentAddress, setCurrentCity, setCurrentState } from '../redux/userSlice'
import { setAddress, setLocation } from '../redux/mapSlice'

function useGetCity() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    const { currentCity } = useSelector(state => state.user)
    // No external API key needed; we use default city
    
    useEffect(() => {
        // Only get location if user is authenticated and we don't already have location data
        if (userData && userData._id && !currentCity) {
            // dispatch(setCurrentCity('Hyderabad'))
            // dispatch(setCurrentState('Telangana'))
            // dispatch(setCurrentAddress('Hyderabad, Telangana'))
            // dispatch(setAddress('Hyderabad, Telangana'))
            
            navigator.geolocation.getCurrentPosition(async (position) => {
                const latitude = position.coords.latitude
                const longitude = position.coords.longitude
                dispatch(setLocation({ lat: latitude, lon: longitude }))
            }, () => {
            })
        }
    }, [userData, currentCity, dispatch])
}

export default useGetCity
