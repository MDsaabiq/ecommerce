import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'

const ViewProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_BASE_URL}/products`)
      setProducts(response.data)
      setLoading(false)
    } catch (error) {
      toast.error('Failed to fetch products')
      setLoading(false)
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      await axios.delete(`${import.meta.env.VITE_REACT_BASE_URL}/products/${productId}`)
      toast.success('Product deleted successfully')
      fetchProducts() // Refresh the list
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-4">No Products Found</h3>
        <p className="text-gray-400 mb-6">Start by adding your first product</p>
        <Link 
          to="/admin/create" 
          className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Product
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Products</h2>
        <Link 
          to="/admin/create" 
          className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product._id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-48 object-cover" 
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xl font-bold">${product.price}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  product.stockCount > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {product.stockCount > 0 ? `${product.stockCount} in stock` : 'Out of stock'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <button 
                  onClick={() => handleDelete(product._id)}
                  className="flex-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
                <Link 
                  to={`/admin/edit/${product._id}`}
                  className="flex-1 px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 text-center transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ViewProducts 