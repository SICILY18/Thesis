import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/tickets');
      console.log('Tickets response:', response.data);
      
      if (response.data.success) {
        setTickets(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      
      if (error.response?.status === 401) {
        setError('You need to be logged in to view tickets. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
        return;
      }
      
      setError(error.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketReference, newStatus) => {
    try {
      console.log('Updating ticket:', ticketReference, 'with status:', newStatus, 'and remarks:', remarks);
      
      const updateData = {
        status: newStatus,
        ticket_remarks: remarks
      };

      const response = await axios.put(`/api/tickets/ref/${encodeURIComponent(ticketReference)}`, updateData);
      
      console.log('Update response:', response.data);
      
      if (response.data.success) {
        // Show success message
        alert('Ticket updated successfully!');
        
        // Refresh tickets list
        await fetchTickets();
        setViewing(null);
        setRemarks('');
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      
      let errorMessage = 'Failed to update ticket';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('Error: ' + errorMessage);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status?.toLowerCase()) {
      case 'open':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'resolved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'closed':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPriorityBadge = (priority) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'high':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'medium':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'low':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center min-h-screen">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <div className="text-red-600 font-medium mb-2">Error Loading Tickets</div>
            <div className="text-red-500 text-sm mb-4">{error}</div>
            <button
              onClick={fetchTickets}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
            <p className="text-gray-600">Manage customer service tickets</p>
          </div>
          <button
            onClick={fetchTickets}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">No tickets found</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.ticket_reference}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {ticket.subject || ticket.subcategory}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.customer_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.account_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{ticket.category}</div>
                          <div className="text-sm text-gray-500">{ticket.subcategory}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(ticket.status)}>
                          {ticket.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getPriorityBadge(ticket.priority)}>
                          {ticket.priority?.toUpperCase() || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setViewing(ticket)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ticket Detail Modal */}
        {viewing && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Ticket Details - {viewing.ticket_reference}
                </h3>
                <button
                  onClick={() => setViewing(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Customer Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div><strong>Name:</strong> {viewing.customer_name || 'Unknown'}</div>
                    <div><strong>Account:</strong> {viewing.account_number}</div>
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Ticket Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div><strong>Reference:</strong> {viewing.ticket_reference}</div>
                    <div><strong>Category:</strong> {viewing.category}</div>
                    <div><strong>Subcategory:</strong> {viewing.subcategory}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 ${getStatusBadge(viewing.status)}`}>
                        {viewing.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div><strong>Priority:</strong> 
                      <span className={`ml-2 ${getPriorityBadge(viewing.priority)}`}>
                        {viewing.priority?.toUpperCase() || 'MEDIUM'}
                      </span>
                    </div>
                    <div><strong>Created:</strong> {formatDate(viewing.created_at)}</div>
                    <div><strong>Updated:</strong> {formatDate(viewing.updated_at)}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {viewing.description || 'No description provided'}
                </div>
              </div>

              {/* Image Display */}
              {viewing.image_url && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Uploaded Image</h4>
                  <div className="border rounded-lg p-2 bg-gray-50">
                    <img 
                      src={viewing.image_url} 
                      alt="Ticket attachment"
                      className="max-w-full h-auto max-h-64 rounded cursor-pointer hover:opacity-80"
                      onClick={() => window.open(viewing.image_url, '_blank')}
                      onError={(e) => {
                        console.error('Image failed to load:', viewing.image_url);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none' }} className="text-center text-gray-500 py-8">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <p>Image not available</p>
                      <p className="text-xs">URL: {viewing.image_url}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Click image to view full size
                    </p>
                  </div>
                </div>
              )}

              {/* Remarks Section */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Update Ticket</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Enter your remarks here..."
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusUpdate(viewing.ticket_reference, 'pending')}
                      disabled={updating}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Mark as Pending
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(viewing.ticket_reference, 'resolved')}
                      disabled={updating}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark as Resolved
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(viewing.ticket_reference, 'closed')}
                      disabled={updating}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      Close Ticket
                    </button>
                  </div>
                </div>
              </div>

              {/* Previous Remarks */}
              {viewing.remarks_history && (() => {
                try {
                  const history = typeof viewing.remarks_history === 'string' 
                    ? JSON.parse(viewing.remarks_history) 
                    : viewing.remarks_history;
                  
                  if (Array.isArray(history) && history.length > 0) {
                    return (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-2">Remarks History</h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {history.map((remark, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm text-gray-900">
                                  {remark.user || 'Unknown User'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(remark.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{remark.remarks}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  console.error('Error parsing remarks history:', e);
                }
                return null;
              })()}

              <div className="flex justify-end">
                <button
                  onClick={() => setViewing(null)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Tickets; 