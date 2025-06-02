import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import axios from 'axios'

const CreateProduct = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    stockCount: ''
  })

  // Get user from Redux state
  const { user } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    const { name, value } = e.target
    setProduct(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    const formData = new FormData()
    formData.append('image', file)
    setImageUploading(true)

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_REACT_BASE_URL}/upload`, formData)
      if (data.url) {
        setProduct(prev => ({ ...prev, image: data.url }))
        toast.success('Image uploaded successfully')
      } else {
        throw new Error('No image URL received')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
      setProduct(prev => ({ ...prev, image: '' }))
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?._id) {
      toast.error('Please login first')
      navigate('/login')
      return
    }

    if (imageUploading) {
      toast.warn('Please wait for image upload to complete')
      return
    }
    setLoading(true)

    try {
      // Include owner ID from Redux state
      const productData = {
        ...product,
        owner: user._id
      }
      await axios.post(`${import.meta.env.VITE_REACT_BASE_URL}/products`, productData)
      toast.success('Product created successfully!')
      navigate('/admin/products')
    } catch (error) {
      console.error('Create product error:', error)
      toast.error('Failed to create product')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Create Product</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Name</label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleChange}
            rows="3"
            className="w-full p-3 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Price ($)</label>
            <input
              type="number"
              name="price"
              value={product.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full p-3 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Stock</label>
            <input
              type="number"
              name="stockCount"
              value={product.stockCount}
              onChange={handleChange}
              min="0"
              className="w-full p-3 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Category</label>
          <select
            name="category"
            value={product.category}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white"
            required
          >
            <option value="">Select category</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
            <option value="Home">Home & Living</option>
            <option value="Sports">Sports</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-2 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700"
            required
          />
          {imageUploading && (
            <div className="text-gray-400 mt-2">Uploading image...</div>
          )}
          {product.image && (
            <img 
              src={product.image} 
              alt="Preview" 
              className="mt-2 h-20 w-20 object-cover rounded"
            />
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || imageUploading}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-md font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : imageUploading ? 'Uploading...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateProduct 