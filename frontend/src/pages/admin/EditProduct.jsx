import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import axios from 'axios'

const EditProduct = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [product, setProduct] = useState(null)

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_REACT_BASE_URL}/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(() => { toast.error('Failed to fetch product'); navigate('/admin/products') })
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProduct(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return }
    const formData = new FormData()
    formData.append('image', file)
    setImageUploading(true)
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_REACT_BASE_URL}/upload`, formData)
      if (data.url) { setProduct(prev => ({ ...prev, image: data.url })); toast.success('Image uploaded') }
      else throw new Error()
    } catch { toast.error('Failed to upload image') }
    finally { setImageUploading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (imageUploading) { toast.warn('Please wait for image upload'); return }
    setLoading(true)
    try {
      await axios.put(`${import.meta.env.VITE_REACT_BASE_URL}/products/${id}`, { ...product, requesterId: user._id })
      toast.success('Product updated successfully!')
      navigate('/admin/products')
    } catch { toast.error('Failed to update product'); setLoading(false) }
  }

  if (!product) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Name</label>
          <input type="text" name="name" value={product.name} onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
          <textarea name="description" value={product.description} onChange={handleChange} rows="3"
            className="w-full p-3 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Price ($)</label>
            <input type="number" name="price" value={product.price} onChange={handleChange} step="0.01" min="0"
              className="w-full p-3 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Stock</label>
            <input type="number" name="stockCount" value={product.stockCount} onChange={handleChange} min="0"
              className="w-full p-3 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Category</label>
          <select name="category" value={product.category} onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white" required>
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
          {product.image && <img src={product.image} alt="Current" className="mb-2 h-20 w-20 object-cover rounded" />}
          <input type="file" accept="image/*" onChange={handleImageUpload}
            className="w-full p-2 rounded bg-gray-700 border-0 focus:ring-2 focus:ring-red-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700" />
          {imageUploading && <div className="text-gray-400 mt-2">Uploading image...</div>}
        </div>
        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => navigate('/admin/products')}
            className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">Cancel</button>
          <button type="submit" disabled={loading || imageUploading}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-md font-medium disabled:opacity-50 transition-colors">
            {loading ? 'Saving...' : imageUploading ? 'Uploading...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditProduct
