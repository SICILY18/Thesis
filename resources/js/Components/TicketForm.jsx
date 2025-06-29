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
            console.error('Error submitting ticket:', error);
            setError('Failed to submit ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getSelectedCustomer = () => {
        return customers.find(customer => customer.account_number === formData.account_number);
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Submitted Successfully!</h3>
                    <p className="text-gray-600 mb-4">
                        Your ticket has been submitted with reference number:
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mb-4">{ticketReference}</p>
                    <p className="text-sm text-gray-500 mb-6">
                        Please keep this reference number for your records. We will contact you soon regarding your concern.
                    </p>
                    <button
                        onClick={() => {
                            setSuccess(false);
                            setTicketReference('');
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Submit Another Ticket
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Send Ticket</h2>
                <p className="text-gray-600 mt-2">Submit your concern and we'll get back to you soon</p>
            </div>

            {error && (
                <div className="mb-4 p-4 border border-red-200 rounded-md bg-red-50">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                            <option key={customer.id} value={customer.account_number}>
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

                {/* Particular Concern (Subcategory) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Particular Concern *
                    </label>
                    <select
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.category}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">Select Particular Concern</option>
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
                        Tell us about your concern.
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows="4"
                        placeholder="Description *"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Image (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <input
                            type="file"
                            name="image"
                            onChange={handleInputChange}
                            accept="image/*"
                            className="hidden"
                            id="image-upload"
                        />
                        <label
                            htmlFor="image-upload"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                            UPLOAD IMAGE
                        </label>
                        {formData.image && (
                            <p className="mt-2 text-sm text-gray-600">
                                Selected: {formData.image.name}
                            </p>
                        )}
                    </div>
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