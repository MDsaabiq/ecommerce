const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // fields go here
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    // Products array for admin users (using refs)
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    // Orders array for normal users
    orders: [{
        products: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            quantity: Number,
            price: Number
        }],
        total: Number,
        status: {
            type: String,
            default: 'pending'
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            default: 1
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);    