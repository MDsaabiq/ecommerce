import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

function Products() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const { user } = useSelector(state => state.auth)
  const navigate = useNavigate()

  async function fetchProducts() {
    try {
      setLoading(true)
      const response = await axios.get(`${import.meta.env.VITE_REACT_BASE_URL}/products`)
      setProducts(response.data)
      toast.success('Products loaded successfully', {
        toastId: 'products-success',
        autoClose: 2000,
        position: "top-right"
      })
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products', {
        toastId: 'products-error',
        autoClose: 3000,
        position: "top-right"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId) => {
    try {
      if (!user) {
        toast.error('Please login to add items to cart')
        navigate('/login')
        return
      }

      const response = await axios.post(`${import.meta.env.VITE_REACT_BASE_URL}/cart/add`, 
        { 
          productId,
          userId: user._id
        }
      )
      
      toast.success('Added to cart!')
    } catch (error) {
      console.error('Add to cart error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to add to cart'
      toast.error(errorMessage)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Hardcoded slider images
  const sliderImages = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661'
  ]

  // Simple slider state
  const [currentSlide, setCurrentSlide] = useState(0)

  // Hardcoded categories
  const categories = ['All', 'Electronics', 'Fashion', 'Books', 'Home', 'Sports']
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Hardcoded products
  // const products = [
  //   {
  //     id: 1,
  //     name: 'Wireless Headphones',
  //     price: 99.99,
  //     category: 'Electronics',
  //     image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'
  //   },
  //   {
  //     id: 2,
  //     name: 'Cotton T-Shirt',
  //     price: 29.99,
  //     category: 'Fashion',
  //     image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
  //   },
  //   {
  //     id: 3,
  //     name: 'Smart Watch',
  //     price: 199.99,
  //     category: 'Electronics',
  //     image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
  //   },
  //   {
  //     id: 4,
  //     name: 'Running Shoes',
  //     price: 89.99,
  //     category: 'Sports',
  //     image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'
  //   },
  //   {
  //     id: 5,
  //     name: 'Desk Lamp',
  //     price: 39.99,
  //     category: 'Home',
  //     image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c'
  //   },
  //   {
  //     id: 6,
  //     name: 'Novel Book',
  //     price: 19.99,
  //     category: 'Books',
  //     image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f'
  //   }
  // ]

  // Next slide function
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
  }

  // Previous slide function
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length)
  }

  // Filter products by category
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(product => product.category === selectedCategory)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Image Slider */}
      <div className="relative h-[400px] mb-12 rounded-xl overflow-hidden">
        {/* Slider images */}
        {sliderImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out
              ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        
        {/* Slider controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
        >
          ←
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
        >
          →
        </button>

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors
                ${index === currentSlide ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors
              ${selectedCategory === category 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div 
            key={product._id}
            className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">${product.price}</span>
                <button 
                  onClick={() => handleAddToCart(product._id)}
                  disabled={product.stockCount < 1}
                  className={`px-4 py-2 rounded transition-colors ${
                    product.stockCount < 1 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {product.stockCount < 1 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Products 