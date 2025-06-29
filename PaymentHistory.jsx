import React, { useState, useEffect } from 'react';
import { paymentHistoryAPI } from '@/utils/api';

const PaymentHistory = ({ accountNumber }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (accountNumber) {
      fetchPaymentHistory();
    }
  }, [accountNumber]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentHistoryAPI.getCustomerPaymentHistory(accountNumber);
      
      if (response.success) {
        setPayments(response.data);
      } else {
        setError(response.message || 'Failed to fetch payment history');
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('Unable to fetch payment history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    switch (status.toLowerCase()) {
      case 'pending_validation':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending_validation':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="h-5 w-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
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

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading payment history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
      </div>

      {payments.length === 0 ? (
        <div className="p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payment history</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't made any payments yet.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {payments.map((payment) => (
            <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(payment.payment_status)}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {payment.bill_type.charAt(0).toUpperCase() + payment.bill_type.slice(1)} Bill - {payment.billing_period}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Reference: {payment.payment_reference}
                    </p>
                  </div>
                </div>
                <span className={getStatusBadge(payment.payment_status)}>
                  {payment.payment_status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Amount Paid:</span>
                  <div className="font-medium text-gray-900">
                    {formatCurrency(payment.amount_paid)}
                  </div>
                  {payment.bill_amount && (
                    <div className="text-xs text-gray-500">
                      Bill Amount: {formatCurrency(payment.bill_amount)}
                    </div>
                  )}
                </div>
                
                <div>
                  <span className="text-gray-500">Payment Method:</span>
                  <div className="font-medium text-gray-900 capitalize">
                    {payment.payment_method}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(payment.payment_date)}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="font-medium text-gray-900">
                    {payment.payment_status === 'pending_validation' && 'Awaiting Validation'}
                    {payment.payment_status === 'processing' && 'Processing'}
                    {payment.payment_status === 'completed' && 'Payment Confirmed'}
                    {payment.payment_status === 'rejected' && 'Payment Rejected'}
                  </div>
                  {payment.due_date && (
                    <div className="text-xs text-gray-500">
                      Due: {new Date(payment.due_date).toLocaleDateString('en-PH')}
                    </div>
                  )}
                </div>
              </div>

              {payment.admin_notes && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-500">Admin Notes:</span>
                  <div className="font-medium text-gray-900">{payment.admin_notes}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={fetchPaymentHistory}
          className="text-sm text-blue-600 hover:text-blue-500 font-medium"
        >
          Refresh Payment History
        </button>
      </div>
    </div>
  );
};

export default PaymentHistory; 