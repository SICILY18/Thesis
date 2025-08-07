import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import TicketCount from '@/Components/TicketCount';
import axios from 'axios';
import FormRecovery from '@/Components/FormRecovery';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Get CSRF token from meta tag
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found');
}

// Before making any request, get a fresh CSRF cookie
const setupCsrf = async () => {
    try {
        const response = await axios.get('/sanctum/csrf-cookie');
        // Update the CSRF token after getting a fresh cookie
        const newToken = document.head.querySelector('meta[name="csrf-token"]');
        if (newToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken.content;
        }
        return true;
    } catch (error) {
        console.error('Error fetching CSRF cookie:', error);
        return false;
    }
};

// Retry function for failed requests
const retryRequest = async (fn, maxRetries = 2) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await setupCsrf(); // Get fresh CSRF token before retry
            return await fn();
        } catch (error) {
            if (error.response?.status === 419 && i < maxRetries - 1) {
                console.log('CSRF token mismatch, retrying...');
                continue;
            }
            throw error;
        }
    }
};

const SMSConfiguration = ({ dueSoonCustomers = [] }) => {
    const { auth } = usePage().props;
    const [profilePicture, setProfilePicture] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('automated');
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [reminderTemplate, setReminderTemplate] = useState('');
    const [sendingBulk, setSendingBulk] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [customersError, setCustomersError] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState([]);

    useEffect(() => {
        setupCsrf(); // Get fresh CSRF cookie when component mounts
        fetchProfileData();
        fetchSMSTemplate();
    }, []);

    const fetchProfileData = async () => {
        try {
            console.log('Fetching profile data for header...');
            const response = await axios.get('/api/admin/profile');
            if (response.data?.success && response.data?.data?.profile_picture) {
                console.log('New profile picture URL:', response.data.data.profile_picture);
                setProfilePicture(response.data.data.profile_picture);
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    };

    const fetchSMSTemplate = async () => {
        try {
            await setupCsrf(); // Get fresh CSRF cookie before request
            const response = await axios.get('/admin/sms-configuration/default-template');
            if (response.data?.template) {
            setReminderTemplate(response.data.template);
            } else {
                // Set default template if response doesn't contain one
                setReminderTemplate(
                    "Dear valued customer,\n\n" +
                    "This is a reminder that your water bill for {billing_period} amounting to ₱{amount} " +
                    "is due on {due_date}. Please settle your bill to avoid any service interruption.\n\n" +
                    "Thank you,\nHermosa Water District"
                );
            }
        } catch (error) {
            console.error('Error fetching SMS template:', error);
            // Set default template on error
            setReminderTemplate(
                "Dear valued customer,\n\n" +
                "This is a reminder that your water bill for {billing_period} amounting to ₱{amount} " +
                "is due on {due_date}. Please settle your bill to avoid any service interruption.\n\n" +
                "Thank you,\nHermosa Water District"
            );
        }
    };

    const handleTestSMS = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const makeRequest = async () => {
                const response = await axios.post('/admin/sms-configuration/test-sms', {
                phoneNumber,
                message
                });
                return response;
            };

            const response = await retryRequest(makeRequest);
            
            if (response.data.success) {
                    setSuccess('SMS sent successfully!');
                    setPhoneNumber('');
                    setMessage('');
            } else {
                throw new Error(response.data.error || 'Failed to send SMS');
            }
        } catch (err) {
            console.error('Error sending SMS:', err);
            if (err.response?.status === 419) {
                setError('Session expired. Please refresh the page and try again.');
            } else {
                setError(err.response?.data?.error || 'An error occurred while sending the SMS');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerSelect = (customerId) => {
        setSelectedCustomers(prev => {
            if (prev.includes(customerId)) {
                return prev.filter(id => id !== customerId);
            } else {
                return [...prev, customerId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0) {
            // If all are selected, unselect all
            setSelectedCustomers([]);
        } else {
            // Select all filtered customers
            const customerIds = filteredCustomers.map(customer => customer.id);
            setSelectedCustomers(customerIds);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const handleSendBulkReminders = async () => {
        if (selectedCustomers.length === 0) {
            setError('Please select at least one customer');
            return;
        }

        setSendingBulk(true);
        setError('');
        setSuccess('');

        try {
            const makeRequest = async () => {
                const response = await axios.post('/admin/sms-configuration/send-bulk-reminders', {
                customerIds: selectedCustomers,
                message: reminderTemplate
            });
                return response;
            };

            const response = await retryRequest(makeRequest);

            if (response.data.success) {
                    setSuccess('Reminders sent successfully!');
                    setSelectedCustomers([]);
            } else {
                setError(response.data.error || 'Failed to send reminders');
            }
        } catch (err) {
            console.error('Error sending reminders:', err);
            if (err.response?.status === 419) {
                setError('Session expired. Please refresh the page and try again.');
            } else {
            setError(err.response?.data?.error || 'An error occurred while sending reminders');
            }
        } finally {
            setSendingBulk(false);
        }
    };

    // Add this function to check if we have customers
    const hasCustomers = dueSoonCustomers && dueSoonCustomers.length > 0;

    // Add new function to fetch customers by date
    const fetchCustomersByDate = async (date) => {
        try {
            setIsLoadingCustomers(true);
            setCustomersError('');
            const response = await axios.get(`/admin/sms-configuration/customers-by-end-date?end_date=${date}`);
            setFilteredCustomers(response.data.customers || []);
            setSelectedCustomers([]); // Reset selected customers when date changes
        } catch (error) {
            console.error('Error fetching customers:', error);
            setCustomersError('Failed to load customers. Please try again.');
            setFilteredCustomers([]); // Reset on error
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    // Add handler for date change
    const handleDateChange = (e) => {
        const date = e.target.value;
        setSelectedDate(date);
        if (date) {
            fetchCustomersByDate(date);
        } else {
            setFilteredCustomers([]);
        }
    };

    // Add form recovery handler
    const handleFormRecovery = (data) => {
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
        if (data.message) setMessage(data.message);
        if (data.reminderTemplate) setReminderTemplate(data.reminderTemplate);
        if (data.selectedCustomers) setSelectedCustomers(JSON.parse(data.selectedCustomers));
    };

    const renderAutomatedTab = () => (
        <div className="space-y-6">
            <FormRecovery formId="sms-automated-form" onRecover={handleFormRecovery} />
            <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Payment Reminders</h3>
                <p className="text-gray-600 mb-6">Select a due date to send payment reminders to customers.</p>

                {/* Add Date Picker */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Due Date
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div className="mb-6">
                    <h4 className="font-medium mb-2">SMS Template</h4>
                    <textarea
                        value={reminderTemplate}
                        onChange={(e) => setReminderTemplate(e.target.value)}
                        className="w-full h-32 p-2 border rounded-md"
                        placeholder="Enter SMS template..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Available variables: {'{billing_period}'}, {'{amount}'}, {'{due_date}'}
                    </p>
                </div>

                {customersError && (
                    <div className="mb-4 text-red-600 text-sm">
                        {customersError}
                    </div>
                )}

                {isLoadingCustomers ? (
                    <div className="mb-4 text-gray-600 text-sm">
                        Loading customers...
                    </div>
                ) : selectedDate && filteredCustomers.length === 0 ? (
                    <div className="mb-4 text-gray-600 text-sm">
                        No customers found with bills due on {selectedDate}.
                    </div>
                ) : !selectedDate ? (
                    <div className="mb-4 text-gray-600 text-sm">
                        Please select a due date to view customers.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-blue-600"
                                                checked={filteredCustomers.length > 0 && selectedCustomers.length === filteredCustomers.length}
                                                onChange={handleSelectAll}
                                            />
                                            <span className="ml-2">Select All</span>
                                        </label>
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Account Number
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer Name
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount Due
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due Date
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone Number
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-blue-600"
                                                checked={selectedCustomers.includes(customer.id)}
                                                onChange={() => handleCustomerSelect(customer.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {customer.account_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {customer.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {formatAmount(customer.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {formatDate(customer.due_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {customer.phone_number}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {error && <InputError message={error} className="mt-4" />}
                {success && (
                    <div className="mt-4 text-sm text-green-600">
                        {success}
                    </div>
                )}

                <div className="mt-6">
                    <PrimaryButton
                        onClick={handleSendBulkReminders}
                        disabled={sendingBulk || selectedCustomers.length === 0}
                    >
                        {sendingBulk ? 'Sending...' : `Send Reminders (${selectedCustomers.length} selected)`}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );

    const renderManualTab = () => (
        <div className="space-y-6">
            <FormRecovery formId="sms-manual-form" onRecover={handleFormRecovery} />
            <form id="sms-manual-form" onSubmit={handleTestSMS} className="bg-white rounded-lg p-6">
                    <div>
                        <InputLabel htmlFor="phoneNumber" value="Phone Number" />
                        <TextInput
                            id="phoneNumber"
                            type="text"
                            value={phoneNumber}
                            className="mt-1 block w-full"
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g., 09123456789"
                            required
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="message" value="Message" />
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            rows="4"
                            required
                        />
                    </div>

                    {error && <InputError message={error} className="mt-2" />}
                    {success && (
                        <div className="mt-2 text-sm text-green-600">
                            {success}
                        </div>
                    )}

                    <PrimaryButton disabled={loading}>
                        {loading ? 'Sending...' : 'Send SMS'}
                    </PrimaryButton>
                </form>
        </div>
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
                            <Link href="/admin/dispute" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/dispute' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="material-symbols-outlined mr-3">gavel</span>
                                Dispute
                            </Link>
                            <Link href="/admin/sms-configuration" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/sms-configuration' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="material-symbols-outlined mr-3">sms</span>
                                SMS Configuration
                            </Link>
                            <Link href="/admin/profile" className={`flex items-center px-6 py-3 text-base ${window.location.pathname === '/admin/profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="material-symbols-outlined mr-3">person</span>
                                Profile
                            </Link>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={async () => {
                                    if (window.confirm('Are you sure you want to log out?')) {
                                        try {
                                            await fetch('/sanctum/csrf-cookie');
                                            await fetch('/admin/logout', { method: 'POST' });
                                            window.location.href = '/';
                                        } catch (error) {
                                            window.location.href = '/';
                                        }
                                    }
                                }}
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
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">SMS Configuration</h1>
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

                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="flex">
                                <button
                                    onClick={() => setActiveTab('automated')}
                                    className={`px-6 py-4 text-sm font-medium ${
                                        activeTab === 'automated'
                                            ? 'border-b-2 border-blue-500 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Payment Reminders
                                </button>
                                <button
                                    onClick={() => setActiveTab('manual')}
                                    className={`px-6 py-4 text-sm font-medium ${
                                        activeTab === 'manual'
                                            ? 'border-b-2 border-blue-500 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Manual SMS
                                </button>
                            </nav>
                        </div>

                        <div className="p-6">
                            {activeTab === 'automated' ? renderAutomatedTab() : renderManualTab()}
                        </div>
                    </div>
                </div>
            </div>
        </DynamicTitleLayout>
    );
};

export default SMSConfiguration; 