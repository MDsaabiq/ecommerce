const User = require('../models/UserModel');
const Product = require('../models/productModel');


// Create order from cart
const createOrder = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Find user and populate cart with product details
        const user = await User.findById(userId).populate('cart.product');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.cart.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate total and prepare order products
        let total = 0;
        const orderProducts = [];

        // Verify stock and update products
        for (const cartItem of user.cart) {
            const product = await Product.findById(cartItem.product._id);
            
            if (!product) {
                return res.status(404).json({ 
                    message: `Product ${cartItem.product.name} not found` 
                });
            }

            if (product.stockCount < cartItem.quantity) {
                return res.status(400).json({ 
                    message: `Not enough stock for ${product.name}. Available: ${product.stockCount}` 
                });
            }

            // Update product stock
            product.stockCount -= cartItem.quantity;
            await product.save();

            // Add to order products array
            orderProducts.push({
                product: product._id,
                quantity: cartItem.quantity,
                price: product.price
            });

            total += product.price * cartItem.quantity;
        }

        // Create new order
        const newOrder = {
            products: orderProducts,
            total,
            status: 'ordered',
            date: new Date()
        };

        // Add order to user's orders array
        user.orders.push(newOrder);
        
        // Clear the cart
        user.cart = [];

        await user.save();

        // Populate the order products for response
        await user.populate('orders.products.product');

        res.json({
            message: 'Order created successfully',

        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
};

// Add to cart
const addToCart = async (req, res) => {
    try {
        const { productId, userId } = req.body;
        if (!userId || !productId) {
            return res.status(400).json({ message: 'User ID and Product ID are required' });
        }

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if product is in stock
        if (product.stockCount < 1) {
            return res.status(400).json({ message: 'Product is out of stock' });
        }

        // Find user and update cart
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if product already in cart
        const existingCartItem = user.cart.find(
            item => item.product.toString() === productId
        );

        if (existingCartItem) {
            // Increment quantity if already in cart
            if(product.stockCount == existingCartItem.quantity){
                return res.status(401).json({message:'Quantity excided to available'})
            }
            existingCartItem.quantity += 1;
        } else {
            // Add new item to cart
            user.cart.push({ product: productId });
        }

        await user.save();

        // Populate the cart items with product details
        await user.populate('cart.product');

        res.json({ 
            message: 'Product added to cart',
            cart: user.cart
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ message: 'Failed to add to cart' });
    }
};

// Get cart items
const getCart = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        const user = await User.findById(userId).populate('cart.product');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user.cart);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'Failed to get cart items' });
    }
};

const fetchOrders = async (req, res) => {
    try{
        const {userId} = req.params;
        if(!userId){
            return res.status(400).json({message:'User ID is required'})
        }
        const user = await User.findById(userId).populate('orders.products.product');
        if(!user){
            return res.status(404).json({message:'User not found'})
        }
        res.json(user.orders)
    }catch(error){
        console.error('Error fetching orders:', error)
        res.status(500).json({message:'Failed to fetch orders'})
    }
}

module.exports = { addToCart, getCart,createOrder,fetchOrders }; 