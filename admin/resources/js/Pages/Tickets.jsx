import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import { toast, Toaster } from 'react-hot-toast';

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All Status');
    const [selectedDate, setSelectedDate] = useState('');
    const [viewingTicket, setViewingTicket] = useState(null);
    const [newRemarks, setNewRemarks] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);

    const statusOptions = [
        { value: 'All Status', label: 'All Status' },
        { value: 'Open', label: 'Open' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Resolved', label: 'Resolved' }
    ];

    const statusColors = {
        'Open': 'bg-yellow-200 text-yellow-800',
        'In Progress': 'bg-blue-200 text-blue-800',
        'Resolved': 'bg-green-200 text-green-800'
    };

    const getStatusColor = (status) => {
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusStyle = (status) => {
        // Normalize the status to lowercase for comparison
        const normalizedStatus = status?.toLowerCase();
        
        const styles = {
            'open': 'bg-green-200 text-green-800',
            'in progress': 'bg-yellow-200 text-yellow-800',
            'resolved': 'bg-red-300 text-red-800'
        };

        // Get the style based on normalized status
        const style = styles[normalizedStatus] || 'bg-gray-200 text-gray-900';
        return `${style} px-3 py-1 rounded-full text-sm font-semibold flex items-center justify-center min-w-[100px]`;
    };

    const formatStatus = (status) => {
        // Map old status values to new ones
        const statusMap = {
            'pending': 'In Progress',
            'closed': 'Resolved',
            'open': 'Open',
            'in progress': 'In Progress',
            'resolved': 'Resolved'
        };

        // Convert to lowercase for comparison
        const normalizedStatus = status?.toLowerCase();
        // Return mapped status with proper capitalization or original status if no mapping exists
        return statusMap[normalizedStatus] || status;
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            console.log('Fetching tickets...');
            const response = await axios.get('/admin/tickets/data');
            console.log('Response:', response);
            
            if (response.data.success) {
                console.log('Tickets fetched successfully:', response.data.data);
                setTickets(response.data.data || []);
            } else {
                console.error('Failed to fetch tickets:', response.data.message);
                toast.error('Failed to fetch tickets: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            toast.error('Error fetching tickets: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = searchQuery === '' || 
            ticket.ticket_reference?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = selectedStatus === 'All Status' || 
            ticket.status === selectedStatus;
        
        const matchesDate = !selectedDate || 
            new Date(ticket.created_at).toISOString().split('T')[0] === selectedDate;

        return matchesSearch && matchesStatus && matchesDate;
    });

    const handleAddRemarks = async () => {
        if (!newRemarks.trim() || !viewingTicket?.ticket_id) {
            toast.error('Cannot add remarks: Invalid ticket or empty remarks');
            return;
        }

        setUpdateLoading(true);
        try {
            const response = await axios.post(`/admin/tickets/${viewingTicket.ticket_id}/remarks`, {
                remarks: newRemarks
            });

            if (response.data.success) {
                const updatedTicket = response.data.data;
                setViewingTicket(updatedTicket);
                setTickets(tickets.map(ticket => 
                    ticket.ticket_id === updatedTicket.ticket_id ? updatedTicket : ticket
                ));
                setNewRemarks('');
                toast.success('Remarks added successfully');
                fetchTickets();
            } else {
                throw new Error(response.data.message || 'Failed to add remarks');
            }
        } catch (error) {
            console.error('Error adding remarks:', error);
            if (error.response?.status === 419) {
                toast.error('Session expired. Please refresh the page and try again.');
            } else {
            toast.error(error.response?.data?.message || 'Failed to add remarks. Please try again.');
            }
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleStatusChange = async (ticketId, newStatus, remarks = "") => {
        setUpdateLoading(true);
        try {
            // Refresh CSRF token before making the request
            await axios.get('/sanctum/csrf-cookie');
            const response = await axios.put(`/admin/tickets/${ticketId}`, {
                status: newStatus,
                remarks: remarks || `Status changed to ${newStatus}`
            });
            if (response.data.success) {
                const updatedTicket = response.data.data;
                setTickets(tickets.map(ticket => 
                    ticket.ticket_id === updatedTicket.ticket_id ? updatedTicket : ticket
                ));
                // Mark the ticket as viewed in localStorage when status changes
                const viewedTickets = new Set(JSON.parse(localStorage.getItem('viewedTickets') || '[]'));
                viewedTickets.add(ticketId);
                localStorage.setItem('viewedTickets', JSON.stringify([...viewedTickets]));
                toast.success('Ticket status updated successfully');
                setNewRemarks(''); // Clear remarks after successful update
                fetchTickets();
            } else {
                throw new Error(response.data.message || 'Failed to update ticket status');
            }
        } catch (error) {
            console.error('Error updating ticket status:', error);
            if (error.response?.status === 419) {
                toast.error('Session expired. Please refresh the page and try again.');
                // Try to refresh CSRF token and retry the request
                try {
                    await axios.get('/sanctum/csrf-cookie');
                    // Retry the request after token refresh
                    const response = await axios.put(`/admin/tickets/${ticketId}`, {
                        status: newStatus,
                        remarks: remarks || `Status changed to ${newStatus}`
                    });
                    if (response.data.success) {
                        const updatedTicket = response.data.data;
                        setTickets(tickets.map(ticket => 
                            ticket.ticket_id === updatedTicket.ticket_id ? updatedTicket : ticket
                        ));
                        toast.success('Ticket status updated successfully');
                        setNewRemarks(''); // Clear remarks after successful update
                        fetchTickets();
                    }
                } catch (retryError) {
                    toast.error('Failed to update ticket status. Please try again.');
                }
            } else {
            toast.error(error.response?.data?.message || 'Failed to update ticket status');
            }
        } finally {
            setUpdateLoading(false);
        }
    };

    // Add logging when setting the viewing ticket
    const handleViewTicket = (ticket) => {
        console.log('Setting viewing ticket:', ticket);
        setViewingTicket(ticket);
    };

    useEffect(() => {
        // Initial CSRF cookie setup
        const setupCsrf = async () => {
            try {
                await axios.get('/sanctum/csrf-cookie');
            } catch (error) {
                console.error('Failed to setup CSRF protection:', error);
            }
        };
        setupCsrf();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#60B5FF] font-[Poppins] overflow-x-hidden">
                <Toaster position="top-right" />
                <div className="px-8 pb-8 pt-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Tickets</h1>
                    {/* Search Filters */}
                    <div className="bg-white rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search Tickets</label>
                                <input
                                    type="text"
                                    placeholder="Search by ID or subject.."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    placeholder="Select date"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tickets Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ticket Info</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Updated</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTickets.map((ticket, index) => (
                                    <tr key={ticket.id || ticket.ticket_reference || `ticket-${index}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">{ticket.ticket_reference || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{ticket.subject || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center items-center">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full justify-center items-center text-center ${
                                                    ticket.status?.toLowerCase() === 'open' ? 'bg-green-100 text-green-800' :
                                                    ticket.status?.toLowerCase() === 'in progress' ? 'bg-yellow-100 text-yellow-800' :
                                                    ticket.status?.toLowerCase() === 'resolved' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`} style={{ minWidth: '70px', display: 'inline-flex' }}>
                                                    {formatStatus(ticket.status)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {ticket.created_at ? formatDate(ticket.created_at) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {ticket.updated_at ? formatDate(ticket.updated_at) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center items-center">
                                                <button 
                                                    onClick={() => handleViewTicket(ticket)}
                                                    className="bg-blue-600 text-white px-6 py-1 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Ticket Details Modal */}
                    <Modal show={!!viewingTicket} onClose={() => setViewingTicket(null)} maxWidth="3xl">
                        {viewingTicket && (
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-xl font-semibold">Ticket Details - {viewingTicket.ticket_reference}</h2>
                                    <button onClick={() => setViewingTicket(null)} className="text-gray-400 hover:text-gray-500">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    {/* Customer Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Name:</label>
                                                <span className="col-span-2 text-sm text-gray-900">{viewingTicket.customer_name}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Account:</label>
                                                <span className="col-span-2 text-sm font-bold text-gray-900">{viewingTicket.account_number}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ticket Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Ticket Information</h3>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Reference:</label>
                                                <span className="col-span-2 text-sm text-gray-900">{viewingTicket.ticket_reference}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Category:</label>
                                                <span className="col-span-2 text-sm text-gray-900">{viewingTicket.category}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Subcategory:</label>
                                                <span className="col-span-2 text-sm text-gray-900">{viewingTicket.subcategory}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Status:</label>
                                                <span className="col-span-2">
                                                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusStyle(viewingTicket.status)}`}>
                                                        {viewingTicket.status}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Priority:</label>
                                                <span className="col-span-2">
                                                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full uppercase">
                                                        {viewingTicket.priority || 'MEDIUM'}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Created:</label>
                                                <span className="col-span-2 text-sm text-gray-900">{formatDate(viewingTicket.created_at)}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Updated:</label>
                                                <span className="col-span-2 text-sm text-gray-900">{formatDate(viewingTicket.updated_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                                    <p className="text-sm text-gray-700">{viewingTicket.description}</p>
                                </div>

                                {/* Update Form */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold mb-2">Update Ticket</h3>
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Add Remarks</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            rows="3"
                                            placeholder="Enter your remarks here..."
                                            value={newRemarks}
                                            onChange={(e) => setNewRemarks(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50 text-sm"
                                            onClick={handleAddRemarks}
                                            disabled={updateLoading || !newRemarks.trim()}
                                        >
                                            Add Remarks
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-medium disabled:opacity-50 text-sm"
                                            onClick={() => handleStatusChange(viewingTicket.ticket_id, 'In Progress', newRemarks)}
                                            disabled={updateLoading}
                                        >
                                            Mark as In Progress
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50 text-sm"
                                            onClick={() => handleStatusChange(viewingTicket.ticket_id, 'Resolved', newRemarks)}
                                            disabled={updateLoading}
                                        >
                                            Mark as Resolved
                                        </button>
                                    </div>
                                </div>

                                {/* Remarks History */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold mb-2">Remarks History</h3>
                                    <div className="space-y-2">
                                        {viewingTicket.remarksHistory?.map((remark, index) => (
                                            <div key={`${remark.timestamp}-${index}`} className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="font-medium text-sm">{remark.user}</span>
                                                        <p className="mt-2 text-sm text-gray-700">{remark.remarks}</p>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatDate(remark.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setViewingTicket(null)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </Modal>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Tickets; 