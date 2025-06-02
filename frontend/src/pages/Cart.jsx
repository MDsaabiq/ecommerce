import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

function Cart() {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useSelector(state => state.auth)
  const navigate = useNavigate()

  const handleOrder = async () => {
    try {
      const baseUrl = import.meta.env.VITE_REACT_BASE_URL
      console.log(`${baseUrl}/cart/order`,'url')
      const response = await axios.post(`${baseUrl}/cart/order`, {
        userId: user._id
      })
      console.log(response.data)
      toast.success('Order created successfully',{
        autoClose: 2000
      })
      navigate('/orders')
    } catch (error) {
      console.error('Order error:', error)
      toast.error('Failed to create order') 
    }
  }

  const fetchCartItems = async () => {
    try {
      if (!user?._id) {
        setLoading(false)
        return
      }
      const baseUrl = import.meta.env.VITE_REACT_BASE_URL 
      console.log(`${baseUrl}/cart/${user._id}`,'url')
      const response = await axios.get(`${baseUrl}/cart/${user._id}`)
      if (response.data && Array.isArray(response.data)) {
        setCartItems(response.data)
      } else {
        setCartItems([])
        console.error('Invalid cart data received:', response.data)
      }
      setLoading(false)
    } catch (error) {
      console.error('Fetch cart error:', error)
      toast.error('Failed to load cart items')
      setLoading(false)
      setCartItems([])
    }
  }

  useEffect(() => {
    if (user?._id) {
      fetchCartItems()
    }
  }, [user?._id])

  // Calculate total price
  const total = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * (item.quantity || 0)
  }, 0) : 0

  console.log(cartItems)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto bg-gray-800 rounded-lg p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-400 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {cartItems.map(item => (
            <div
              key={item.product._id} 
              className="bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-6">
                {/* Product Image */}
                <img 
                  src={item.product.image} 
                  alt={item.product.name}
                  className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                />

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold mb-2 line-clamp-1">{item.product.name}</h3>
                      <p className="text-red-500 font-bold text-lg mb-4">${item.product.price}</p>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-1">
                      <button 
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button 
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Subtotal</p>
                      <p className="text-lg font-bold">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="md:col-span-1">
          <div className="bg-gray-800 rounded-lg p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 text-gray-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
            </div>

            <div className="border-t border-gray-700 my-4"></div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-red-500">${total.toFixed(2)}</span>
            </div>

            <button 
              className="w-full bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              onClick={handleOrder}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              Proceed to Checkout
            </button>

            <Link 
              to="/products"
              className="w-full mt-4 border border-gray-600 text-gray-400 py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart 