import { useState } from 'react'
import { Link , useNavigate} from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // Clearing error when user types  
  }
   const handleRegister = async (formData) => {
    try{
      toast.loading('Registration successful')
      const response = await axios.post(`${import.meta.env.VITE_REACT_BASE_URL}/users/register`, formData)
      if(response.status === 201){
        navigate('/login')
        toast.success('Registration successful')
        toast.dismiss()
      }else{
        setError(response.data.message)
      }
    }catch(error){
      console.log(error)
    }
   }
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }
    
    // TODO: Handle registration logic here
    console.log('Form submitted:', formData)
    handleRegister(formData)
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-netflix-dark p-6 sm:p-8 rounded-lg shadow-xl">
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white text-center">
            Create your account
          </h2>
          <p className="text-sm sm:text-base text-netflix-gray text-center">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-netflix-red hover:text-red-700 transition-colors">
              Sign in
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
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-700 bg-gray-900 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-netflix-red transition-colors"
                placeholder="Full name"
              />
            </div>
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

          <div className="pt-2 sm:pt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 sm:py-3 text-sm sm:text-base font-medium text-white bg-netflix-red hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-netflix-red transition-colors"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register 