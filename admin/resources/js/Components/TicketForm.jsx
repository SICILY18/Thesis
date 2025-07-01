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

    useEffect(() => {
        fetchCustomers();
        fetchCategories();
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        const data = new FormData();
        data.append('account_number', formData.account_number);
        data.append('category', formData.category);
        data.append('subcategory', formData.subcategory);
        data.append('description', formData.description);
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            const response = await axios.post('/api/tickets', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setSuccess(true);
                setTicketReference(response.data.data.ticket_reference);
                setFormData({
                    account_number: '',
                    category: '',
                    subcategory: '',
                    description: '',
                    image: null
                });
                if (onSubmitSuccess) {
                    onSubmitSuccess();
                }
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to submit ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 2 * 1024 * 1024) {
            setError('Image size should not exceed 2MB');
            return;
        }
        setFormData(prev => ({ ...prev, image: file }));
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a Ticket</h2>

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-600">
                        Ticket submitted successfully! Reference: {ticketReference}
                    </p>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Account Number
                    </label>
                    <select
                        value={formData.account_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select Account Number</option>
                        {customers.map(customer => (
                            <option key={customer.account_number} value={customer.account_number}>
                                {customer.account_number} - {customer.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Category
                    </label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select Category</option>
                        {Object.keys(categories).map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Subcategory
                    </label>
                    <select
                        value={formData.subcategory}
                        onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={!formData.category}
                    >
                        <option value="">Select Subcategory</option>
                        {subcategories.map(subcategory => (
                            <option key={subcategory} value={subcategory}>{subcategory}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Attach Image (optional, max 2MB)
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Submitting...' : 'Submit Ticket'}
                </button>
            </form>
        </div>
    );
};

export default TicketForm; 