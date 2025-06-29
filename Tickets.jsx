import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TicketForm from '../components/TicketForm';

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewing, setViewing] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateData, setUpdateData] = useState({
        status: '',
        priority: '',
        remarks: ''
    });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await axios.get('/api/tickets');
            if (response.data.success) {
                setTickets(response.data.data);
            }
        } catch (error) {
            setError('Error fetching tickets');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            const response = await axios.put(`/api/tickets/${viewing.ticket_reference}`, {
                status: updateData.status || viewing.status,
                priority: updateData.priority || viewing.priority,
                ticket_remarks: updateData.remarks
            });

            if (response.data.success) {
                // Update the tickets list
                setTickets(tickets.map(ticket => 
                    ticket.ticket_reference === viewing.ticket_reference 
                        ? response.data.data 
                        : ticket
                ));

                // Update the viewing ticket
                setViewing(response.data.data);

                // Reset form and close modal
                setUpdateData({ status: '', priority: '', remarks: '' });
                setShowUpdateModal(false);
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            alert('Error updating ticket');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'open': 'bg-yellow-100 text-yellow-800',
            'in progress': 'bg-blue-100 text-blue-800',
            'resolved': 'bg-green-100 text-green-800',
            'closed': 'bg-gray-100 text-gray-800'
        };

        return `px-2 py-1 text-xs font-medium rounded-full ${
            statusClasses[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
        }`;
    };

    const getPriorityBadge = (priority) => {
        const priorityClasses = {
            'low': 'bg-green-100 text-green-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'high': 'bg-red-100 text-red-800'
        };

        return `px-2 py-1 text-xs font-medium rounded-full ${
            priorityClasses[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800'
        }`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
            </div>

            {/* Tickets Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ticket
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
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setViewing(ticket);
                                                setShowViewModal(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => {
                                                setViewing(ticket);
                                                setShowUpdateModal(true);
                                            }}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Update
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {showViewModal && viewing && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Ticket Details</h3>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                                <p className="text-gray-700 whitespace-pre-wrap">{viewing.description}</p>
                            </div>
                        </div>

                        {/* Remarks History */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Remarks History</h4>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                {viewing.remarks_history ? (
                                    <div className="space-y-4">
                                        {JSON.parse(viewing.remarks_history).map((remark, index) => (
                                            <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                                                <div className="flex justify-between items-start">
                                                    <div className="text-sm font-medium text-gray-900">{remark.user}</div>
                                                    <div className="text-sm text-gray-500">{formatDate(remark.timestamp)}</div>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-700">{remark.remarks}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No remarks history available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Modal */}
            {showUpdateModal && viewing && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Update Ticket</h3>
                            <button
                                onClick={() => {
                                    setShowUpdateModal(false);
                                    setUpdateData({ status: '', priority: '', remarks: '' });
                                }}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSubmit} className="space-y-6">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={updateData.status || viewing.status}
                                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    value={updateData.priority || viewing.priority}
                                    onChange={(e) => setUpdateData({ ...updateData, priority: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Add Remarks
                                </label>
                                <textarea
                                    value={updateData.remarks}
                                    onChange={(e) => setUpdateData({ ...updateData, remarks: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Add your remarks here..."
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {updating ? 'Updating...' : 'Update Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets; 