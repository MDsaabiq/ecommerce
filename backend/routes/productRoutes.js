const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { getProducts, createProduct, deleteProduct } = require('../controllers/productController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.get('/', getProducts);
router.post('/', upload.single('image'), createProduct);
router.delete('/:id', deleteProduct);

module.exports = router; 