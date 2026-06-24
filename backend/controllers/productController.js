const Product = require('../models/productModel');





// Get all products (filtered by owner if userId query param provided)
const getProducts = async (req, res) => {
    try {
        const filter = req.query.userId ? { owner: req.query.userId } : {};
        const products = await Product.find(filter);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Create product (admin only)
const createProduct = async (req, res) => {
    try {
        console.log(req)
        const product = await Product.create({
            ...req.body,
            owner: req.body.owner
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({ message: error.message });
    }
}

// Update product (admin only - owner only)
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.owner.toString() !== req.body.requesterId)
            return res.status(403).json({ message: 'Not authorized to edit this product' });
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Delete product (admin only - owner only)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.owner.toString() !== req.query.requesterId)
            return res.status(403).json({ message: 'Not authorized to delete this product' });
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { getProducts, createProduct, updateProduct, deleteProduct }; 