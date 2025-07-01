import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';
import Notification from '@/Components/Notification';
import TicketCount from '@/Components/TicketCount';

const initialAnnouncements = [
  { id: 1, title: 'Water Interruption', content: 'There will be a scheduled water interruption on May 25, 2025.' },
  { id: 2, title: 'Maintenance Notice', content: 'Routine maintenance will be conducted on June 1, 2025.' },
];

const durationOptions = [
  { label: '1 day', value: 1 },
  { label: '1 week', value: 7 },
  { label: '1 month', value: 30 },
];

const Announcement = () => {
  const { auth } = usePage().props;
  const [profilePicture, setProfilePicture] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ 
    title: '', 
    content: '', 
    start_date: new Date().toISOString().split('T')[0], 
    end_date: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAnnouncements();
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

  const fetchAnnouncements = async () => {
    try {
      // Ensure CSRF token is available
      await axios.get('/sanctum/csrf-cookie');
      
      const response = await axios.get('/api/announcements');
      console.log('Fetched announcements:', response.data); // Debug log
      if (Array.isArray(response.data)) {
        setAnnouncements(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setAnnouncements(response.data.data);
      } else {
        console.error('Unexpected response format:', response.data);
        showNotification('Error loading announcements: Invalid data format', 'error');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      if (error.response?.status === 401) {
        showNotification('Authentication failed. Please login again.', 'error');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showNotification('Failed to fetch announcements', 'error');
      }
    }
  };

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentDate = new Date().toISOString().split('T')[0];

    try {
      // Ensure CSRF token is available
      await axios.get('/sanctum/csrf-cookie');
      
      const requestData = {
        title: form.title,
        content: form.content,
        start_date: currentDate,
        end_date: form.end_date
      };

      console.log('Sending announcement data:', requestData);

      let response;
      if (editingId) {
        response = await axios.put(`/api/announcements/${editingId}`, requestData);
        console.log('Update response:', response.data);
        showNotification('Announcement updated successfully');
      } else {
        response = await axios.post('/api/announcements', requestData);
        console.log('Create response:', response.data);
        showNotification('Announcement created successfully');
      }

      // Check if the response indicates success
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Operation failed');
      }

      fetchAnnouncements();
      setForm({ title: '', content: '', end_date: '' });
      setEditingId(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        showNotification('Authentication failed. Please login again.', 'error');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else if (error.response?.status === 422) {
        // Validation errors
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat().join(', ');
        showNotification(`Validation error: ${errorMessages}`, 'error');
      } else {
        showNotification(error.response?.data?.message || error.message || 'Failed to save announcement', 'error');
      }
    }
  };

  const handleEdit = (announcement) => {
    setForm({
      title: announcement.title,
      content: announcement.body,
      start_date: new Date(announcement.published_at).toISOString().split('T')[0],
      end_date: new Date(announcement.expired_at).toISOString().split('T')[0],
    });
    setEditingId(announcement.id);
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      // Ensure CSRF token is available
      await axios.get('/sanctum/csrf-cookie');
      
      await axios.delete(`/api/announcements/${id}`);
      showNotification('Announcement deleted successfully');
      fetchAnnouncements();
      if (editingId === id) {
        setForm({ title: '', content: '', start_date: '', end_date: '' });
        setEditingId(null);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      if (error.response?.status === 401) {
        showNotification('Authentication failed. Please login again.', 'error');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showNotification(error.response?.data?.message || 'Failed to delete announcement', 'error');
      }
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => 
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white h-14 flex items-center justify-between px-4 z-20">
          <button className="text-gray-600 hover:text-gray-800">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <img src="https://i.postimg.cc/fTdMBwmQ/hermosa-logo.png" alt="Logo" className="h-8" />
          <div></div>
        </div>

        {/* Main Content */}
        <div className="lg:ml-[240px] p-3 sm:p-4 md:p-6 lg:p-6 pt-16 lg:pt-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Announcements</h1>
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

          {/* Create and Search Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setForm({ title: '', content: '', start_date: '', end_date: '' });
                    setEditingId(null);
                    setShowCreateModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Create Announcement
                </button>
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">
                    search
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notification */}
          {notification.show && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(prev => ({ ...prev, show: false }))}
            />
          )}

          {/* Create/Edit Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
                <h2 className="text-xl font-semibold mb-4">
                  {editingId ? 'Edit Announcement' : 'Create New Announcement'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Enter title"
                      value={form.title}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      name="content"
                      placeholder="Enter content"
                      value={form.content}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      name="end_date"
                      value={form.end_date}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingId ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Announcements List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">All Announcements</h2>
              <div className="space-y-4">
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-4 bg-gray-100 rounded">
                    <p>Total announcements: {announcements.length}</p>
                    <p>Filtered announcements: {filteredAnnouncements.length}</p>
                  </div>
                )}
                
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map(announcement => (
                    <div key={announcement.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-800">{announcement.title}</h3>
                          <p className="text-sm text-gray-500">
                            Posted by: {announcement.posted_by || 'Unknown'} | 
                            Valid: {new Date(announcement.published_at).toLocaleDateString()} - {new Date(announcement.expired_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(announcement)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(announcement.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700">{announcement.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No announcements found matching your search.' : 'No announcements available.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DynamicTitleLayout>
  );
};

export default Announcement; 