import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TicketForm = ({ onSubmitSuccess = null }) => {
    const [formData, setFormData] = useState({
        account_number: '',
        category: '',
        subcategory: '',
        description: '',
        image: null
    });
    
    const [customers, setCustomers] = useState([]);
    const [categories, setCategories] = useState({});
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [ticketReference, setTicketReference] = useState('');

    // Fetch customers and categories on component mount
    useEffect(() => {
        fetchCustomers();
        fetchCategories();
    }, []);

    // Update subcategories when category changes
    useEffect(() => {
        if (formData.category && categories[formData.category]) {
            setSubcategories(categories[formData.category]);
            setFormData(prev => ({ ...prev, subcategory: '' }));
        } else {
            setSubcategories([]);
        }
    }, [formData.category, categories]);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('/api/public/tickets/customers');
            if (response.data.success) {
                setCustomers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/public/tickets/categories');
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const submitData = new FormData();
            submitData.append('account_number', formData.account_number);
            submitData.append('category', formData.category);
            submitData.append('subcategory', formData.subcategory);
            submitData.append('description', formData.description);
            
            if (formData.image) {
                submitData.append('image', formData.image);
            }

            const response = await axios.post('/api/public/tickets', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setSuccess(true);
                setTicketReference(response.data.ticket_reference);
                setFormData({
                    account_number: '',
                    category: '',
                    subcategory: '',
                    description: '',
                    image: null
                });
                
                // Reset file input
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';

                // Call success callback if provided
                if (onSubmitSuccess) {
                    onSubmitSuccess(response.data);
                }
            } else {
                setError(response.data.message || 'Failed to submit ticket');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error submitting ticket');
        } finally {
            setLoading(false);
        }
    };

    const getSelectedCustomer = () => {
        return customers.find(c => c.account_number === formData.account_number);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
            {success ? (
                <div className="text-center">
                    <div className="mb-4 text-green-600">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Submitted Successfully!</h3>
                    <p className="text-gray-600 mb-4">Your ticket reference number is:</p>
                    <p className="text-xl font-bold text-blue-600 mb-6">{ticketReference}</p>
                    <button
                        onClick={() => {
                            setSuccess(false);
                            setTicketReference('');
                        }}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Submit Another Ticket
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Submit a Ticket</h2>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Number *
                        </label>
                        <select
                            name="account_number"
                            value={formData.account_number}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Account Number</option>
                            {customers.map((customer) => (
                                <option key={customer.account_number} value={customer.account_number}>
                                    {customer.formatted_account} - {customer.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Category</option>
                            {Object.keys(categories).map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subcategory *
                        </label>
                        <select
                            name="subcategory"
                            value={formData.subcategory}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!formData.category}
                        >
                            <option value="">Select Subcategory</option>
                            {subcategories.map((subcategory) => (
                                <option key={subcategory} value={subcategory}>
                                    {subcategory}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Please describe your concern in detail..."
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Attach Image (Optional)
                        </label>
                        <input
                            type="file"
                            name="image"
                            onChange={handleInputChange}
                            accept="image/*"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Supported formats: JPG, PNG, GIF (max. 5MB)
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Submitting...
                                </div>
                            ) : (
                                'SUBMIT'
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Selected Customer Info */}
            {getSelectedCustomer() && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Selected Account:</h4>
                    <p className="text-blue-800">
                        <strong>{getSelectedCustomer().name}</strong><br />
                        Account: {getSelectedCustomer().formatted_account}
                    </p>
                </div>
            )}
        </div>
    );
};

export default TicketForm; 