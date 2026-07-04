const express = require('express');
const router = express.Router();
const { addToCart, getCart, createOrder, fetchOrders, removeFromCart } = require('../controllers/cartController');

router.post('/add', addToCart);
router.post('/remove', removeFromCart);
router.post('/order', createOrder);
router.get('/orders/:userId', fetchOrders);
router.get('/:userId', getCart);

module.exports = router;