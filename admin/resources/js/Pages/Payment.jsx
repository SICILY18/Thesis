import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, usePage, router } from '@inertiajs/react';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';
import TicketCount from '@/Components/TicketCount';

const Payment = () => {
  const { auth } = usePage().props;
  const [profilePicture, setProfilePicture] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('All Accounts');
  const [customerAddress, setCustomerAddress] = useState('');
  const [stats, setStats] = useState({
    total_amount: 0,
    pending_count: 0,
    partial_count: 0
  });

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    const fetchProfileData = async () => {
      try {
        const response = await axios.get('/api/admin/profile');
        if (response.data?.success && response.data?.data?.profile_picture) {
          setProfilePicture(response.data.data.profile_picture);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfileData();
    fetchPayments();
    fetchStats();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, accountTypeFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/payment-history');
      
      if (response.data.success) {
        setPayments(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch payments');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/payment-history/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const filterPayments = () => {
    console.log('Filtering payments with filter:', accountTypeFilter);
    console.log('Total payments:', payments.length);
    
    if (accountTypeFilter === 'All Accounts') {
      setFilteredPayments(payments);
    } else {
      const filtered = payments.filter(payment => {
        // Only use actual customer_type from database
        let customerType = payment.customer_type;
        
        // Skip payments without customer_type (like Admin accounts)
        if (!customerType) {
          return false;
        }
        
        // Normalize both values to lowercase for comparison
        const normalizedCustomerType = customerType.toLowerCase().trim();
        const normalizedFilter = accountTypeFilter.toLowerCase().trim();
        
        console.log(`Payment ${payment.id}: customer_type='${payment.customer_type}', normalized='${normalizedCustomerType}', filter='${normalizedFilter}', match=${normalizedCustomerType === normalizedFilter}`);
        
        return normalizedCustomerType === normalizedFilter;
      });
      
      console.log('Filtered results:', filtered.length);
      setFilteredPayments(filtered);
    }
  };

  const fetchCustomerDetails = async (accountNumber) => {
    try {
      const response = await axios.get(`/api/customers/${accountNumber}`);
      if (response.data?.success && response.data?.data) {
        setCustomerAddress(response.data.data.address || 'No address provided');
      } else {
        setCustomerAddress('No customer data available');
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      if (error.response?.status === 404) {
        setCustomerAddress('Customer not found');
      } else if (error.response?.status === 500) {
        setCustomerAddress('Error loading customer data');
        // Log the actual error for debugging
        console.error('Server error details:', error.response?.data);
      } else {
        setCustomerAddress('Unable to load address');
      }
    }
  };

  const handlePaymentSelect = (payment) => {
    setSelectedPayment(payment);
    setCustomerAddress('Loading...'); // Show loading state
    fetchCustomerDetails(payment.account_number);
  };

  const handleValidation = async (paymentId, action) => {
    try {
      setLoading(true);
      setError(null);

      // Get the CSRF token from the meta tag
      const token = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      // Set up axios defaults for this request
      const instance = axios.create({
        withCredentials: true,
        headers: {
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Make the request
      const response = await instance.post(`/api/bill-payment-validation/${paymentId}/validate`, {
        action: action === 'approve' ? 'approve' : 'reject',
        admin_notes: adminNotes
      });

      if (response.data.success) {
        alert(`Payment ${action}d successfully`);
        fetchPayments();
        fetchStats();
        setSelectedPayment(null);
        setAdminNotes('');
      } else {
        throw new Error(response.data.message || `Failed to ${action} payment`);
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError(err.response?.data?.message || err.message || `Failed to ${action} payment`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'pending_validation': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    const statusDisplayMap = {
      'pending_validation': 'PENDING VALIDATION',
      'processing': 'PENDING VALIDATION',
      'completed': 'COMPLETED',
      'rejected': 'REJECTED'
    };
    
    const style = statusStyles[status] || 'bg-gray-100 text-gray-800';
    const displayText = statusDisplayMap[status] || status?.replace('_', ' ').toUpperCase() || 'UNKNOWN';
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style}`}>
        {displayText}
      </span>
    );
  };

  const getPaymentTypeBadge = (method) => {
    const methodStyles = {
      'GCASH': 'bg-blue-100 text-blue-800',
      'MAYA': 'bg-purple-100 text-purple-800',
      'CASH': 'bg-green-100 text-green-800',
      'BANK_TRANSFER': 'bg-gray-100 text-gray-800'
    };
    
    const style = methodStyles[method?.toUpperCase()] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style}`}>
        {method?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DynamicTitleLayout userRole="admin">
      <div className="min-h-screen bg-[#60B5FF] font-[Poppins] overflow-x-hidden">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full w-[240px] bg-white shadow-lg transform transition-transform duration-200 lg:translate-x-0 md:translate-x-0 -translate-x-full flex flex-col">
          <div className="p-3 flex-shrink-0">
            <img src="https://i.postimg.cc/fTdMBwmQ/hermosa-logo.png" alt="Logo" className="w-50 h-50 mx-auto mb-3" />
          </div>
          <nav className="flex flex-col flex-1 overflow-y-auto">
            <div className="flex-1 pb-4">
              <Link href="/admin/dashboard" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">dashboard</span>
                Dashboard
              </Link>
              <Link href="/admin/announcement" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/announcement' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">campaign</span>
                Announcement
              </Link>
              <Link href="/admin/accounts" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/accounts' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">manage_accounts</span>
                Manage Accounts
              </Link>
              <Link href="/admin/rate-management" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/rate-management' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">price_change</span>
                Rate Management
              </Link>
              <Link href="/admin/payment" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/payment' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">payments</span>
                Payment
              </Link>
              <Link href="/admin/reports" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/reports' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">description</span>
                Reports
              </Link>
              <Link href="/admin/tickets" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/tickets' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">confirmation_number</span>
                <div className="flex items-center">
                    Tickets
                    <TicketCount />
                </div>
              </Link>
              <Link href="/admin/dispute" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/dispute' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">gavel</span>
                Dispute
              </Link>
              <Link href="/admin/sms-configuration" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/sms-configuration' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">sms</span>
                SMS Configuration
              </Link>
              <Link href="/admin/profile" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">person</span>
                Profile
              </Link>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center px-6 py-3 text-base text-gray-600 hover:text-red-600 hover:bg-red-50 w-full text-left"
              >
                <span className="material-symbols-outlined mr-3">logout</span>
                Logout
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:ml-[240px] p-3 sm:p-4 md:p-6 lg:p-6 pt-16 lg:pt-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{auth?.user?.name}</span>
              <Link href="/admin/profile">
                <img 
                  src={profilePicture || `https://ui-avatars.com/api/?name=${auth?.user?.name || 'Admin'}&background=0D8ABC&color=fff`}
                  alt="Profile" 
                  className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
                />
              </Link>
            </div>
          </div>

          {/* Filter and Count */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-900">Filter by Account Type:</label>
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-white shadow-sm min-w-[140px]"
              >
                <option value="All Accounts">All Accounts</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="government">Government</option>
              </select>
            </div>
            <div className="text-sm text-gray-900 font-medium">
              Showing {filteredPayments.length} payments
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Payments</dt>
                    <dd className="text-lg font-medium text-green-900">{formatAmount(stats.total_amount)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
                    <dd className="text-lg font-medium text-blue-900">{stats.pending_count}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Partial Payments</dt>
                    <dd className="text-lg font-medium text-orange-900">{stats.partial_count}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.customer_type ? payment.customer_type.toUpperCase() : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Acc#: {payment.account_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            Ref: {payment.payment_reference}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatAmount(payment.amount_paid)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Bill: {formatAmount(payment.bill_amount)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentTypeBadge(payment.payment_method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.payment_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 justify-end">
                          {(payment.payment_status === 'processing' || payment.payment_status === 'pending_validation') && (
                            <button
                              onClick={() => handleValidation(payment.id, 'approve')}
                              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-20"
                              disabled={loading}
                            >
                              Approve
                            </button>
                          )}
                          {payment.payment_status === 'completed' && (
                            <button
                              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-gray-500 cursor-default w-20"
                              disabled
                            >
                              Approved
                            </button>
                          )}
                          <button
                            onClick={() => handlePaymentSelect(payment)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPayments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No payments found
                </div>
              )}
            </div>
          </div>

          {/* Payment Details Modal */}
          {selectedPayment && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Payment Details
                        </h3>
                        <div className="mt-4">
                          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Reference</p>
                                <p className="text-sm text-gray-900 break-all">{selectedPayment.payment_reference}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Account</p>
                                <p className="text-sm text-gray-900">{selectedPayment.account_number}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Customer</p>
                                <p className="text-sm text-gray-900">{selectedPayment.full_name}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Amount</p>
                                <p className="text-sm text-gray-900">{formatAmount(selectedPayment.amount_paid)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Method</p>
                                <p className="text-sm text-gray-900">{selectedPayment.payment_method}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                                <p className="text-sm text-gray-900">{selectedPayment.payment_status}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
                                <p className="text-sm text-gray-900">{customerAddress}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Payment Date</p>
                                <p className="text-sm text-gray-900">{formatDate(selectedPayment.payment_date)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Validation Date</p>
                                <p className="text-sm text-gray-900">{selectedPayment.payment_status === 'completed' ? formatDate(selectedPayment.updated_at) : 'Not yet validated'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    {(selectedPayment.payment_status === 'processing' || selectedPayment.payment_status === 'pending_validation') && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleValidation(selectedPayment.id, 'approve')}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleValidation(selectedPayment.id, 'reject')}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={() => {
                          setSelectedPayment(null);
                          setCustomerAddress('');
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
        </div>
      </div>
    </DynamicTitleLayout>
  );
};

export default Payment; 