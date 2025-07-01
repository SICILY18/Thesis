import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentHistory = ({ accountNumber }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    period: '',
    search: ''
  });

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.status !== 'All') params.append('status', filters.status);
      if (filters.period) params.append('period', filters.period);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/api/payment-history${accountNumber ? `/${accountNumber}` : ''}?${params.toString()}`);
      
      if (response.data.success) {
        setPayments(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch payment history');
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError(err.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending_validation':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-red-600 mb-2">Error loading payment history</div>
        <div className="text-sm text-gray-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value="All">All Status</option>
            <option value="pending_validation">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          <input
            type="month"
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />

          <input
            type="text"
            placeholder="Search by name or account number"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
      </div>

      {/* Payment History Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {payment.payment_reference}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.full_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {payment.account_number}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatAmount(payment.amount_paid)}
                  </div>
                  <div className="text-xs text-gray-500">
                    via {payment.payment_method}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(payment.payment_status)}`}>
                    {payment.payment_status?.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(payment.payment_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {payments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No payment history found
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory; 