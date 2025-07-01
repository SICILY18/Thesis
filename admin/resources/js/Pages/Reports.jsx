import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';
import TicketCount from '@/Components/TicketCount';

const Reports = () => {
    const { auth } = usePage().props;
    const [profilePicture, setProfilePicture] = useState(null);
    const [activeTab, setActiveTab] = useState('paymentReport'); // Only 'paymentReport' or 'meter'
    const [accountType, setAccountType] = useState('All'); // Add this after other useState

    // Meter Reading state
    const [meterReadings, setMeterReadings] = useState([]);
    const [meterPagination, setMeterPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    });
    
    // Announcement state
    const [announcements, setAnnouncements] = useState([]);
    const [announcementStatus, setAnnouncementStatus] = useState('All');
    const [announcementPagination, setAnnouncementPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    });
    
    // Accounts state
    const [accounts, setAccounts] = useState([]);
    const [accountsType, setAccountsType] = useState('All');
    const [accountsPagination, setAccountsPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    });
    
    // Payment Report state
    const [paymentReports, setPaymentReports] = useState([]);
    const [paymentPagination, setPaymentPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    });
    
    const [loading, setLoading] = useState(false);

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

    // Fetch meter readings when activeTab is 'meter' or accountType changes
    useEffect(() => {
        if (activeTab === 'meter') {
            // Reset to page 1 when changing filters
            setMeterPagination(prev => ({ ...prev, current_page: 1 }));
            fetchMeterReadings(1);
        }
    }, [activeTab, accountType]);

    // Fetch announcements when activeTab is 'announcement' or status changes
    useEffect(() => {
        if (activeTab === 'announcement') {
            // Reset to page 1 when changing filters
            setAnnouncementPagination(prev => ({ ...prev, current_page: 1 }));
            fetchAnnouncementHistory(1);
        }
    }, [activeTab, announcementStatus]);

    // Fetch accounts when activeTab is 'accounts' or type changes
    useEffect(() => {
        if (activeTab === 'accounts') {
            // Reset to page 1 when changing filters
            setAccountsPagination(prev => ({ ...prev, current_page: 1 }));
            fetchAccountsData(1);
        }
    }, [activeTab, accountsType]);

    // Fetch payment reports when activeTab is 'paymentReport'
    useEffect(() => {
        if (activeTab === 'paymentReport') {
            setPaymentPagination(prev => ({ ...prev, current_page: 1 }));
            fetchPaymentReports(1);
        }
    }, [activeTab]);

    const fetchMeterReadings = async (page = 1) => {
        setLoading(true);
        try {
            console.log('Fetching meter readings with params:', { accountType, page });
            
            const response = await axios.get('/api/meter-readings', {
                params: {
                    accountType: accountType,
                    page: page
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Meter readings response:', response.data);
            
            if (response.data && response.data.success) {
                const meterData = response.data.data.data || response.data.data || [];
                setMeterReadings(meterData);
                
                // Update pagination state if pagination data is available
                if (response.data.data && response.data.data.current_page !== undefined) {
                    setMeterPagination({
                        current_page: response.data.data.current_page,
                        last_page: response.data.data.last_page,
                        per_page: response.data.data.per_page,
                        total: response.data.data.total,
                        from: response.data.data.from,
                        to: response.data.data.to
                    });
                } else {
                    // If no pagination data, assume single page
                    setMeterPagination(prev => ({
                        ...prev,
                        total: meterData.length,
                        from: 1,
                        to: meterData.length
                    }));
                }
            } else {
                console.error('Failed to fetch meter readings:', response.data?.message || 'Unknown error');
                setMeterReadings([]);
                setMeterPagination(prev => ({ ...prev, total: 0 }));
            }
        } catch (error) {
            console.error('Error fetching meter readings:', error);
            console.error('Error details:', error.response?.data || error.message);
            setMeterReadings([]);
            setMeterPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncementHistory = async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get('/api/announcements/history', {
                params: {
                    status: announcementStatus,
                    page: page
                }
            });
            
            if (response.data.success) {
                const announcements = response.data.data.data || response.data.data;
                setAnnouncements(announcements);
                
                // Update pagination state if pagination data is available
                if (response.data.data.current_page !== undefined) {
                    setAnnouncementPagination({
                        current_page: response.data.data.current_page,
                        last_page: response.data.data.last_page,
                        per_page: response.data.data.per_page,
                        total: response.data.data.total,
                        from: response.data.data.from,
                        to: response.data.data.to
                    });
                } else {
                    // If no pagination data, assume single page
                    setAnnouncementPagination(prev => ({
                        ...prev,
                        total: announcements.length,
                        from: 1,
                        to: announcements.length
                    }));
                }
            } else {
                console.error('Failed to fetch announcement history:', response.data.message);
                setAnnouncements([]);
                setAnnouncementPagination(prev => ({ ...prev, total: 0 }));
            }
        } catch (error) {
            console.error('Error fetching announcement history:', error);
            setAnnouncements([]);
            setAnnouncementPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    const fetchAccountsData = async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get('/api/accounts', {
                params: {
                    type: accountsType.toLowerCase(),
                    page: page
                }
            });
            if (response.data.success) {
                setAccounts(response.data.data.data || response.data.data);
                
                // Update pagination state if pagination data is available
                if (response.data.data.current_page !== undefined) {
                    setAccountsPagination({
                        current_page: response.data.data.current_page,
                        last_page: response.data.data.last_page,
                        per_page: response.data.data.per_page,
                        total: response.data.data.total,
                        from: response.data.data.from,
                        to: response.data.data.to
                    });
                }
            } else {
                console.error('Failed to fetch accounts:', response.data.message);
                setAccounts([]);
                setAccountsPagination(prev => ({ ...prev, total: 0 }));
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setAccounts([]);
            setAccountsPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentReports = async (page = 1) => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call when payment reports endpoint is available
            // For now, using sample data with pagination simulation
            const sampleData = [
                {
                    id: 1,
                    payment_date: '2024-03-20',
                    customer_name: 'John Doe',
                    account_number: '12345678',
                    payment_amount: 1500.00,
                    payment_method: 'Online',
                    status: 'Successful',
                    reference_number: 'PM123456789'
                },
                {
                    id: 2,
                    payment_date: '2024-03-19',
                    customer_name: 'Jane Smith',
                    account_number: '12345679',
                    payment_amount: 2200.00,
                    payment_method: 'Bank Transfer',
                    status: 'Successful',
                    reference_number: 'PM123456790'
                }
            ];

            setPaymentReports(sampleData);
            setPaymentPagination({
                current_page: 1,
                last_page: 1,
                per_page: 10,
                total: sampleData.length,
                from: 1,
                to: sampleData.length
            });
        } catch (error) {
            console.error('Error fetching payment reports:', error);
            setPaymentReports([]);
            setPaymentPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    // Pagination handlers for meter readings
    const handleMeterPageChange = (page) => {
        if (page >= 1 && page <= meterPagination.last_page) {
            fetchMeterReadings(page);
        }
    };

    const handleMeterPreviousPage = () => {
        if (meterPagination.current_page > 1) {
            handleMeterPageChange(meterPagination.current_page - 1);
        }
    };

    const handleMeterNextPage = () => {
        if (meterPagination.current_page < meterPagination.last_page) {
            handleMeterPageChange(meterPagination.current_page + 1);
        }
    };

    // Pagination handlers for announcements
    const handleAnnouncementPageChange = (page) => {
        if (page >= 1 && page <= announcementPagination.last_page) {
            fetchAnnouncementHistory(page);
        }
    };

    const handleAnnouncementPreviousPage = () => {
        if (announcementPagination.current_page > 1) {
            handleAnnouncementPageChange(announcementPagination.current_page - 1);
        }
    };

    const handleAnnouncementNextPage = () => {
        if (announcementPagination.current_page < announcementPagination.last_page) {
            handleAnnouncementPageChange(announcementPagination.current_page + 1);
        }
    };

    // Pagination handlers for accounts
    const handleAccountsPageChange = (page) => {
        if (page >= 1 && page <= accountsPagination.last_page) {
            fetchAccountsData(page);
        }
    };

    const handleAccountsPreviousPage = () => {
        if (accountsPagination.current_page > 1) {
            handleAccountsPageChange(accountsPagination.current_page - 1);
        }
    };

    const handleAccountsNextPage = () => {
        if (accountsPagination.current_page < accountsPagination.last_page) {
            handleAccountsPageChange(accountsPagination.current_page + 1);
        }
    };

    // Pagination handlers for payment reports
    const handlePaymentPageChange = (page) => {
        if (page >= 1 && page <= paymentPagination.last_page) {
            fetchPaymentReports(page);
        }
    };

    const handlePaymentPreviousPage = () => {
        if (paymentPagination.current_page > 1) {
            handlePaymentPageChange(paymentPagination.current_page - 1);
        }
    };

    const handlePaymentNextPage = () => {
        if (paymentPagination.current_page < paymentPagination.last_page) {
            handlePaymentPageChange(paymentPagination.current_page + 1);
        }
    };

    // Helper function to render pagination controls
    const renderPaginationControls = (pagination, handlePageChange, handlePreviousPage, handleNextPage) => {
        if (pagination.total === 0) return null;

        return (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={handlePreviousPage}
                        disabled={pagination.current_page === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={pagination.current_page === pagination.last_page}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing{' '}
                            <span className="font-medium">{pagination.from}</span> to{' '}
                            <span className="font-medium">{pagination.to}</span> of{' '}
                            <span className="font-medium">{pagination.total}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={handlePreviousPage}
                                disabled={pagination.current_page === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">Previous</span>
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </button>
                            
                            {/* Page Numbers */}
                            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => {
                                // Show first page, last page, current page, and pages around current page
                                const showPage = page === 1 || 
                                                page === pagination.last_page || 
                                                Math.abs(page - pagination.current_page) <= 1;
                                
                                if (!showPage) {
                                    // Show ellipsis
                                    if ((page === 2 && pagination.current_page > 4) || 
                                        (page === pagination.last_page - 1 && pagination.current_page < pagination.last_page - 3)) {
                                        return (
                                            <span
                                                key={page}
                                                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                                            >
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                }
                                
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                            page === pagination.current_page
                                                ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            
                            <button
                                onClick={handleNextPage}
                                disabled={pagination.current_page === pagination.last_page}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">Next</span>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

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
                                onClick={async () => {
                                    if (window.confirm('Are you sure you want to log out?')) {
                                        try {
                                            await axios.get('/sanctum/csrf-cookie');
                                            await axios.post('/admin/logout');
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
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
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
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                        <div className="relative flex-1 sm:flex-none">
                            <span className="material-symbols-outlined absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">search</span>
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full sm:w-auto pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Report Tabs */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex border-b mb-6">
                            <button
                                className={`px-4 py-2 font-medium ${activeTab === 'paymentReport' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('paymentReport')}
                            >
                                Payment Report
                            </button>
                            <button
                                className={`px-4 py-2 font-medium ${activeTab === 'meter' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('meter')}
                            >
                                Meter Reading Report
                            </button>
                            <button
                                className={`px-4 py-2 font-medium ${activeTab === 'announcement' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('announcement')}
                            >
                                Announcement History
                            </button>
                            <button
                                className={`px-4 py-2 font-medium ${activeTab === 'accounts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('accounts')}
                            >
                                Accounts Report
                            </button>
                            <button
                                className={`px-4 py-2 font-medium ${activeTab === 'reportHistory' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('reportHistory')}
                            >
                                Report History
                            </button>
                            <button
                                className={`px-4 py-2 font-medium ${activeTab === 'activityLogs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('activityLogs')}
                            >
                                Activity Logs
                            </button>
                        </div>

                        {/* Payment Report Table */}
                        {activeTab === 'paymentReport' && (
                            <div>
                                {/* Payment Report Filter Section */}
                                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <label className="font-medium text-gray-700">Payment Reports</label>

                        {/* Export Buttons */}
                                        <button className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <span className="material-symbols-outlined mr-1 text-sm">download</span>
                                Export to Excel
                            </button>
                                        <button className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                <span className="material-symbols-outlined mr-1 text-sm">picture_as_pdf</span>
                                Export to PDF
                            </button>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Total Records: {paymentPagination.total}
                                    </div>
                        </div>

                            <div className="overflow-x-auto">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <p className="mt-2 text-gray-600">Loading payment reports...</p>
                                        </div>
                                    ) : (
                                <table className="min-w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-2 px-4 font-semibold">Payment Date</th>
                                            <th className="py-2 px-4 font-semibold">Customer Name</th>
                                            <th className="py-2 px-4 font-semibold">Account Number</th>
                                            <th className="py-2 px-4 font-semibold">Payment Amount</th>
                                            <th className="py-2 px-4 font-semibold">Payment Method</th>
                                            <th className="py-2 px-4 font-semibold">Status</th>
                                            <th className="py-2 px-4 font-semibold">Reference Number</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                                {paymentReports.length > 0 ? (
                                                    paymentReports.map((payment) => (
                                                        <tr key={payment.id} className="border-b hover:bg-blue-50">
                                                            <td className="py-2 px-4">{payment.payment_date}</td>
                                                            <td className="py-2 px-4">{payment.customer_name}</td>
                                                            <td className="py-2 px-4">{payment.account_number}</td>
                                                            <td className="py-2 px-4">₱{parseFloat(payment.payment_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                            <td className="py-2 px-4">{payment.payment_method}</td>
                                            <td className="py-2 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                                    payment.status === 'Successful' ? 'bg-green-100 text-green-800' : 
                                                                    payment.status === 'Failed' ? 'bg-red-100 text-red-800' : 
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                    {payment.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-4">{payment.reference_number}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="py-8 px-4 text-center text-gray-500">
                                                            No payment reports found.
                                            </td>
                                        </tr>
                                                )}
                                    </tbody>
                                </table>
                                    )}
                                </div>
                                
                                {/* Pagination Controls for Payment Reports */}
                                {renderPaginationControls(paymentPagination, handlePaymentPageChange, handlePaymentPreviousPage, handlePaymentNextPage)}
                            </div>
                        )}

                        {/* Meter Reading Report Table */}
                        {activeTab === 'meter' && (
                            <div>
                                {/* Meter Reading Specific Filter */}
                                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <label htmlFor="meterAccountType" className="font-medium text-gray-700">Filter by Account Type:</label>
                                        <select
                                            id="meterAccountType"
                                            value={accountType}
                                            onChange={e => setAccountType(e.target.value)}
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                                        >
                                            <option value="All">All Account Types</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Residential">Residential</option>
                                            <option value="Government">Government</option>
                                        </select>
                                        
                                        {/* Export Buttons */}
                                        <button className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            <span className="material-symbols-outlined mr-1 text-sm">download</span>
                                            Export to Excel
                                        </button>
                                        <button className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                            <span className="material-symbols-outlined mr-1 text-sm">picture_as_pdf</span>
                                            Export to PDF
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Total Records: {meterPagination.total}
                                    </div>
                                </div>
                                
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-gray-600">Loading meter readings...</p>
                                    </div>
                                ) : (
                                <table className="min-w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-2 px-4 font-semibold">Reading Date</th>
                                            <th className="py-2 px-4 font-semibold">Customer Name</th>
                                            <th className="py-2 px-4 font-semibold">Account Number</th>
                                            <th className="py-2 px-4 font-semibold">Meter Number</th>
                                            <th className="py-2 px-4 font-semibold">Reading Value</th>
                                            <th className="py-2 px-4 font-semibold">Amount</th>
                                            <th className="py-2 px-4 font-semibold">Account Type</th>
                                            <th className="py-2 px-4 font-semibold">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                            {meterReadings.length > 0 ? (
                                                meterReadings.map((reading) => (
                                                    <tr key={reading.id} className="border-b hover:bg-blue-50">
                                                        <td className="py-2 px-4">
                                                            {reading.reading_date ? new Date(reading.reading_date).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className="py-2 px-4">{reading.customer_name || 'N/A'}</td>
                                                        <td className="py-2 px-4">{reading.account_number || 'N/A'}</td>
                                                        <td className="py-2 px-4">{reading.meter_number}</td>
                                                        <td className="py-2 px-4">{reading.reading_value}</td>
                                                        <td className="py-2 px-4">₱{parseFloat(reading.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                        <td className="py-2 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                reading.customer_type === 'residential' ? 'bg-blue-100 text-blue-800' :
                                                                reading.customer_type === 'commercial' ? 'bg-green-100 text-green-800' :
                                                                reading.customer_type === 'government' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {reading.customer_type ? reading.customer_type.charAt(0).toUpperCase() + reading.customer_type.slice(1) : 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-4">{reading.remarks || '-'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="py-8 px-4 text-center text-gray-500">
                                                        No meter readings found for the selected filters.
                                                    </td>
                                        </tr>
                                            )}
                                    </tbody>
                                </table>
                                )}
                                </div>
                                
                                {/* Pagination Controls for Meter Readings */}
                                {renderPaginationControls(meterPagination, handleMeterPageChange, handleMeterPreviousPage, handleMeterNextPage)}
                            </div>
                        )}

                        {/* Announcement History Table */}
                        {activeTab === 'announcement' && (
                            <div>
                                {/* Announcement History Specific Filter */}
                                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <label htmlFor="announcementStatus" className="font-medium text-gray-700">Filter by Status:</label>
                                        <select
                                            id="announcementStatus"
                                            value={announcementStatus}
                                            onChange={e => setAnnouncementStatus(e.target.value)}
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                                        >
                                            <option value="All">All Status</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        
                                        {/* Export Buttons */}
                                        <button className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            <span className="material-symbols-outlined mr-1 text-sm">download</span>
                                            Export to Excel
                                        </button>
                                        <button className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                            <span className="material-symbols-outlined mr-1 text-sm">picture_as_pdf</span>
                                            Export to PDF
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Total Records: {announcementPagination.total}
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <p className="mt-2 text-gray-600">Loading announcements...</p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full text-sm text-left">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="py-2 px-4 font-semibold">ID</th>
                                                    <th className="py-2 px-4 font-semibold">Title</th>
                                                    <th className="py-2 px-4 font-semibold">Content Preview</th>
                                                    <th className="py-2 px-4 font-semibold">Status</th>
                                                    <th className="py-2 px-4 font-semibold">Posted By</th>
                                                    <th className="py-2 px-4 font-semibold">Staff</th>
                                                    <th className="py-2 px-4 font-semibold">Published Date</th>
                                                    <th className="py-2 px-4 font-semibold">Expired Date</th>
                                                    <th className="py-2 px-4 font-semibold">Created</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {announcements.length > 0 ? (
                                                    announcements.map((announcement) => (
                                                        <tr key={announcement.id} className="border-b hover:bg-blue-50">
                                                            <td className="py-2 px-4">{announcement.id}</td>
                                                            <td className="py-2 px-4 font-medium">{announcement.title}</td>
                                                            <td className="py-2 px-4">
                                                                <div className="max-w-xs truncate" title={announcement.body}>
                                                                    {announcement.body ? announcement.body.substring(0, 50) + '...' : 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                                    announcement.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {announcement.status ? announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1) : 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-4">{announcement.posted_by || 'N/A'}</td>
                                                            <td className="py-2 px-4">Staff ID: {announcement.staff_id || 'N/A'}</td>
                                                            <td className="py-2 px-4">
                                                                {announcement.published_at ? new Date(announcement.published_at).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td className="py-2 px-4">
                                                                {announcement.expired_at ? new Date(announcement.expired_at).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td className="py-2 px-4">
                                                                {announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="9" className="py-8 px-4 text-center text-gray-500">
                                                            No announcements found for the selected filters.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                
                                {/* Pagination Controls for Announcements */}
                                {renderPaginationControls(announcementPagination, handleAnnouncementPageChange, handleAnnouncementPreviousPage, handleAnnouncementNextPage)}
                            </div>
                        )}

                        {/* Accounts Report Table */}
                        {activeTab === 'accounts' && (
                            <div>
                                {/* Accounts Specific Filter */}
                                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <label htmlFor="accountsType" className="font-medium text-gray-700">Filter by Account Type:</label>
                                        <select
                                            id="accountsType"
                                            value={accountsType}
                                            onChange={e => setAccountsType(e.target.value)}
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                                        >
                                            <option value="All">All Account Types</option>
                                            <option value="Staff">Staff</option>
                                            <option value="Customer">Customer</option>
                                        </select>
                                        
                                        {/* Export Buttons */}
                                        <button className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            <span className="material-symbols-outlined mr-1 text-sm">download</span>
                                            Export to Excel
                                        </button>
                                        <button className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                            <span className="material-symbols-outlined mr-1 text-sm">picture_as_pdf</span>
                                            Export to PDF
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Total Records: {accountsPagination.total}
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <p className="mt-2 text-gray-600">Loading accounts...</p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full text-sm text-left">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="py-2 px-4 font-semibold">ID</th>
                                                    <th className="py-2 px-4 font-semibold">Name</th>
                                                    <th className="py-2 px-4 font-semibold">Username/Email</th>
                                                    <th className="py-2 px-4 font-semibold">Account Type</th>
                                                    <th className="py-2 px-4 font-semibold">Contact Number</th>
                                                    <th className="py-2 px-4 font-semibold">Address</th>
                                                    <th className="py-2 px-4 font-semibold">Account Number</th>
                                                    <th className="py-2 px-4 font-semibold">Meter Number</th>
                                                    <th className="py-2 px-4 font-semibold">Role</th>
                                                    <th className="py-2 px-4 font-semibold">Created</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounts.length > 0 ? (
                                                    accounts.map((account) => (
                                                        <tr key={`${account.type}-${account.id}`} className="border-b hover:bg-blue-50">
                                                            <td className="py-2 px-4">{account.id}</td>
                                                            <td className="py-2 px-4 font-medium">
                                                                {account.first_name && account.last_name 
                                                                    ? `${account.first_name} ${account.last_name}` 
                                                                    : account.name || 'N/A'}
                                                            </td>
                                                            <td className="py-2 px-4">{account.username || account.email || 'N/A'}</td>
                                                            <td className="py-2 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                                    account.type === 'staff' ? 'bg-blue-100 text-blue-800' :
                                                                    account.customer_type === 'residential' ? 'bg-green-100 text-green-800' :
                                                                    account.customer_type === 'commercial' ? 'bg-purple-100 text-purple-800' :
                                                                    account.customer_type === 'government' ? 'bg-orange-100 text-orange-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {account.type === 'staff' ? 'Staff' : 
                                                                     account.customer_type ? account.customer_type.charAt(0).toUpperCase() + account.customer_type.slice(1) : 
                                                                     'Customer'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-4">{account.contact_number || account.phone_number || 'N/A'}</td>
                                                            <td className="py-2 px-4">
                                                                <div className="max-w-xs truncate" title={account.address}>
                                                                    {account.address || 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-4">{account.account_number || 'N/A'}</td>
                                                            <td className="py-2 px-4">{account.meter_number || 'N/A'}</td>
                                                            <td className="py-2 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                                    account.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                                                                    account.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                                                                    account.role === 'billhandler' ? 'bg-indigo-100 text-indigo-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {account.role ? account.role.charAt(0).toUpperCase() + account.role.slice(1) : 'Customer'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-4">
                                                                {account.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="10" className="py-8 px-4 text-center text-gray-500">
                                                            No accounts found for the selected filters.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                
                                {/* Pagination Controls for Accounts */}
                                {renderPaginationControls(accountsPagination, handleAccountsPageChange, handleAccountsPreviousPage, handleAccountsNextPage)}
                            </div>
                        )}

                        {/* Report History Stub */}
                        {activeTab === 'reportHistory' && (
                            <div className="text-center text-gray-600 py-12 text-lg">Report History content goes here...</div>
                        )}

                        {/* Activity Logs Stub */}
                        {activeTab === 'activityLogs' && (
                            <div className="text-center text-gray-600 py-12 text-lg">Activity Logs content goes here...</div>
                        )}
                    </div>
                </div>
            </div>
        </DynamicTitleLayout>
    );
};

export default Reports; 