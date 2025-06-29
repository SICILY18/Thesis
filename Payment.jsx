import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';

const paymentData = [
  {
    id: 1,
    name: 'Liam Payne',
    avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
    amount: 344.00,
    status: 'Validated',
  },
  {
    id: 2,
    name: 'Carlos Sainz',
    avatar: 'https://randomuser.me/api/portraits/men/12.jpg',
    amount: 243.00,
    status: 'Pending',
  },
  {
    id: 3,
    name: 'Zayn Malik',
    avatar: 'https://randomuser.me/api/portraits/men/13.jpg',
    amount: 268.00,
    status: 'Validated',
  },
];

const summaryStats = [
  { label: 'Total Invoices', value: 168, icon: 'receipt_long', color: 'text-blue-600' },
  { label: 'Paid', value: 83, icon: 'check_circle', color: 'text-green-600' },
  { label: 'Unpaid', value: 85, icon: 'cancel', color: 'text-red-600' },
];

const statusColor = status => {
  if (status === 'Validated') return 'text-green-600';
  if (status === 'Pending') return 'text-gray-500';
  return 'text-red-600';
};

const Payment = () => {
    const [accountType, setAccountType] = useState('All');
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [error, setError] = useState(null);

    // Fetch all payments from the API
    useEffect(() => {
        fetchPayments();
    }, []);

    // Filter payments when accountType changes
    useEffect(() => {
        if (accountType === 'All') {
            setFilteredPayments(payments);
        } else {
            const filtered = payments.filter(payment => 
                payment.customer_type?.toLowerCase() === accountType.toLowerCase()
            );
            setFilteredPayments(filtered);
        }
    }, [accountType, payments]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('/api/payment-history');
            setPayments(response.data);
            setFilteredPayments(response.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setError('Failed to fetch payments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprovePayment = async (paymentId) => {
        try {
            setError(null);
            // Get CSRF token first
            await axios.get('/sanctum/csrf-cookie');
            
            // Make the approve request
            const response = await axios.post(`/api/payment-history/${paymentId}/validate`, {
                action: 'approve'
            });

            if (response.data.success) {
                // Refresh payments after successful approval
                fetchPayments();
            } else {
                setError('Failed to approve payment. Please try again.');
            }
        } catch (error) {
            console.error('Error approving payment:', error);
            setError(error.response?.data?.message || 'Failed to approve payment. Please try again.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-green-600';
            case 'pending_validation':
                return 'text-yellow-600';
            case 'processing':
                return 'text-blue-600';
            case 'rejected':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate total of approved payments only
    const totalApprovedPayments = filteredPayments
        .filter(payment => payment.payment_status === 'completed')
        .reduce((sum, payment) => sum + parseFloat(payment.amount_paid || 0), 0);

    return (
        <DynamicTitleLayout title="Payment Management">
            <div className="lg:ml-[240px] p-3 sm:p-4 md:p-6 lg:p-6 pt-16 lg:pt-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-semibold mb-6">Payment Management</h1>
                    
                    {error && (
                        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    {/* Filter Section */}
                    <div className="flex items-center mb-6 bg-gray-50 p-4 rounded-lg">
                        <label htmlFor="accountType" className="mr-2 font-medium text-gray-700">Filter by Account Type:</label>
                        <select
                            id="accountType"
                            value={accountType}
                            onChange={e => setAccountType(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                        >
                            <option value="All">All Accounts</option>
                            <option value="residential">Residential</option>
                            <option value="commercial">Commercial</option>
                            <option value="government">Government</option>
                        </select>
                        <span className="ml-4 text-sm text-gray-500">
                            Showing {filteredPayments.length} payments
                        </span>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-700">Total Approved Payments</h3>
                            <p className="text-2xl font-bold text-green-800">
                                ₱{totalApprovedPayments.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-blue-700">Pending Payments</h3>
                            <p className="text-2xl font-bold text-blue-800">
                                {filteredPayments.filter(p => p.payment_status === 'pending_validation').length}
                            </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-orange-700">Processing Payments</h3>
                            <p className="text-2xl font-bold text-orange-800">
                                {filteredPayments.filter(p => p.payment_status === 'processing').length}
                            </p>
                        </div>
                    </div>

                    {/* Payments Table */}
                    <div className="mt-8 flex flex-col">
                        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Customer</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Account Details</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                                            <span className="ml-2">Loading payments...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredPayments.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                                        No payments found for {accountType === 'All' ? 'any account type' : accountType + ' accounts'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredPayments.map((payment) => (
                                                    <tr key={payment.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {payment.full_name || 'N/A'}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {payment.customer_type?.toUpperCase() || 'RESIDENTIAL'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                Acc#: {payment.account_number}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                Ref: {payment.payment_reference}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                ₱{parseFloat(payment.amount_paid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Bill: ₱{parseFloat(payment.bill_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex text-sm ${getStatusColor(payment.payment_status)}`}>
                                                                {payment.payment_status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(payment.payment_date)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {payment.payment_status === 'pending_validation' && (
                                                                <button
                                                                    onClick={() => handleApprovePayment(payment.id)}
                                                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150"
                                                                >
                                                                    Approve
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DynamicTitleLayout>
    );
};

export default Payment; 