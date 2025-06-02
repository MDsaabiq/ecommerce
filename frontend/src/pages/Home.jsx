import { Link } from 'react-router-dom'

function Home() {
  // Sample featured collections - in real app, this would come from an API
  const collections = [
    {
      id: 1,
      title: "Summer Collection",
      image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
      description: "Latest summer trends"
    },
    {
      id: 2,
      title: "Electronics",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661",
      description: "Cutting-edge gadgets"
    },
    {
      id: 3,
      title: "Home & Living",
      image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a",
      description: "Make your home beautiful"
    }
  ]

  // Sample benefits - in real app, could be from CMS
  const benefits = [
    {
      id: 1,
      title: "Free Shipping",
      description: "On orders over $100",
      icon: "🚚"
    },
    {
      id: 2,
      title: "24/7 Support",
      description: "Always here to help",
      icon: "💬"
    },
    {
      id: 3,
      title: "Easy Returns",
      description: "30-day return policy",
      icon: "↩️"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center text-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8)',
            filter: 'brightness(0.6)'
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-white mb-6">
            Discover Your Style
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            Shop the latest trends in fashion, electronics, and home decor
          </p>
          <Link 
            to="/products" 
            className="inline-block bg-red-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {collections.map(collection => (
              <div 
                key={collection.id}
                className="group relative overflow-hidden rounded-lg cursor-pointer"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img 
                    src={collection.image} 
                    alt={collection.title}
                    loading='lazy'
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">{collection.title}</h3>
                    <p className="text-gray-200 text-sm">{collection.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map(benefit => (
              <div 
                key={benefit.id}
                className="text-center p-6 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 bg-gray-800">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-gray-400 mb-8">
            Subscribe to our newsletter for exclusive offers and updates
          </p>
          <form className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-l bg-gray-700 border-0 focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded-r hover:bg-red-700 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Home 