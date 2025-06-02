import { NavLink, Outlet } from 'react-router-dom'

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex gap-4 mb-6">
        <NavLink 
          to="create" 
          className={({ isActive }) => 
            `px-4 py-2 rounded ${isActive ? 'bg-red-600' : 'bg-gray-700 hover:bg-red-600'}`
          }
        >
          Create Product
        </NavLink>
        <NavLink 
          to="products" 
          className={({ isActive }) => 
            `px-4 py-2 rounded ${isActive ? 'bg-red-600' : 'bg-gray-700 hover:bg-red-600'}`
          }
        >
          View Products
        </NavLink>
      </div>
      <div className="mt-4 mb-4">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminDashboard 