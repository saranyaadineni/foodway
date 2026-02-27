import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { clearCartNotification } from '../redux/userSlice'
import Alert from './Alert'

function CartNotification() {
  const dispatch = useDispatch()
  const { cartClearedForNewShop } = useSelector(state => state.user)

  useEffect(() => {
    if (cartClearedForNewShop) {
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        dispatch(clearCartNotification())
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [cartClearedForNewShop, dispatch])

  return (
    <Alert
      isVisible={cartClearedForNewShop}
      type="warning"
      title="Cart Updated"
      message="Only order from one shop at a time. Your previous cart items were removed."
      onClose={() => dispatch(clearCartNotification())}
    />
  )
}

export default CartNotification