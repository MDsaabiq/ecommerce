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
      <div className="min-h-screen bg-netflix-black text-white">
        <Navbar />
        <main className="container mx-auto pt-20 px-6">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />

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
        <ToastContainer position="bottom-right" theme="dark" />
      </div>
    </BrowserRouter>
  )
}

export default App
