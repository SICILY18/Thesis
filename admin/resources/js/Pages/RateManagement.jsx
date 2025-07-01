import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';
import Notification from '@/Components/Notification';
import { usePage } from '@inertiajs/react';
import TicketCount from '@/Components/TicketCount';

// Display names for customer types
const accountTypes = ['Commercial', 'Residential', 'Government'];
// Lowercase mapping for API calls
const customerTypeMap = {
  'Commercial': 'commercial',
  'Residential': 'residential',
  'Government': 'government'
};

const RateManagement = () => {
  const { auth } = usePage().props;
  const [profilePicture, setProfilePicture] = useState(null);
  const [activeTab, setActiveTab] = useState('Commercial');
  const [rates, setRates] = useState([]);
  const [form, setForm] = useState({ minimum_charge: '', rate_per_cu_m: '' });
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Fetch rates on component mount and when activeTab changes
  useEffect(() => {
    fetchRates();
  }, [activeTab]);

  useEffect(() => {
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
  }, []);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const fetchRates = async () => {
    try {
      const response = await axios.get('/api/rates');
      const filteredRates = response.data.filter(
        rate => rate.customer_type === customerTypeMap[activeTab]
      );
      setRates(filteredRates);
    } catch (error) {
      console.error('Error fetching rates:', error);
      showNotification('Failed to fetch rates', 'error');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const requestData = editingId !== null ? {
        minimum_charge: form.minimum_charge,
        rate_per_cu_m: form.rate_per_cu_m
      } : {
        customer_type: customerTypeMap[activeTab],
        minimum_charge: form.minimum_charge,
        rate_per_cu_m: form.rate_per_cu_m
      };

      console.log('Sending rate data:', requestData);

      if (editingId !== null) {
        const response = await axios.put(`/api/rates/${editingId}`, requestData);
        console.log('Update response:', response.data);
        showNotification('Rate updated successfully');
      } else {
        const response = await axios.post('/api/rates', requestData);
        console.log('Create response:', response.data);
        showNotification('Rate added successfully');
      }
      
      fetchRates();
      setForm({ minimum_charge: '', rate_per_cu_m: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Error saving rate:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 422) {
        // Validation errors
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat().join(', ');
        showNotification(`Validation error: ${errorMessages}`, 'error');
      } else {
        showNotification(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save rate', 'error');
      }
    }
  };

  const handleEdit = (rate) => {
    setForm({
      minimum_charge: rate.minimum_charge,
      rate_per_cu_m: rate.rate_per_cu_m
    });
    setEditingId(rate.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this rate?')) return;
    
    try {
      await axios.delete(`/api/rates/${id}`);
      showNotification('Rate deleted successfully');
      fetchRates();
    } catch (error) {
      console.error('Error deleting rate:', error);
      showNotification('Failed to delete rate', 'error');
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return (
    <DynamicTitleLayout userRole="admin">
      <div className="min-h-screen bg-[#60B5FF] font-[Poppins] overflow-x-hidden">
        <div className="fixed left-0 top-0 h-full w-[240px] bg-white shadow-lg transform transition-transform duration-200 lg:translate-x-0 md:translate-x-0 -translate-x-full flex flex-col">
          <div className="p-3 flex-shrink-0">
            <img src="https://i.postimg.cc/fTdMBwmQ/hermosa-logo.png" alt="Logo" className="w-50 h-50 mx-auto mb-3" />
          </div>
          <nav className="flex flex-col flex-1 overflow-y-auto">
            <div className="flex-1 pb-4">
              <Link href="/admin/dashboard" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">dashboard</span>
                Dashboard
              </Link>
              <Link href="/admin/announcement" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/announcement' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">campaign</span>
                Announcement
              </Link>
              <Link href="/admin/accounts" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/accounts' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">manage_accounts</span>
                Manage Accounts
              </Link>
              <Link href="/admin/rate-management" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/rate-management' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">price_change</span>
                Rate Management
              </Link>
              <Link href="/admin/payment" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/payment' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">payments</span>
                Payment
              </Link>
              <Link href="/admin/reports" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/reports' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">description</span>
                Reports
              </Link>
              <Link href="/admin/tickets" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/tickets' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">confirmation_number</span>
                <div className="flex items-center">
                    Tickets
                    <TicketCount />
                </div>
              </Link>
              <Link href="/admin/profile" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined mr-3">person</span>
                Profile
              </Link>
            </div>
            <div className="flex-shrink-0">
              <button
                data-logout="true"
                type="button"
                className="flex items-center px-6 py-3 text-base text-gray-600 hover:text-red-600 hover:bg-red-50 w-full text-left"
              >
                <span className="material-symbols-outlined mr-3">logout</span>
                Logout
              </button>
            </div>
          </nav>
        </div>

        <div className="lg:ml-[240px] p-3 sm:p-4 md:p-6 lg:p-6 pt-16 lg:pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Rate Management</h1>
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
          <div className="bg-white rounded-xl shadow-md p-10">
            {/* Notification */}
            {notification.show && (
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={handleCloseNotification}
              />
            )}

            {/* Tabs */}
            <div className="flex border-b mb-8">
              {accountTypes.map(type => (
                <button
                  key={type}
                  className={`px-8 py-3 text-lg font-semibold focus:outline-none transition-colors ${activeTab === type ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => { setActiveTab(type); setForm({ minimum_charge: '', rate_per_cu_m: '' }); setEditingId(null); }}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mb-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Charge (₱)
                  </label>
                  <input
                    type="number"
                    name="minimum_charge"
                    value={form.minimum_charge}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate per Cubic Meter (₱)
                  </label>
                  <input
                    type="number"
                    name="rate_per_cu_m"
                    value={form.rate_per_cu_m}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Add'} Rate
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ minimum_charge: '', rate_per_cu_m: '' });
                      setEditingId(null);
                    }}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Rates Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Minimum Charge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate per Cubic Meter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rates.map(rate => (
                    <tr key={rate.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₱{parseFloat(rate.minimum_charge).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₱{parseFloat(rate.rate_per_cu_m).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEdit(rate)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rate.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DynamicTitleLayout>
  );
};

export default RateManagement; 