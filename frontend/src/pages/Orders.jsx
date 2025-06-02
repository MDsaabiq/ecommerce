import React, {useState, useEffect} from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
    const { user } = useSelector((state) => state.auth);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?._id) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${import.meta.env.VITE_REACT_BASE_URL}/cart/orders/${user._id}`);
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Failed to fetch orders. Please try again later.');
        } finally {
            setLoading(false);
        }
    };   

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    <div className="h-8 w-48 bg-gray-700 rounded"></div>
                    <div className="h-4 w-32 bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-xl text-red-500">{error}</p>
                    <button 
                        onClick={fetchOrders}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        Order History
                    </h1>
                    <div className="text-sm text-gray-400">
                        Total Orders: {orders.length}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-10 md:gap-6 gap-4">
                    {orders.map((order, index) => (
                        <div 
                            key={index}
                            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                        >
                            <div className="flex flex-col md:flex-row lg:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        Order #{index + 1}
                                    </h2>
                                    <p className="text-gray-400 mt-1">
                                        {new Date(order.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <span className="px-4 py-2 bg-green-600 rounded-full text-sm font-medium shadow-lg">
                                    {order.status}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {order.products.map((item, itemIndex) => (
                                    <div 
                                        key={itemIndex}
                                        className="flex items-center space-x-4 bg-gray-700/50 p-4 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-medium text-lg">
                                                {item.product?.name || 'Product'}
                                            </h3>
                                            <p className="text-gray-400 mt-1">
                                                Quantity: {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-lg">
                                                ${item.price.toFixed(2)}
                                            </p>
                                            <p className="text-gray-400 mt-1">
                                                Total: ${(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-lg">Total Amount</span>
                                    <span className="text-2xl font-bold text-white">
                                        ${order.total.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {orders.length === 0 && (
                        <div className="text-center py-16 bg-gray-800 rounded-xl">
                            <div className="text-6xl mb-4">📦</div>
                            <p className="text-gray-400 text-xl">
                                No orders found
                            </p>
                            <p className="text-gray-500 mt-2">
                                Your order history will appear here
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Orders;
