import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports']

const sliderImages = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=80',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1400&q=80',
  'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1400&q=80',
]

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selected, setSelected] = useState(null)
  const [visible, setVisible] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const sliderRef = useRef(null)

  const { user } = useSelector(state => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_REACT_BASE_URL}/products`)
      .then(res => setProducts(res.data))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false))
  }, [])

  // Auto-advance slider
  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % sliderImages.length), 4000)
    return () => clearInterval(t)
  }, [])

  const openModal = (product) => {
    if (!user) { navigate('/login'); return }
    setSelected(product)
    // tiny delay so the element is mounted before animating in
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }

  const closeModal = () => {
    setVisible(false)
    setTimeout(() => setSelected(null), 300)
  }

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return }
    setAddingToCart(true)
    try {
      await axios.post(`${import.meta.env.VITE_REACT_BASE_URL}/cart/add`, {
        productId: selected._id,
        userId: user._id,
      })
      toast.success('Added to cart!')
      closeModal()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const filtered = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory)

  return (
    <div className="container mx-auto px-4 py-8">

      {/* ── Slider ── */}
      <div className="relative h-64 sm:h-80 md:h-[400px] mb-10 rounded-2xl overflow-hidden shadow-2xl">
        {sliderImages.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <button onClick={() => setCurrentSlide(p => (p - 1 + sliderImages.length) % sliderImages.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors">
          ‹
        </button>
        <button onClick={() => setCurrentSlide(p => (p + 1) % sliderImages.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors">
          ›
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {sliderImages.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-4' : 'bg-white/40'}`} />
          ))}
        </div>
      </div>

      {/* ── Category Pills ── */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium transition-colors ${selectedCategory === cat ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-20">No products found in this category.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 items-start">
          {filtered.map(product => (
            <div
              key={product._id}
              onClick={() => openModal(product)}
              className="bg-gray-800 rounded-xl cursor-pointer group hover:ring-2 hover:ring-red-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl flex flex-col h-72"
            >
              {/* Fixed-height image — overflow clipped only on image wrapper */}
              <div className="h-44 overflow-hidden flex-shrink-0 rounded-t-xl">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Card body — fixed height remainder so all cards are identical */}
              <div className="p-3 flex flex-col flex-1">
                <p className="text-xs text-red-400 font-medium mb-1">{product.category}</p>
                <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 flex-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-base font-bold text-white">${product.price}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${product.stockCount > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {product.stockCount > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Full-View Modal ── */}
      {selected && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${visible ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/0'}`}
          onClick={closeModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            className={`bg-gray-900 rounded-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col md:flex-row shadow-2xl transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          >
            {/* Image side */}
            <div className="md:w-1/2 h-64 md:h-auto flex-shrink-0 relative">
              <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent md:bg-gradient-to-r" />
            </div>

            {/* Info side */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <button onClick={closeModal} className="self-end text-gray-400 hover:text-white mb-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <span className="text-xs text-red-400 font-semibold uppercase tracking-widest mb-2">{selected.category}</span>
              <h2 className="text-2xl font-bold text-white mb-3">{selected.name}</h2>
              <p className="text-3xl font-bold text-white mb-4">${selected.price}</p>

              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-6">{selected.description}</p>

              <div className="flex items-center gap-3 mb-6">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${selected.stockCount > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {selected.stockCount > 0 ? `${selected.stockCount} in stock` : 'Out of stock'}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={selected.stockCount < 1 || addingToCart}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${selected.stockCount < 1 ? 'bg-gray-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:scale-95'} disabled:opacity-60`}
              >
                {addingToCart ? 'Adding...' : selected.stockCount < 1 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
