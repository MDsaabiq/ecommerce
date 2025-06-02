import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import CreateProduct from './pages/admin/CreateProduct'
import ViewProducts from './pages/admin/ViewProducts'
import './App.css'
import Orders from './pages/Orders'
import ProductDetails from './pages/ProductDetails'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'

const ProtectedAdminRoute = ({ children }) => {
  const { user } = useSelector(state => state.auth)
  
  if (!user || !user.isAdmin) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetails />} />

            {/* Protected User Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<Navigate to="products" replace />} />
              <Route path="products" element={<ViewProducts />} />
              <Route path="create" element={<CreateProduct />} />
            </Route>

            {/* Redirect root to admin dashboard if logged in as admin */}
            <Route 
              path="/" 
              element={<Navigate to="/admin" replace />} 
            />
          </Routes>
        </main>
        <footer className="bg-gray-900 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold">E-Commerce Platform</h3>
                <p className="text-gray-400 mt-2">Built with React, Node.js, and MongoDB</p>
              </div>
              <div className="flex space-x-6">
                <a 
                  href="https://github.com/MDsaabiq/ecommerce" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a 
                  href="mailto:saabiqcs@gmail.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} E-Commerce Platform. All rights reserved.</p>
            </div>
          </div>
        </footer>
        <ToastContainer />
      </div>
    </BrowserRouter>
  )
}

export default App
