import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';

const getStatusStyle = (status) => {
    const normalizedStatus = status?.toLowerCase();
    const styles = {
        'open': 'bg-green-200 text-green-800',
        'in progress': 'bg-yellow-200 text-yellow-800',
        'resolved': 'bg-red-300 text-red-800'
    };
    const style = styles[normalizedStatus] || 'bg-gray-200 text-gray-900';
    return `${style} px-3 py-1 rounded-full text-sm font-semibold flex items-center justify-center min-w-[100px]`;
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

const TABS = [
    { key: 'disputes', label: 'Disputes', status: 'Open' },
    { key: 'resolved', label: 'Resolved', status: 'Resolved' }
];

const Dispute = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewingTicket, setViewingTicket] = useState(null);
    const [activeTab, setActiveTab] = useState('disputes');
    const [meterReading, setMeterReading] = useState(null);
    const [meterLoading, setMeterLoading] = useState(false);
    const [meterError, setMeterError] = useState('');
    const [rate, setRate] = useState(null);

    // Move fetchMeterReading to component scope so it can be called after update
    const fetchMeterReading = async () => {
        if (!viewingTicket) {
            setMeterReading(null);
            setRate(null);
            return;
        }
        setMeterLoading(true);
        setMeterError('');
        try {
            // 1. Fetch the latest meter reading by meter_number from the ticket
            const meterNumber = viewingTicket.meter_number;
            const meterResponse = await axios.get('/admin/meter-readings', {
                params: { meter_number: meterNumber }
            });
            let latestReading = null;
            if (meterResponse.data && meterResponse.data.data && meterResponse.data.data.data && meterResponse.data.data.data.length > 0) {
                latestReading = meterResponse.data.data.data[0];
            }
            if (!latestReading) {
                setMeterError('No meter readings found for this meter number.');
                setMeterReading(null);
                return;
            }
            // 2. Fetch the customer info by meter_number using the new endpoint
            const customerResponse = await axios.get(`/api/customers/by-meter/${latestReading.meter_number}`);
            const customerData = customerResponse.data?.data || {};
            console.log('Fetched customer data:', customerData);
            console.log('Customer type used for rate:', customerData.customer_type);
            // 3. Fetch the rate for this customer type (normalize to lowercase and trim)
            const normalizedCustomerType = (customerData.customer_type || '').toLowerCase().trim();
            const rate = await fetchRate(normalizedCustomerType);
            console.log('Fetched rate:', rate);
            if (rate) {
                const readingValue = parseFloat(latestReading.reading_value);
                const amount = calculateAmount(readingValue, rate);
                setMeterReading({
                    ...latestReading,
                    reading_value: readingValue,
                    calculated_amount: amount,
                    customer: customerData
                });
            } else {
                setMeterReading({ ...latestReading, customer: customerData });
            }
        } catch (err) {
            setMeterError(err.response?.data?.message || 'Failed to fetch meter readings');
            setMeterReading(null);
        } finally {
            setMeterLoading(false);
        }
    };

    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get('/admin/tickets/data');
                if (response.data.success) {
                    setTickets(response.data.data || []);
                } else {
                    setError(response.data.message || 'Failed to fetch tickets');
                }
            } catch (err) {
                setError(err.message || 'Failed to fetch tickets');
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const filteredTickets = tickets.filter(ticket => {
        const normalizedSubject = ticket.subject?.toLowerCase().replace(/\s+/g, ' ').trim();
        const targetSubject = 'non-technical - billing concern (high/low billing)';
        
        return normalizedSubject === targetSubject &&
            ticket.status === (activeTab === 'disputes' ? 'Open' : 'Resolved');
    });

    // Fetch rate when customer type is available
    const fetchRate = async (customerType) => {
        try {
            const response = await axios.get('/api/rates', {
                params: { customer_type: customerType }
            });
            console.log('Raw Rate Response:', response.data);
            
            if (response.data && response.data.length > 0) {
                // Get the active rate
                const activeRate = response.data.find(r => r.status === 'active');
                if (activeRate) {
                    console.log('Active Rate Found:', {
                        ...activeRate,
                        rate_per_cu_m_type: typeof activeRate.rate_per_cu_m,
                        minimum_charge_type: typeof activeRate.minimum_charge
                    });
                    setRate(activeRate);
                    return activeRate;
                }
            }
            return null;
        } catch (err) {
            console.error('Error fetching rate:', err);
            return null;
        }
    };

    // Calculate amount based on reading value and rate
    const calculateAmount = (readingValue, rate) => {
        if (!rate || !readingValue) return 0;
        
        // Convert all values to numbers
        const reading = parseFloat(readingValue);
        const ratePerCuM = parseFloat(rate.rate_per_cu_m);
        const minimumCharge = parseFloat(rate.minimum_charge);
        
        // Debug logging
        console.log('=== Amount Calculation Debug ===');
        console.log('Reading Value:', reading, typeof reading);
        console.log('Rate per cu.m:', ratePerCuM, typeof ratePerCuM);
        console.log('Minimum Charge:', minimumCharge, typeof minimumCharge);
        
        const amount = (reading * ratePerCuM) + minimumCharge;
        console.log('Calculated Amount:', amount.toFixed(2));
        console.log('========================');
        
        return amount;
    };

    // Fetch meter reading and rate when viewingTicket changes
    useEffect(() => {
        if (viewingTicket) fetchMeterReading();
    }, [viewingTicket]);

    const handleUpdateMeterReading = async (newValue) => {
        if (!meterReading || !meterReading.id) {
            console.error('Cannot update: No meter reading ID found');
            return;
        }

        try {
            console.log('Updating meter reading:', {
                id: meterReading.id,
                newValue: newValue,
                currentReading: meterReading
            });

            const response = await axios.put(`/admin/meter-readings/${meterReading.id}`, {
                reading_value: parseFloat(newValue),
                amount: calculateAmount(parseFloat(newValue), rate),
                remarks: meterReading.remarks || '',
                status: meterReading.status || 'Recorded',
                reading_date: meterReading.reading_date,
                customer_id: meterReading.customer_id,
                meter_number: meterReading.meter_number,
                previous_reading: meterReading.previous_reading || 0,
                current_reading: parseFloat(newValue),
                consumption: parseFloat(newValue) - (meterReading.previous_reading || 0),
                rate_id: rate?.id
            });

            if (response.data && response.data.data) {
                console.log('Update successful:', response.data);
                setMeterReading(response.data.data);
            }
        } catch (err) {
            console.error('Failed to update meter reading:', err);
            alert('Failed to update meter reading. Please try again.');
        }
    };

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
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dispute Management</h2>
                    {/* Tabs */}
                    <div className="flex border-b mb-6">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                className={`px-6 py-2 -mb-px font-semibold focus:outline-none transition-colors border-b-2 ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-6 text-gray-500">No {activeTab === 'disputes' ? 'open disputes' : 'resolved disputes'} found.</td>
                                    </tr>
                                ) : filteredTickets.map((ticket, index) => (
                                    <tr key={ticket.id || ticket.ticket_reference || `ticket-${index}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">{ticket.subject || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center justify-center ${getStatusStyle(ticket.status)}`}>{ticket.status}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {ticket.created_at ? formatDate(ticket.created_at) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button 
                                                onClick={() => setViewingTicket(ticket)}
                                                className="bg-yellow-500 text-white px-6 py-1 rounded hover:bg-yellow-600 transition-colors font-medium"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                                {/* Ticket Information */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Ticket Information</h3>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <label className="text-sm font-medium text-gray-700">Reference:</label>
                                            <span className="col-span-2 text-sm text-gray-900">{viewingTicket.ticket_reference}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <label className="text-sm font-medium text-gray-700">Subject:</label>
                                            <span className="col-span-2 text-sm text-gray-900">{viewingTicket.subject}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <label className="text-sm font-medium text-gray-700">Status:</label>
                                            <span className="col-span-2">
                                                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusStyle(viewingTicket.status)}`}>{viewingTicket.status}</span>
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
                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                                    <p className="text-sm text-gray-700">{viewingTicket.description}</p>
                                </div>
                            </div>
                            {/* Meter Reading Info */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-2">Latest Meter Reading</h3>
                                {meterLoading ? (
                                    <p className="text-gray-500">Loading meter reading...</p>
                                ) : meterError ? (
                                    <p className="text-red-500">{meterError}</p>
                                ) : meterReading ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <label className="text-sm font-medium text-gray-700">Meter Number:</label>
                                            <span className="col-span-2 text-sm text-gray-900">{meterReading.meter_number}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <label className="text-sm font-medium text-gray-700">Reading Value:</label>
                                            <div className="col-span-2 flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    className="border rounded px-2 py-1 text-sm w-32"
                                                    value={meterReading.reading_value}
                                                    onChange={(e) => {
                                                        const newValue = parseFloat(e.target.value);
                                                        const newAmount = calculateAmount(newValue, rate);
                                                        setMeterReading({
                                                            ...meterReading,
                                                            reading_value: newValue,
                                                            calculated_amount: newAmount
                                                        });
                                                    }}
                                                />
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            setMeterLoading(true);
                                                            setMeterError('');
                                                            
                                                            console.log('Current meter reading:', meterReading);
                                                            
                                                            if (!meterReading.id) {
                                                                setMeterError('Cannot update: No meter reading ID found');
                                                                return;
                                                            }

                                                            // Refresh CSRF token
                                                            await axios.get('/sanctum/csrf-cookie');

                                                            const readingValue = parseFloat(meterReading.reading_value);
                                                            const calculatedAmount = calculateAmount(readingValue, rate);

                                                            console.log('Saving with values:', {
                                                                readingValue,
                                                                calculatedAmount,
                                                                remarks: meterReading.remarks
                                                            });

                                                            const updateData = {
                                                                reading_value: readingValue,
                                                                amount: calculatedAmount,
                                                                remarks: meterReading.remarks || ''
                                                            };

                                                            const response = await axios.put(`/admin/meter-readings/${meterReading.id}`, updateData);
                                                            
                                                            if (response.data && response.data.data) {
                                                                console.log('Update successful:', response.data);
                                                                // Keep the ID in the updated data
                                                                setMeterReading({
                                                                    ...response.data.data,
                                                                    id: meterReading.id
                                                                });
                                                                // Refetch the latest meter reading from the backend
                                                                await fetchMeterReading();
                                                                // Optionally show a success message (not implemented here, but you can add a state for it)
                                                            }
                                                        } catch (err) {
                                                            console.error('Error updating meter reading:', err);
                                                            setMeterError(err.response?.data?.message || 'Failed to update meter reading');
                                                        } finally {
                                                            setMeterLoading(false);
                                                        }
                                                    }}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                                                    disabled={meterLoading}
                                                >
                                                    {meterLoading ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <label className="text-sm font-medium text-gray-700">Amount:</label>
                                            <span className="col-span-2 text-sm text-gray-900">
                                                ₱{meterReading.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {rate && (
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Rate Info:</label>
                                                <div className="col-span-2 text-sm text-gray-600">
                                                    <p>Rate per cu.m: ₱{rate.rate_per_cu_m.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    <p>Minimum Charge: ₱{rate.minimum_charge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <label className="text-sm font-medium text-gray-700">Reading Date:</label>
                                            <span className="col-span-2 text-sm text-gray-900">{formatDate(meterReading.reading_date)}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <label className="text-sm font-medium text-gray-700">Remarks:</label>
                                            <span className="col-span-2 text-sm text-gray-900">{meterReading.remarks || '-'}</span>
                                        </div>
                                        {meterReading.customer && (
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <label className="text-sm font-medium text-gray-700">Account Number:</label>
                                                <span className="col-span-2 text-sm text-gray-900">{meterReading.customer.account_number || '-'}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No meter reading found for this customer.</p>
                                )}
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
        </AdminLayout>
    );
};

export default Dispute; 