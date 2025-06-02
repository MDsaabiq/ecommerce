const express = require('express');
const router = express.Router();
const { addToCart, getCart,createOrder,fetchOrders } = require('../controllers/cartController');


router.post('/add', addToCart);
router.get('/:userId', getCart);
router.post('/order', createOrder);
router.get('/orders/:userId', fetchOrders);

module.exports = router; 