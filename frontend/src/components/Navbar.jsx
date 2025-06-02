import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'

function Navbar() {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  console.log(user);
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-netflix-black bg-opacity-95 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-netflix-red">E-Shop</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link to="/products" className="text-netflix-gray hover:text-white transition-colors">
                  Products
                </Link>
                <Link to="/cart" className="text-netflix-gray hover:text-white transition-colors">
                  Cart
                </Link>
                <Link to="/orders" className="text-netflix-gray hover:text-white transition-colors">
                  Orders
                </Link>
                {user.isAdmin && (
                  <Link to="/admin" className="text-netflix-gray hover:text-white transition-colors">
                    Dashboard
                  </Link>
                )}
                <button 
                  onClick={() => dispatch(logout())}
                  className="bg-netflix-red text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-netflix-gray hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register"
                  className="bg-netflix-red text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 