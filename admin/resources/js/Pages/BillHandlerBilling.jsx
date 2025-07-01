import React, { useState, useEffect } from 'react';
import BillHandlerLayout from '@/Layouts/BillHandlerLayout';
import axios from 'axios';
import { router } from '@inertiajs/react';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const BillHandlerBilling = () => {
  const [activeTab, setActiveTab] = useState('invoice-generation');
  
  // State for each tab's data
  const [meterReadings, setMeterReadings] = useState([]);
  const [bills, setBills] = useState([]);
  const [billingCycles, setBillingCycles] = useState([]);
  const [rates, setRates] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  
  // Loading states
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Filter states
  const [staffFilter, setStaffFilter] = useState('All Staff');
  const [accountTypeFilter, setAccountTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('2024-06');

  // Additional states for Payment Details Modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState(null);
  const [stats, setStats] = useState({
    total_amount: 0,
    pending_count: 0,
    partial_count: 0
  });

  useEffect(() => {
    // Set up CSRF token
    const setupCsrf = async () => {
      try {
        // Get CSRF cookie
        await axios.get('/sanctum/csrf-cookie');
        
        // Get CSRF token from meta tag
        const token = document.querySelector('meta[name="csrf-token"]');
        if (token) {
          axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
        }
      } catch (error) {
        console.error('Error setting up CSRF:', error);
      }
    };

    setupCsrf();

    // Fetch data
    fetchMeterReadings();
    fetchBills();
    fetchBillingCycles();
    fetchRates();
    fetchBillingHistory();
    fetchStats();
  }, []);

  const fetchMeterReadings = async () => {
    setLoadingReadings(true);
    try {
      const response = await axios.get('/api/meter-readings');
      setMeterReadings(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching meter readings:', error);
      setMeterReadings([]);
    } finally {
      setLoadingReadings(false);
    }
  };

  const fetchBills = async () => {
    setLoadingBills(true);
    try {
      const response = await axios.get('/api/payment-history');
      if (response.data.success) {
        setBills(response.data.data || []);
      } else {
        setBills([]);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  const fetchBillingCycles = async () => {
    setLoadingCycles(true);
    try {
      const response = await axios.get('/api/billing-cycles');
      setBillingCycles(response.data || []);
    } catch (error) {
      console.error('Error fetching billing cycles:', error);
      setBillingCycles([]);
    } finally {
      setLoadingCycles(false);
    }
  };

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const response = await axios.get('/api/rates');
      setRates(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching rates:', error);
      setRates([]);
    } finally {
      setLoadingRates(false);
    }
  };

  const fetchBillingHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await axios.get('/api/billing-history');
      setBillingHistory(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching billing history:', error);
      setBillingHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/payment-history/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePaymentValidation = async (paymentId, action) => {
    try {
      setLoadingBills(true);

      const response = await axios.post(`/api/bill-payment-validation/${paymentId}/validate`, {
        action,
        admin_notes: adminNotes
      });

      if (response.data.success) {
        alert(`Payment ${action}d successfully`);
        fetchBills();
        fetchStats();
        setSelectedPayment(null);
        setAdminNotes('');
      } else {
        throw new Error(response.data.message || `Failed to ${action} payment`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert(error.message || `Failed to ${action} payment`);
    } finally {
      setLoadingBills(false);
    }
  };

  const handleGenerateInvoice = async (meterReading) => {
    try {
      setLoadingReadings(true);
      
      // Check if we have the required data
      if (!meterReading.customer_id) {
        throw new Error('Customer ID is missing from meter reading data');
      }
      
      const response = await axios.post('/api/invoices/generate', {
        meter_reading_id: meterReading.id,
        customer_id: meterReading.customer_id,
        meter_number: meterReading.meter_number,
        reading_value: meterReading.reading_value,
        amount: meterReading.amount,
        staff_id: meterReading.staff_id,
        reading_date: meterReading.reading_date
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        const { pdf_url, pdf_filename } = response.data;
        
        // Show success message with download option
        const result = confirm(
          `Invoice PDF generated successfully!\n\n` +
          `Filename: ${pdf_filename}\n` +
          `Click OK to download the PDF, or Cancel to continue.`
        );
        
        if (result && pdf_url) {
          // Open PDF in new tab for download
          window.open(pdf_url, '_blank');
        }
        
        fetchMeterReadings(); // Refresh the data
      } else {
        throw new Error(response.data.message || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Invoice generation error:', error);
      if (error.response?.status === 401) {
        router.visit('/');
        return;
      }
      alert(error.response?.data?.message || error.message || 'Failed to generate invoice');
    } finally {
      setLoadingReadings(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${parseFloat(amount).toFixed(2)}`;
  };

  // Calculate billing cycles statistics
  const totalCycles = billingCycles.length;
  const activeCycles = billingCycles.filter(cycle => cycle.status === 'active').length;
  const inactiveCycles = totalCycles - activeCycles;
  const totalAmount = billingCycles.reduce((sum, cycle) => sum + parseFloat(cycle.amount_due || 0), 0);

  // Calculate bill payment validation statistics
  const pendingValidation = bills.filter(bill => bill.status === 'pending').length;
  const unpaidBills = bills.filter(bill => bill.status === 'unpaid').length;

  const renderInvoiceGeneration = () => (
    <div>
      {/* Search and Filter Row - matching your screenshot exactly */}
      <div className="flex items-end gap-8 mb-6">
        <div className="flex-1">
          <label className="block text-sm text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by ID, meter number, remarks, or staff ID"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Staff Filter</label>
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white min-w-[140px]"
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
          >
            <option>All Staff</option>
            <option>Staff 1</option>
            <option>Staff 2</option>
            <option>Staff 3</option>
          </select>
        </div>
      </div>

      {loadingReadings ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Meter Number</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Reading Value</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Remarks</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Staff ID</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Reading Date</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {meterReadings.map((reading) => (
                <tr key={reading.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{reading.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{reading.meter_number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{reading.reading_value}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(reading.amount)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{reading.remarks || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{reading.staff_id}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatDate(reading.reading_date)}</td>
                  <td className="py-3 px-4 text-sm">
                    <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm mr-2 hover:bg-gray-300 font-medium">View</button>
                    <button
                      onClick={() => handleGenerateInvoice(reading)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 font-medium"
                      disabled={loadingReadings}
                    >
                      Generate Invoice
                    </button>
                  </td>
                </tr>
              ))}
              {meterReadings.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">No meter readings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
    );

  const renderBillPaymentValidation = () => (
    <div>
      {/* Filter Row */}
      <div className="flex items-end gap-8 mb-6">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Billing Period</label>
          <div className="relative">
            <input
              type="month"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white min-w-[140px]"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Account Type</label>
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white min-w-[120px]"
            value={accountTypeFilter}
            onChange={(e) => setAccountTypeFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="government">Government</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Status</label>
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white min-w-[120px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="pending_validation">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Validated</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name or account number"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md">
          <div className="text-green-700 text-sm font-medium">Total Payments</div>
          <div className="text-green-900 text-2xl font-bold">{formatCurrency(stats.total_amount || 0)}</div>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
          <div className="text-blue-700 text-sm font-medium">Pending Validation</div>
          <div className="text-blue-900 text-2xl font-bold">{stats.pending_count || 0}</div>
        </div>
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-md">
          <div className="text-orange-700 text-sm font-medium">Partial Payments</div>
          <div className="text-orange-900 text-2xl font-bold">{stats.partial_count || 0}</div>
        </div>
      </div>

      {loadingBills ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Account Details</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {bills.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.customer_type ? payment.customer_type.toUpperCase() : 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Acc#: {payment.account_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        Ref: {payment.payment_reference || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount_paid)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Bill: {formatCurrency(payment.bill_amount)}
                    </div>
                  </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      payment.payment_method === 'GCASH' ? 'bg-blue-100 text-blue-800' :
                      payment.payment_method === 'MAYA' ? 'bg-purple-100 text-purple-800' :
                      payment.payment_method === 'CASH' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.payment_method || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      payment.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.payment_status === 'processing' || payment.payment_status === 'pending_validation' ? 'bg-yellow-100 text-yellow-800' :
                      payment.payment_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.payment_status === 'completed' ? 'VALIDATED' :
                       payment.payment_status === 'processing' || payment.payment_status === 'pending_validation' ? 'PENDING' :
                       payment.payment_status === 'rejected' ? 'REJECTED' :
                       payment.payment_status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {(payment.payment_status === 'processing' || payment.payment_status === 'pending_validation') && (
                        <button
                          onClick={() => handlePaymentValidation(payment.id, 'approve')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 font-medium"
                          disabled={loadingBills}
                        >
                          Approve
                        </button>
                      )}
                      {payment.payment_status === 'completed' && (
                        <button
                          className="bg-gray-500 text-white px-3 py-1 rounded text-sm cursor-default"
                          disabled
                        >
                          Approved
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 font-medium"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
          ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">No payments found</td>
                </tr>
              )}
            </tbody>
          </table>
              </div>
          )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
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
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500">Reference</p>
                            <p className="text-sm text-gray-900">{selectedPayment.payment_reference || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Account</p>
                            <p className="text-sm text-gray-900">{selectedPayment.account_number}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Customer</p>
                            <p className="text-sm text-gray-900">{selectedPayment.full_name}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Amount</p>
                            <p className="text-sm text-gray-900">{formatCurrency(selectedPayment.amount_paid)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Method</p>
                            <p className="text-sm text-gray-900">{selectedPayment.payment_method}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Status</p>
                            <p className="text-sm text-gray-900">{selectedPayment.payment_status?.replace('_', ' ').toUpperCase()}</p>
                          </div>
                        </div>
                        {selectedPayment.admin_notes && (
                          <div>
                            <p className="text-xs font-medium text-gray-500">Admin Notes</p>
                            <p className="text-sm text-gray-900">{selectedPayment.admin_notes}</p>
                          </div>
                        )}
                      </div>

                      {(selectedPayment.payment_status === 'processing' || selectedPayment.payment_status === 'pending_validation') && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Admin Notes (Optional)
                        </label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                            rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Add any notes about this payment..."
                        />
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {(selectedPayment.payment_status === 'processing' || selectedPayment.payment_status === 'pending_validation') && (
                  <>
                <button
                  type="button"
                      onClick={() => handlePaymentValidation(selectedPayment.id, 'approve')}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                      disabled={loadingBills}
                >
                  Approve
                </button>
                <button
                  type="button"
                      onClick={() => handlePaymentValidation(selectedPayment.id, 'reject')}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      disabled={loadingBills}
                >
                  Reject
                </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPayment(null);
                    setAdminNotes('');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBillingCycles = () => (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Billing Cycles Management</h3>
        <p className="text-sm text-gray-600">Billing cycles are automatically synced from customer data</p>
      </div>

      {/* Filter Row - matching your screenshot exactly */}
      <div className="flex items-end gap-8 mb-6">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Account Type</label>
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white min-w-[120px]"
            value={accountTypeFilter}
            onChange={(e) => setAccountTypeFilter(e.target.value)}
          >
            <option>All</option>
            <option>Residential</option>
            <option>Commercial</option>
            <option>Government</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Billing Period</label>
          <div className="relative">
            <input
              type="text"
              placeholder="-------- ----"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white min-w-[140px]"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name or account number"
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white min-w-[280px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Statistics Cards - matching your screenshot */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
          <div className="text-blue-700 text-sm font-medium">Total Cycles</div>
          <div className="text-blue-900 text-2xl font-bold">{totalCycles}</div>
        </div>
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md">
          <div className="text-green-700 text-sm font-medium">Active</div>
          <div className="text-green-900 text-2xl font-bold">{activeCycles}</div>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-md">
          <div className="text-yellow-700 text-sm font-medium">Inactive</div>
          <div className="text-yellow-900 text-2xl font-bold">{inactiveCycles}</div>
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
          <div className="text-red-700 text-sm font-medium">Total Amount</div>
          <div className="text-red-900 text-2xl font-bold">{formatCurrency(totalAmount)}</div>
        </div>
      </div>

      {loadingCycles ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Account Number</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Account Type</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Billing Start Date</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Billing End Date</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Amount Due</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {billingCycles.map((cycle) => (
                <tr key={cycle.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{cycle.customer || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{cycle.account_number || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{cycle.account_type || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatDate(cycle.billing_start_date)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatDate(cycle.billing_end_date)}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      cycle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cycle.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(cycle.amount_due)}</td>
                  <td className="py-3 px-4 text-sm">
                    <button 
                      onClick={() => setSelectedBillingCycle(cycle)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 font-medium"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {billingCycles.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">No billing cycles found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Billing Cycle Details Modal */}
      {selectedBillingCycle && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Billing Cycle Details
                    </h3>
                    <div className="mt-4">
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500">Cycle ID</p>
                            <p className="text-sm text-gray-900">{selectedBillingCycle.id}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Customer ID</p>
                            <p className="text-sm text-gray-900">{selectedBillingCycle.customer_id}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Customer Name</p>
                            <p className="text-sm text-gray-900">{selectedBillingCycle.customer}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Account Number</p>
                            <p className="text-sm text-gray-900">{selectedBillingCycle.account_number}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Account Type</p>
                            <p className="text-sm text-gray-900">{selectedBillingCycle.account_type?.toUpperCase()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Status</p>
                            <p className="text-sm text-gray-900">{selectedBillingCycle.status?.toUpperCase()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Billing Start Date</p>
                            <p className="text-sm text-gray-900">{formatDate(selectedBillingCycle.billing_start_date)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Billing End Date</p>
                            <p className="text-sm text-gray-900">{formatDate(selectedBillingCycle.billing_end_date)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Amount Due</p>
                            <p className="text-sm text-gray-900">{formatCurrency(selectedBillingCycle.amount_due)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Created Date</p>
                            <p className="text-sm text-gray-900">{formatDate(selectedBillingCycle.created_at)}</p>
                          </div>
                        </div>
                        {selectedBillingCycle.email && (
                          <div>
                            <p className="text-xs font-medium text-gray-500">Email</p>
                            <p className="text-sm text-gray-900">{selectedBillingCycle.email}</p>
                          </div>
                        )}
                        {selectedBillingCycle.contact_number && (
                          <div>
                            <p className="text-xs font-medium text-gray-500">Contact Number</p>
                            <p className="text-sm text-gray-900">{selectedBillingCycle.contact_number}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setSelectedBillingCycle(null)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRateManagement = () => (
    <div className="text-center py-12">
      <h3 className="text-xl font-medium text-gray-700 mb-2">Rate Management</h3>
      <p className="text-gray-500">Water rates, penalty rates, service charges</p>
      {loadingRates && <div className="mt-4 text-gray-500">Loading...</div>}
    </div>
  );

  const renderBillingHistory = () => (
    <div>
      {/* Filter Row */}
      <div className="flex justify-between items-end mb-4">
        <div className="flex items-end gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Account Type</label>
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
            >
              <option>All</option>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Government</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Billing Period</label>
            <input
              type="month"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or account number"
              className="w-64 px-3 py-2 text-sm border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loadingHistory ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Account Number</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Billing Period</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((history) => (
                <tr key={history.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{history.full_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{history.account_number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{history.billing_period}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(history.amount_paid)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatDate(history.due_date)}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      history.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                      history.payment_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {history.payment_status === 'completed' ? 'Paid' : 
                       history.payment_status === 'processing' ? 'Unpaid' : history.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200">Details</button>
                  </td>
                </tr>
              ))}
              {billingHistory.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">No billing history found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const tabs = [
    { key: 'invoice-generation', label: 'Invoice Generation' },
    { key: 'bill-payment-validation', label: 'Bill Payment Validation' },
    { key: 'billing-cycles', label: 'Billing Cycles' },
    { key: 'rate-management', label: 'Rate Management' },
    { key: 'billing-history', label: 'Billing History' },
  ];

  return (
    <BillHandlerLayout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-6 my-6">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
        </div>
        
        {/* Tab Navigation - matching your screenshot */}
        <div className="border-b border-gray-200">
          <nav className="px-6">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="px-6 py-6">
          {activeTab === 'invoice-generation' && renderInvoiceGeneration()}
          {activeTab === 'bill-payment-validation' && renderBillPaymentValidation()}
          {activeTab === 'billing-cycles' && renderBillingCycles()}
          {activeTab === 'rate-management' && renderRateManagement()}
          {activeTab === 'billing-history' && renderBillingHistory()}
        </div>
      </div>
    </BillHandlerLayout>
  );
};

export default BillHandlerBilling; 