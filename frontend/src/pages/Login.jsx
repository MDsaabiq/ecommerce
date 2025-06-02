import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../store/slices/authSlice'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // Clearing error when user types
  }

  //handle login
  const handleLogin = async (formData) => {
    const toastId = toast.loading('Logging in...')
    try {
      const response = await axios.post(`${import.meta.env.VITE_REACT_BASE_URL}/users/login`, formData)
      
      if (response.status === 200) {
        const { token, user } = response.data
        dispatch(loginSuccess({ token, user }))
        
        toast.update(toastId, {
          render: "Login successful",
          type: "success",
          isLoading: false,
          autoClose: 2000,
          closeOnClick: true
        })

        // Navigate based on user role
        if (user.isAdmin) {
          navigate('/admin')
        } else {
          navigate('/')
        }
      }
    } catch (error) {
      console.log(error)
      toast.update(toastId, {
        render: error.response?.data?.message || "Login failed",
        type: "error",
        isLoading: false,
        autoClose: 1000,
        closeOnClick: true
      })
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    handleLogin(formData)
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-netflix-dark p-6 sm:p-8 rounded-lg shadow-xl">
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white text-center">
            Welcome back
          </h2>
          <p className="text-sm sm:text-base text-netflix-gray text-center">
            New to E-Shop?{' '}
            <Link to="/register" className="font-medium text-netflix-red hover:text-red-700 transition-colors">
              Sign up now
            </Link>
          </p>
        </div>

        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-sm sm:text-base text-red-500 text-center p-2 bg-red-500/10 rounded">
              {error}
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-700 bg-gray-900 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-netflix-red transition-colors"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-700 bg-gray-900 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-netflix-red transition-colors"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm sm:text-base">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 text-netflix-red focus:ring-netflix-red border-gray-700 rounded bg-gray-900"
              />
              <label htmlFor="remember" className="ml-2 block text-netflix-gray">
                Remember me
              </label>
            </div>
            <div className="text-netflix-gray hover:text-white transition-colors">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>

          <div className="pt-2 sm:pt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 sm:py-3 text-sm sm:text-base font-medium text-white bg-netflix-red hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-netflix-red transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login 