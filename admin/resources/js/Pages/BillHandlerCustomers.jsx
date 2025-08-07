import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import BillHandlerLayout from '@/Layouts/BillHandlerLayout';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';

const BillHandlerCustomers = () => {
  const [customerAccountType, setCustomerAccountType] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch customers data
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/bill-handler/customers');
        
        // Check if response.data has the expected structure
        const customersData = response.data?.data || response.data || [];
        if (!Array.isArray(customersData)) {
          throw new Error('Invalid data format received from server');
        }

        // Transform the data to include billing status
        const customersWithBilling = await Promise.all(customersData.map(async customer => {
          try {
            // Get latest bill status for this customer
            const billResponse = await api.get(`/bill-handler/billing-cycles/${customer.id}`);
            const latestBill = billResponse.data?.data; // Get the most recent bill
            const billingStatus = latestBill ? 
              (latestBill.bill_status === 'completed' ? 'Paid' : latestBill.bill_status) : 
              'Unpaid';
            
            return {
              id: customer.id,
              full_name: customer.full_name || customer.name,
              accountNumber: customer.account_number,
              accountType: customer.customer_type || customer.account_type ? 
                ((customer.customer_type || customer.account_type).charAt(0).toUpperCase() + 
                 (customer.customer_type || customer.account_type).slice(1)) : 
                'Residential',
              address: customer.address || '',
              contact: customer.phone_number || customer.contact_number || '',
              email: customer.email || '',
              status: customer.status || 'Active',
              billingStatus: billingStatus,
              meterNumber: customer.meter_number || '',
              username: customer.username || ''
            };
          } catch (billError) {
            console.error('Error fetching bill status:', billError);
            // Return customer data with default billing status if bill fetch fails
            return {
              id: customer.id,
              full_name: customer.full_name || customer.name,
              accountNumber: customer.account_number,
              accountType: customer.customer_type || customer.account_type ? 
                ((customer.customer_type || customer.account_type).charAt(0).toUpperCase() + 
                 (customer.customer_type || customer.account_type).slice(1)) : 
                'Residential',
              address: customer.address || '',
              contact: customer.phone_number || customer.contact_number || '',
              email: customer.email || '',
              status: customer.status || 'Active',
              billingStatus: 'Unpaid',
              meterNumber: customer.meter_number || '',
              username: customer.username || ''
            };
          }
        }));

        setCustomers(customersWithBilling);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers. Please try again later.');
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const inactiveCustomers = customers.filter(c => c.status === 'Inactive').length;
  const overdueAccounts = customers.filter(c => c.billingStatus === 'Overdue').length;

  const filteredCustomers = customers.filter(cust => {
    const matchesType = customerAccountType === 'All' || 
                       (cust.accountType || '').toLowerCase() === customerAccountType.toLowerCase();
    const searchLower = customerSearch.toLowerCase();
    const matchesSearch = 
      (cust.full_name || '').toLowerCase().includes(searchLower) ||
      (cust.accountNumber || '').toString().includes(customerSearch) ||
      (cust.email || '').toLowerCase().includes(searchLower) ||
      (cust.contact || '').toString().includes(customerSearch);
    return matchesType && matchesSearch;
  });

  return (
    <DynamicTitleLayout userRole="bill handler">
      <BillHandlerLayout>
        <div className="max-w-full mx-auto p-6">
          <h1 className="text-2xl font-semibold mb-6">Customers</h1>
          
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <span className="material-symbols-outlined text-blue-600">group</span>
                </div>
                <div>
                  <p className="text-gray-500">Total Customers</p>
                  <p className="text-2xl font-bold">{totalCustomers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                </div>
                <div>
                  <p className="text-gray-500">Active Customers</p>
                  <p className="text-2xl font-bold">{activeCustomers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <span className="material-symbols-outlined text-gray-600">block</span>
                </div>
                <div>
                  <p className="text-gray-500">Inactive Customers</p>
                  <p className="text-2xl font-bold">{inactiveCustomers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <span className="material-symbols-outlined text-red-600">schedule</span>
                </div>
                <div>
                  <p className="text-gray-500">Overdue Accounts</p>
                  <p className="text-2xl font-bold">{overdueAccounts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow">
            {/* Filters */}
            <div className="p-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select
                    value={customerAccountType}
                    onChange={e => setCustomerAccountType(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Government">Government</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search by full name or account number"
                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-4">Loading customers...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-600">{error}</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account Number</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Billing Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                          No customers found
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map(customer => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">{customer.full_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{customer.accountNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{customer.accountType}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{customer.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{customer.contact}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {customer.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              customer.billingStatus === 'Paid' || customer.billingStatus === 'completed' ? 'bg-green-100 text-green-800' :
                              customer.billingStatus === 'Unpaid' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {customer.billingStatus === 'completed' ? 'Paid' : customer.billingStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </BillHandlerLayout>
    </DynamicTitleLayout>
  );
};

export default BillHandlerCustomers; 