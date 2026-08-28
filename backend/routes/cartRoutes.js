const express = require('express');
const router = express.Router();
const { addToCart, getCart, removeFromCart, createOrder, fetchOrders } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');


router.post('/add', protect, addToCart);
router.post('/remove', protect, removeFromCart);
router.get('/', protect, getCart);
router.post('/order', protect, createOrder);
router.get('/orders', protect, fetchOrders);

module.exports = router; 