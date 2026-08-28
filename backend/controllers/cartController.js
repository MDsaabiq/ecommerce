const User = require('../models/UserModel');
const Product = require('../models/productModel');


// Create order from cart
const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate('cart.product');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.cart.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        let total = 0;
        const orderProducts = [];

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

            product.stockCount -= cartItem.quantity;
            await product.save();

            orderProducts.push({
                product: product._id,
                quantity: cartItem.quantity,
                price: product.price
            });

            total += product.price * cartItem.quantity;
        }

        const newOrder = {
            products: orderProducts,
            total,
            status: 'ordered',
            date: new Date()
        };

        user.orders.push(newOrder);
        user.cart = [];

        await user.save();

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
        const { productId } = req.body;
        const userId = req.user._id;
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stockCount < 1) {
            return res.status(400).json({ message: 'Product is out of stock' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const existingCartItem = user.cart.find(
            item => item.product.toString() === productId
        );

        if (existingCartItem) {
            if(product.stockCount == existingCartItem.quantity){
                return res.status(401).json({message:'Quantity excided to available'})
            }
            existingCartItem.quantity += 1;
        } else {
            user.cart.push({ product: productId });
        }

        await user.save();

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
        const userId = req.user._id;
        
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
        const userId = req.user._id;
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