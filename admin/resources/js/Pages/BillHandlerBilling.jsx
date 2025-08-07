import React, { useState, useEffect } from 'react';
import BillHandlerLayout from '@/Layouts/BillHandlerLayout';
import axios from 'axios';
import { router } from '@inertiajs/react';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/* PRINT-ONLY CSS */
// Add this to your global CSS or in a <style> tag in your main layout or this component:
/*
@media print {
  body * {
    visibility: hidden !important;
  }
  #invoice-modal-content, #invoice-modal-content * {
    visibility: visible !important;
  }
  #invoice-modal-content {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100vw !important;
    background: white !important;
    box-shadow: none !important;
  }
}
*/

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
  const [filters, setFilters] = useState({
    account_type: 'All',
    search: '',
    status: 'All',
    bill_status: 'All'  // Changed from 'unpaid' to 'All'
  });

  // Billing cycle statistics
  const [totalCycles, setTotalCycles] = useState(0);
  const [activeCycles, setActiveCycles] = useState(0);
  const [inactiveCycles, setInactiveCycles] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Additional states for Payment Details Modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState(null);
  const [stats, setStats] = useState({
    total_amount: 0,
    pending_count: 0,
    partial_count: 0
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredCycles, setFilteredCycles] = useState([]);
  
  // Meter readings pagination states
  const [currentReadingsPage, setCurrentReadingsPage] = useState(1);
  const [readingsPerPage] = useState(10);
  const [filteredReadings, setFilteredReadings] = useState([]);
  
  // Sorting states
  const [sortField, setSortField] = useState('billing_start_date');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

  // Add state for meter number search
  const [meterNumberSearch, setMeterNumberSearch] = useState("");

  // Add state for invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Add state for global active cycles
  const [globalActiveCycles, setGlobalActiveCycles] = useState(null);

  // --- Add state for pagination ---
  const [billingHistoryPage, setBillingHistoryPage] = useState(1);
  const [billingHistoryPerPage] = useState(10);
  const [billsPage, setBillsPage] = useState(1);
  const [billsPerPage] = useState(10);

  // --- Sliced data for current page ---
  const paginatedBillingHistory = billingHistory.slice((billingHistoryPage - 1) * billingHistoryPerPage, billingHistoryPage * billingHistoryPerPage);
  const paginatedBills = bills.slice((billsPage - 1) * billsPerPage, billsPage * billsPerPage);

  // --- Replace Pagination component with Invoice Generation style ---
  const PaginationModern = ({ currentPage, totalPages, onPageChange, totalItems, startItem, endItem }) => (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => onPageChange(number)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === number ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

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

    // Fetch global active count on mount
    axios.get('/api/billing-cycles/active-count').then(res => {
      setGlobalActiveCycles(res.data.active_count);
    });
  }, []);

  // Filter, sort and paginate billing cycles
  useEffect(() => {
    let filtered = billingCycles;

    // Apply filters
    if (filters.account_type !== 'All') {
      filtered = filtered.filter(cycle => 
        cycle.account_type?.toLowerCase() === filters.account_type.toLowerCase()
      );
    }

    if (filters.search) {
      filtered = filtered.filter(cycle =>
        cycle.customer?.toLowerCase().includes(filters.search.toLowerCase()) ||
        cycle.account_number?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'All') {
      filtered = filtered.filter(cycle => 
        cycle.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle date sorting
      if (sortField === 'billing_start_date' || sortField === 'billing_end_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      // Handle amount sorting
      if (sortField === 'amount_due') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      // Handle string sorting (customer name, account number, etc.)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredCycles(filtered);
    setCurrentPage(1); // Reset to first page when filters or sorting change
  }, [billingCycles, filters, sortField, sortDirection]);

  // Filter and paginate meter readings
  useEffect(() => {
    let filtered = meterReadings;
    if (meterNumberSearch) {
      filtered = filtered.filter(reading =>
        reading.meter_number && reading.meter_number.toLowerCase().includes(meterNumberSearch.toLowerCase())
      );
    }
    setFilteredReadings(filtered);
    setCurrentReadingsPage(1); // Reset to first page when filters change
  }, [meterReadings, meterNumberSearch]);

  const fetchMeterReadings = async () => {
    setLoadingReadings(true);
    try {
      const response = await axios.get('/api/test-meter-readings');
      console.log('Meter readings response:', response.data);
      
      if (response.data.success) {
        // Use the data array directly from the test endpoint
        const readings = response.data.data || [];
        setMeterReadings(Array.isArray(readings) ? readings : []);
        console.log('Processed meter readings:', readings);
      } else {
        console.error('API returned success: false');
        setMeterReadings([]);
      }
    } catch (error) {
      console.error('Error fetching meter readings:', error);
      setMeterReadings([]);
    } finally {
      setLoadingReadings(false);
    }
  };

  // Fetch Bill Payment Validation data (same as admin Payments tab)
  const fetchBills = async () => {
    setLoadingBills(true);
    try {
      // Use the same endpoint as admin Payments
      const response = await axios.get('/api/payment-history', {
        params: {
          // You can add filters here if needed, e.g. status, period, search, page, per_page
        }
      });
      if (response.data && response.data.success) {
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
      const params = {
        account_type: filters.account_type !== 'All' ? filters.account_type.toLowerCase() : undefined,
        search: filters.search || undefined,
        status: filters.status !== 'All' ? filters.status.toLowerCase() : undefined,
        bill_status: filters.bill_status !== 'All' ? filters.bill_status.toLowerCase() : undefined,
        page: currentPage,
        per_page: itemsPerPage
      };

      console.log('Fetching billing cycles with params:', params);

      // Get billing cycles with customer data  
      const response = await axios.get('/api/bill-handler/billing-cycles', { 
        params,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Billing cycles API response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data:', response.data);

      // --- FINAL FIX: Extract billing cycles array and stats from correct response shape ---
      const cycles = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setBillingCycles(cycles);

      const result = response.data || {};
      const total = result.total || 0;
      const active = cycles.filter(cycle => cycle.status === 'active').length;
      const inactive = cycles.filter(cycle => cycle.status !== 'active').length;
      const totalDue = cycles.reduce((sum, cycle) => sum + (parseFloat(cycle.amount_due) || 0), 0);

      setTotalCycles(total);
      setActiveCycles(active);
      setInactiveCycles(inactive);
      setTotalAmount(totalDue);
    } catch (error) {
      console.error('Error fetching billing cycles:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      setBillingCycles([]);
      setTotalCycles(0);
      setActiveCycles(0);
      setInactiveCycles(0);
      setTotalAmount(0);
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
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${parseFloat(amount).toFixed(2)}`;
  };

  const renderInvoiceGeneration = () => (
    <div>
      {/* Header with statistics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoice Generation</h2>
        <p className="text-gray-600">Generate invoices from meter readings data</p>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-700">Total Readings</h3>
            <p className="text-2xl font-bold text-blue-900">{filteredReadings.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-700">Total Amount</h3>
            <p className="text-2xl font-bold text-green-900">
              ₱{filteredReadings.reduce((sum, reading) => sum + (parseFloat(reading.amount) || 0), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-700">This Month</h3>
            <p className="text-2xl font-bold text-yellow-900">
              {filteredReadings.filter(reading => {
                const readingDate = new Date(reading.reading_date);
                const now = new Date();
                return readingDate.getMonth() === now.getMonth() && readingDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-sm font-medium text-purple-700">Unique Meters</h3>
            <p className="text-2xl font-bold text-purple-900">
              {Array.from(new Set(filteredReadings.map(reading => reading.meter_number))).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Meter Number</label>
            <input
              type="text"
              placeholder="Enter meter number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={meterNumberSearch}
              onChange={e => setMeterNumberSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loadingReadings ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading meter readings...
          </div>
        </div>
      ) : Array.isArray(filteredReadings) && filteredReadings.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Meter Readings</h3>
            <p className="text-sm text-gray-600">Select a reading to generate an invoice</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Customer Name</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Meter Number</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Reading Value</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Remarks</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Staff ID</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Reading Date</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Created At</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {(() => {
                  // Pagination calculations for meter readings
                  const indexOfLastReading = currentReadingsPage * readingsPerPage;
                  const indexOfFirstReading = indexOfLastReading - readingsPerPage;
                  const currentReadings = filteredReadings.slice(indexOfFirstReading, indexOfLastReading);
                  const totalReadingsPages = Math.ceil(filteredReadings.length / readingsPerPage);

                  return currentReadings.map((reading) => (
                    <tr key={reading.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">{reading.full_name || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">{reading.meter_number}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{reading.reading_value}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-semibold">{formatCurrency(reading.amount)}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          reading.remarks ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {reading.remarks || 'No remarks'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{reading.staff_id}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{formatDate(reading.reading_date)}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{formatDate(reading.created_at)}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex space-x-2">
                          <button 
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 font-medium transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvoice(reading);
                              setShowInvoiceModal(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 font-medium transition-colors flex items-center"
                            disabled={loadingReadings}
                            title="Generate Invoice"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Meter Readings */}
          {(() => {
            const totalReadingsPages = Math.ceil(filteredReadings.length / readingsPerPage);
            const indexOfLastReading = currentReadingsPage * readingsPerPage;
            const indexOfFirstReading = indexOfLastReading - readingsPerPage;

            return totalReadingsPages > 1 ? (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => paginateReadings(currentReadingsPage - 1)}
                    disabled={currentReadingsPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => paginateReadings(currentReadingsPage + 1)}
                    disabled={currentReadingsPage === totalReadingsPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{indexOfFirstReading + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastReading, filteredReadings.length)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{filteredReadings.length}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => paginateReadings(currentReadingsPage - 1)}
                        disabled={currentReadingsPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: totalReadingsPages }, (_, i) => i + 1).map((number) => (
                        <button
                          key={number}
                          onClick={() => paginateReadings(number)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentReadingsPage === number
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => paginateReadings(currentReadingsPage + 1)}
                        disabled={currentReadingsPage === totalReadingsPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No meter readings</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding some meter readings.</p>
        </div>
      )}
    </div>
  );

  const renderBillPaymentValidation = () => {
    const totalPages = Math.ceil(bills.length / billsPerPage);
    const startItem = bills.length === 0 ? 0 : (billsPage - 1) * billsPerPage + 1;
    const endItem = Math.min(billsPage * billsPerPage, bills.length);
    return (
      <div>
        {/* Filter Row */}
        <div className="flex items-end gap-8 mb-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Billing Period</label>
            <div className="relative">
              <input
                type="month"
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white min-w-[140px]"
                value={filters.billing_period}
                onChange={(e) => setFilters({ ...filters, billing_period: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Account Type</label>
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white min-w-[120px]"
              value={filters.account_type}
              onChange={(e) => setFilters({ ...filters, account_type: e.target.value })}
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
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {/* Add bill status filter UI after the status filter */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="bill_status" className="text-sm font-medium text-gray-700">
            Bill Status
          </label>
          <select
            id="bill_status"
            name="bill_status"
            value={filters.bill_status}
            onChange={(e) => setFilters({ ...filters, bill_status: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="All">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </select>
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
          <div className="bg-white rounded-lg">
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
                {paginatedBills.map((payment) => (
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
                        {/* Approve/Approved button or invisible placeholder */}
                        {(payment.payment_status === 'processing' || payment.payment_status === 'pending_validation') ? (
                          <button
                            onClick={() => handlePaymentValidation(payment.id, 'approve')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 font-medium"
                            disabled={loadingBills}
                            style={{ width: 100, textAlign: 'center' }}
                          >
                            Approve
                          </button>
                        ) : payment.payment_status === 'completed' ? (
                          <button
                            className="bg-gray-500 text-white px-3 py-1 rounded text-sm cursor-default"
                            disabled
                            style={{ width: 100, textAlign: 'center' }}
                          >
                            Approved
                          </button>
                        ) : (
                          // Invisible placeholder with same width as the real button
                          <button
                            style={{
                              width: 100,
                              opacity: 0,
                              pointerEvents: 'none',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.25rem',
                              border: 'none',
                            }}
                            tabIndex={-1}
                            aria-hidden="true"
                          >
                            Placeholder
                          </button>
                        )}
                        {/* Details button */}
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 font-medium"
                          style={{ width: 80, textAlign: 'center' }}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedBills.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">No payments found</td>
                  </tr>
                )}
              </tbody>
            </table>
            <PaginationModern
              currentPage={billsPage}
              totalPages={totalPages}
              onPageChange={page => setBillsPage(page)}
              totalItems={bills.length}
              startItem={startItem}
              endItem={endItem}
            />
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
          </div>
        )}
      </div>
    );
  };

  // Pagination calculations
  const currentCycles = filteredCycles;
  const totalPages = Math.ceil(totalCycles / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const paginateReadings = (pageNumber) => setCurrentReadingsPage(pageNumber);

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as sort field with descending as default
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l-4-4m4 4H8" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  const renderBillingCycles = () => {
    // Debug logs to check data at render time
    console.log('Billing cycles (raw):', billingCycles);
    console.log('Filtered cycles:', filteredCycles);
    console.log('Current cycles (paginated):', currentCycles);
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Billing Cycles Management</h2>
        <p className="text-gray-600">Billing cycles are automatically synced from customer data</p>
        
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Type</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.account_type}
              onChange={(e) => setFilters({ ...filters, account_type: e.target.value })}
            >
              <option value="All">All</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Government">Government</option>
            </select>
          </div>
          
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search by name or account number"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700">Total Cycles</h3>
            <p className="text-2xl font-bold text-blue-900">{totalCycles}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700">Active</h3>
            <p className="text-2xl font-bold text-green-900">{globalActiveCycles !== null ? globalActiveCycles : activeCycles}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-700">Inactive</h3>
            <p className="text-2xl font-bold text-yellow-900">{inactiveCycles}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-700">Total Amount</h3>
            <p className="text-2xl font-bold text-red-900">₱{totalAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('customer')}
                >
                  <div className="flex items-center">
                    Customer
                    <SortIcon field="customer" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('account_number')}
                >
                  <div className="flex items-center">
                    Account Number
                    <SortIcon field="account_number" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('account_type')}
                >
                  <div className="flex items-center">
                    Account Type
                    <SortIcon field="account_type" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('billing_start_date')}
                >
                  <div className="flex items-center">
                    Billing Start Date
                    <SortIcon field="billing_start_date" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('billing_end_date')}
                >
                  <div className="flex items-center">
                    Billing End Date
                    <SortIcon field="billing_end_date" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount_due')}
                >
                  <div className="flex items-center">
                    Amount Due
                    <SortIcon field="amount_due" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingCycles ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading billing cycles...
                  </td>
                </tr>
              ) : filteredCycles.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No billing cycles found
                  </td>
                </tr>
              ) : (
                currentCycles.map((cycle) => (
                  <tr key={cycle.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{cycle.customer || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{cycle.account_number || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{cycle.account_type || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(cycle.billing_start_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(cycle.billing_end_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cycle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cycle.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">₱{parseFloat(cycle.amount_due).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{currentPage * itemsPerPage - itemsPerPage + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredCycles.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredCycles.length}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === number
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBillingHistory = () => {
    const totalPages = Math.ceil(billingHistory.length / billingHistoryPerPage);
    const startItem = billingHistory.length === 0 ? 0 : (billingHistoryPage - 1) * billingHistoryPerPage + 1;
    const endItem = Math.min(billingHistoryPage * billingHistoryPerPage, billingHistory.length);
    return (
      <div>
        {/* Filter Row */}
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-end gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Account Type</label>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={filters.account_type}
                onChange={(e) => setFilters({ ...filters, account_type: e.target.value })}
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
                value={filters.billing_period}
                onChange={(e) => setFilters({ ...filters, billing_period: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name or account number"
                className="w-64 px-3 py-2 text-sm border border-gray-300 rounded-md"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
                {paginatedBillingHistory.map((history) => (
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
                {paginatedBillingHistory.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">No billing history found</td>
                  </tr>
                )}
              </tbody>
            </table>
            <PaginationModern
              currentPage={billingHistoryPage}
              totalPages={totalPages}
              onPageChange={page => setBillingHistoryPage(page)}
              totalItems={billingHistory.length}
              startItem={startItem}
              endItem={endItem}
            />
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { key: 'invoice-generation', label: 'Invoice Generation' },
    { key: 'bill-payment-validation', label: 'Bill Payment Validation' },
    { key: 'billing-cycles', label: 'Billing Cycles' },
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
          {activeTab === 'billing-history' && renderBillingHistory()}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative print:w-full print:max-w-full" id="invoice-modal-content">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowInvoiceModal(false)}
            >
              &times;
            </button>
            {/* Invoice Layout */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-blue-900">HERMOSA WATER DISTRICT</h2>
              <div className="text-sm text-gray-600">WATER BILL INVOICE</div>
            </div>
            <div className="mb-4 flex justify-between">
              <div>
                <div className="font-semibold">Customer Information</div>
                <div>Name: {selectedInvoice.full_name}</div>
                <div>Account #: {selectedInvoice.account_number || 'N/A'}</div>
                <div>Address: {selectedInvoice.address || 'N/A'}</div>
              </div>
              <div>
                <div className="font-semibold">Billing Period</div>
                <div>
                  From: {formatDate(selectedInvoice.reading_date)}
                </div>
                <div>
                  To: {formatDate(
                    selectedInvoice.reading_date
                      ? new Date(new Date(selectedInvoice.reading_date).getTime() + 30 * 24 * 60 * 60 * 1000)
                      : null
                  )}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <div className="font-semibold">Meter Reading Details</div>
              <div>Meter #: {selectedInvoice.meter_number}</div>
              <div>Reading Value: {selectedInvoice.reading_value}</div>
              <div>Amount: ₱{parseFloat(selectedInvoice.amount).toFixed(2)}</div>
              <div>Remarks: {selectedInvoice.remarks || 'None'}</div>
              <div>Staff ID: {selectedInvoice.staff_id}</div>
              <div>Reading Date: {selectedInvoice.reading_date}</div>
            </div>
            {/* Add more breakdown/charges as needed */}
            <div className="flex justify-end mt-6">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => {
                  window.print();
                }}
              >
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </BillHandlerLayout>
  );
};

export default BillHandlerBilling; 