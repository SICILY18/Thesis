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
    const [exporting, setExporting] = useState(false);

    // Printable report states
    const [showPaymentReport, setShowPaymentReport] = useState(false);
    const [showMeterReport, setShowMeterReport] = useState(false);
    const [showAnnouncementReport, setShowAnnouncementReport] = useState(false);
    const [showAccountsReport, setShowAccountsReport] = useState(false);
    
    // Printable report data
    const [printablePaymentData, setPrintablePaymentData] = useState(null);
    const [printableMeterData, setPrintableMeterData] = useState(null);
    const [printableAnnouncementData, setPrintableAnnouncementData] = useState(null);
    const [printableAccountsData, setPrintableAccountsData] = useState(null);

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
            
            const response = await axios.get('/admin/meter-readings', {
                params: {
                    accountType: accountType !== 'All' ? accountType : null,
                    page: page,
                    per_page: 10
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
            console.log('Fetching payment reports with params:', { page });
            
            const response = await axios.get('/admin/bill-payment-validation', {
                params: {
                    page: page,
                    per_page: 10,
                    status: 'All'
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Raw API Response:', response.data);
            
            if (response.data && response.data.success) {
                // The backend now returns properly paginated data
                const responseData = response.data.data;
                const mappedData = responseData.data.map(payment => {
                    return {
                        id: payment.id,
                        payment_date: payment.payment_date || 'N/A',
                        customer: payment.name || payment.full_name || 'N/A',
                        account_number: payment.account_number || 'N/A',
                        period: payment.period || payment.billing_period || 'N/A',
                        amount: payment.amount || payment.amount_paid || 0,
                        bill_amount: payment.bill_amount || 0,
                        due_date: payment.due_date || 'N/A',
                        payment_method: payment.payment_method || 'N/A',
                        reference: payment.reference || payment.payment_reference || 'N/A',
                        status: payment.status || payment.payment_status || 'N/A',
                        account_type: payment.account_type || payment.bill_type || 'N/A',
                        validated_at: payment.validated_at || null
                    };
                });

                console.log('Mapped Data:', mappedData);
                setPaymentReports(mappedData);
                
                // Update pagination state with server-provided data
                setPaymentPagination({
                    current_page: responseData.current_page,
                    last_page: responseData.last_page,
                    per_page: responseData.per_page,
                    total: responseData.total,
                    from: responseData.from,
                    to: responseData.to
                });
            } else {
                console.error('Failed to fetch payment reports:', response.data);
                setPaymentReports([]);
                setPaymentPagination(prev => ({ ...prev, total: 0 }));
            }
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

    // Export functions
    const handleExportPaymentReportsPdf = async () => {
        setExporting(true);
        try {
            console.log('Loading payment reports for printing...');

            // Fetch all payment reports data
            const response = await axios.get('/admin/bill-payment-validation', {
                params: {
                    per_page: 10000, // Large number to get all records
                    status: 'All'
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                const responseData = response.data.data;
                const allPaymentReports = responseData.data.map(payment => {
                    return {
                        id: payment.id,
                        payment_date: payment.payment_date || 'N/A',
                        customer: payment.name || payment.full_name || 'N/A',
                        account_number: payment.account_number || 'N/A',
                        period: payment.period || payment.billing_period || 'N/A',
                        amount: payment.amount || payment.amount_paid || 0,
                        bill_amount: payment.bill_amount || 0,
                        due_date: payment.due_date || 'N/A',
                        payment_method: payment.payment_method || 'N/A',
                        reference: payment.reference || payment.payment_reference || 'N/A',
                        status: payment.status || payment.payment_status || 'N/A',
                        account_type: payment.account_type || payment.bill_type || 'N/A',
                        validated_at: payment.validated_at || null
                    };
                });

                const totalAmount = allPaymentReports.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
                
                setPrintablePaymentData({
                    payments: allPaymentReports,
                    total_records: allPaymentReports.length,
                    total_amount: totalAmount,
                    generated_at: new Date().toLocaleString()
                });
                setShowPaymentReport(true);
            }
        } catch (error) {
            console.error('Error loading payment reports for printing:', error);
            alert('Error loading payment reports. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleExportMeterReadingsPdf = async () => {
        setExporting(true);
        try {
            console.log('Loading meter readings for printing...');

            // Fetch all meter readings data
            const response = await axios.get('/admin/meter-readings', {
                params: {
                    per_page: 10000, // Large number to get all records
                    accountType: accountType !== 'All' ? accountType : null
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                const responseData = response.data.data;
                const allMeterReadings = responseData.data.map(reading => {
                    return {
                        id: reading.id,
                        reading_date: reading.reading_date || 'N/A',
                        customer_name: reading.full_name || reading.customer_name || reading.name || 'N/A',
                        account_number: reading.account_number || 'N/A',
                        meter_number: reading.meter_number || 'N/A',
                        reading_value: reading.current_reading || reading.reading_value || 'N/A',
                        amount: reading.bill_amount || reading.amount || 0,
                        account_type: reading.customer_type || reading.account_type || reading.bill_type || 'N/A',
                        remarks: reading.remarks || reading.notes || 'N/A'
                    };
                });

                const totalAmount = allMeterReadings.reduce((sum, reading) => sum + parseFloat(reading.amount || 0), 0);
                
                setPrintableMeterData({
                    readings: allMeterReadings,
                    total_records: allMeterReadings.length,
                    total_amount: totalAmount,
                    account_type_filter: accountType,
                    generated_at: new Date().toLocaleString()
                });
                setShowMeterReport(true);
            }
        } catch (error) {
            console.error('Error loading meter readings for printing:', error);
            alert('Error loading meter readings. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleExportAnnouncementsPdf = async () => {
        setExporting(true);
        try {
            console.log('Loading announcements for printing...');

            // Fetch all announcements data
            const response = await axios.get('/api/announcements/history', {
                params: {
                    per_page: 10000, // Large number to get all records
                    status: announcementStatus !== 'All' ? announcementStatus : null
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                const responseData = response.data.data;
                const allAnnouncements = responseData.data.map(announcement => {
                    return {
                        id: announcement.id,
                        title: announcement.title || 'N/A',
                        body: announcement.body || announcement.content || announcement.message || 'N/A',
                        status: announcement.status || 'N/A',
                        created_at: announcement.created_at || 'N/A',
                        updated_at: announcement.updated_at || 'N/A'
                    };
                });
                
                setPrintableAnnouncementData({
                    announcements: allAnnouncements,
                    total_records: allAnnouncements.length,
                    status_filter: announcementStatus,
                    generated_at: new Date().toLocaleString()
                });
                setShowAnnouncementReport(true);
            }
        } catch (error) {
            console.error('Error loading announcements for printing:', error);
            alert('Error loading announcements. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleExportAccountsPdf = async () => {
        setExporting(true);
        try {
            console.log('Loading accounts for printing...');

            // Fetch all accounts data
            const response = await axios.get('/api/accounts', {
                params: {
                    type: accountsType.toLowerCase(),
                    per_page: 10000
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                const responseData = response.data.data;
                const allAccounts = responseData.data.map(account => {
                    return {
                        id: account.id,
                        full_name: account.full_name || account.name || 'N/A',
                        account_number: account.account_number || 'N/A',
                        account_type: account.customer_type || account.account_type || account.type || 'N/A',
                        address: account.address || account.location || 'N/A',
                        contact_number: account.phone_number || account.contact_number || account.phone || account.mobile || 'N/A',
                        email: account.email || account.email_address || 'N/A',
                        status: account.status || account.account_status || 'Active',
                        created_at: account.created_at || account.date_created || 'N/A'
                    };
                });
                
                setPrintableAccountsData({
                    accounts: allAccounts,
                    total_records: allAccounts.length,
                    account_type_filter: accountsType,
                    generated_at: new Date().toLocaleString()
                });
                setShowAccountsReport(true);
            }
        } catch (error) {
            console.error('Error loading accounts for printing:', error);
            alert('Error loading accounts. Please try again.');
        } finally {
            setExporting(false);
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

    // Printable Report Components
    const PrintablePaymentReport = ({ data, onClose }) => {
        if (!data) return null;

        return (
            <div className="bg-white p-4 mb-6">
                <style jsx>{`
                    @media print {
                        @page {
                            size: A4 landscape;
                            margin: 0.5in;
                        }
                        body {
                            font-size: 10px !important;
                            line-height: 1.2 !important;
                        }
                        .print-table {
                            font-size: 8px !important;
                            line-height: 1.1 !important;
                        }
                        .print-table th,
                        .print-table td {
                            padding: 2px 4px !important;
                            white-space: nowrap !important;
                            overflow: hidden !important;
                            text-overflow: ellipsis !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>
                
                <div className="flex justify-between items-center mb-4 no-print">
                    <h2 className="text-xl font-bold text-gray-900">Payment Reports - Printable View</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <span className="material-symbols-outlined mr-1 text-sm">print</span>
                            Print to PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined mr-1 text-sm">close</span>
                            Close
                        </button>
                    </div>
                </div>

                <div className="text-center mb-4 border-b-2 border-gray-300 pb-2">
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Payment Reports</h1>
                    <p className="text-sm text-gray-600">Generated on: {data.generated_at}</p>
                    <p className="text-sm text-gray-600">Hermosa Water District Management System</p>
                </div>

                <div className="bg-gray-50 p-2 rounded mb-4">
                    <div className="flex justify-center gap-6 text-sm">
                        <div className="font-bold">
                            <span className="text-gray-700">Total Records:</span> {data.total_records.toLocaleString()}
                        </div>
                        <div className="font-bold">
                            <span className="text-gray-700">Total Amount:</span> ₱{data.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 print-table" style={{fontSize: '8px'}}>
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '8%'}}>Date</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '12%'}}>Customer</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '8%'}}>Account#</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '8%'}}>Period</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '8%'}}>Amount</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '8%'}}>Method</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '10%'}}>Reference</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '6%'}}>Status</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '8%'}}>Type</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '8%'}}>Bill Amt</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '8%'}}>Due Date</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '8%'}}>Validated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px'}}>
                                        {payment.payment_date !== 'N/A' ? new Date(payment.payment_date).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: '2-digit'}) : 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={payment.customer}>
                                        {payment.customer.length > 15 ? payment.customer.substring(0, 15) + '...' : payment.customer}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-center" style={{fontSize: '7px'}}>{payment.account_number}</td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px'}}>
                                        {payment.period.length > 8 ? payment.period.substring(0, 8) + '...' : payment.period}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-right" style={{fontSize: '7px'}}>
                                        ₱{parseFloat(payment.amount).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px'}}>
                                        {payment.payment_method.length > 8 ? payment.payment_method.substring(0, 8) + '...' : payment.payment_method}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px'}}>
                                        {payment.reference.length > 12 ? payment.reference.substring(0, 12) + '...' : payment.reference}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-center" style={{fontSize: '7px'}}>
                                        <span className={`px-1 py-0.5 rounded text-xs ${
                                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`} style={{fontSize: '6px'}}>
                                            {payment.status === 'completed' ? 'PAID' : 
                                             payment.status === 'pending' ? 'UNPAID' : 
                                             payment.status.toUpperCase().substring(0, 6)}
                                        </span>
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px'}}>
                                        {payment.account_type.length > 8 ? payment.account_type.substring(0, 8) + '...' : payment.account_type}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-right" style={{fontSize: '7px'}}>
                                        ₱{parseFloat(payment.bill_amount).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px'}}>
                                        {payment.due_date !== 'N/A' ? new Date(payment.due_date).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: '2-digit'}) : 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px'}}>
                                        {payment.validated_at ? new Date(payment.validated_at).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'}) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-center mt-4 text-xs text-gray-600 border-t border-gray-300 pt-2">
                    <p>Report contains {data.total_records.toLocaleString()} payment records with total amount of ₱{data.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}.</p>
                    <p>To save as PDF, use your browser's "Print" function and select "Save as PDF" as the destination.</p>
                </div>
            </div>
        );
    };

    const PrintableMeterReport = ({ data, onClose }) => {
        if (!data) return null;

        return (
            <div className="bg-white p-4 mb-6">
                <style jsx>{`
                    @media print {
                        @page {
                            size: A4 landscape;
                            margin: 0.5in;
                        }
                        body {
                            font-size: 10px !important;
                            line-height: 1.2 !important;
                        }
                        .print-table {
                            font-size: 9px !important;
                            line-height: 1.1 !important;
                        }
                        .print-table th,
                        .print-table td {
                            padding: 3px 5px !important;
                            white-space: nowrap !important;
                            overflow: hidden !important;
                            text-overflow: ellipsis !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>
                
                <div className="flex justify-between items-center mb-4 no-print">
                    <h2 className="text-xl font-bold text-gray-900">Meter Readings Report - Printable View</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <span className="material-symbols-outlined mr-1 text-sm">print</span>
                            Print to PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined mr-1 text-sm">close</span>
                            Close
                        </button>
                    </div>
                </div>

                <div className="text-center mb-4 border-b-2 border-gray-300 pb-2">
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Meter Readings Report</h1>
                    <p className="text-sm text-gray-600">Generated on: {data.generated_at}</p>
                    {data.account_type_filter && data.account_type_filter !== 'All' && (
                        <p className="text-sm text-gray-600">Filtered by Account Type: {data.account_type_filter}</p>
                    )}
                    <p className="text-sm text-gray-600">Hermosa Water District Management System</p>
                </div>

                <div className="bg-gray-50 p-2 rounded mb-4">
                    <div className="flex justify-center gap-6 text-sm">
                        <div className="font-bold">
                            <span className="text-gray-700">Total Records:</span> {data.total_records.toLocaleString()}
                        </div>
                        <div className="font-bold">
                            <span className="text-gray-700">Total Amount:</span> ₱{data.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                        {data.account_type_filter && data.account_type_filter !== 'All' && (
                            <div className="font-bold">
                                <span className="text-gray-700">Account Type:</span> {data.account_type_filter}
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 print-table" style={{fontSize: '9px'}}>
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '12%'}}>Reading Date</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '18%'}}>Customer Name</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '12%'}}>Account#</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '12%'}}>Meter#</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '10%'}}>Reading</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '12%'}}>Amount</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '12%'}}>Type</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '12%'}}>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.readings.map((reading) => (
                                <tr key={reading.id}>
                                    <td className="border border-gray-300 px-2 py-1" style={{fontSize: '8px'}}>
                                        {reading.reading_date !== 'N/A' ? new Date(reading.reading_date).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: '2-digit'}) : 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1" style={{fontSize: '8px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={reading.customer_name}>
                                        {reading.customer_name.length > 20 ? reading.customer_name.substring(0, 20) + '...' : reading.customer_name}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1 text-center" style={{fontSize: '8px'}}>{reading.account_number}</td>
                                    <td className="border border-gray-300 px-2 py-1 text-center" style={{fontSize: '8px'}}>{reading.meter_number}</td>
                                    <td className="border border-gray-300 px-2 py-1 text-right" style={{fontSize: '8px'}}>{reading.reading_value}</td>
                                    <td className="border border-gray-300 px-2 py-1 text-right" style={{fontSize: '8px'}}>
                                        ₱{parseFloat(reading.amount).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1 text-center" style={{fontSize: '8px'}}>
                                        <span className={`px-1 py-0.5 rounded text-xs ${
                                            reading.account_type === 'Residential' ? 'bg-blue-100 text-blue-800' :
                                            reading.account_type === 'Commercial' ? 'bg-green-100 text-green-800' :
                                            reading.account_type === 'Government' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`} style={{fontSize: '7px'}}>
                                            {reading.account_type.substring(0, 8)}
                                        </span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1" style={{fontSize: '8px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={reading.remarks}>
                                        {reading.remarks.length > 12 ? reading.remarks.substring(0, 12) + '...' : reading.remarks}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-center mt-4 text-xs text-gray-600 border-t border-gray-300 pt-2">
                    <p>Report contains {data.total_records.toLocaleString()} meter reading records with total amount of ₱{data.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}.</p>
                    <p>To save as PDF, use your browser's "Print" function and select "Save as PDF" as the destination.</p>
                </div>
            </div>
        );
    };

    const PrintableAnnouncementReport = ({ data, onClose }) => {
        if (!data) return null;

        return (
            <div className="bg-white p-4 mb-6">
                <style jsx>{`
                    @media print {
                        @page {
                            size: A4 landscape;
                            margin: 0.5in;
                        }
                        body {
                            font-size: 10px !important;
                            line-height: 1.2 !important;
                        }
                        .print-table {
                            font-size: 9px !important;
                            line-height: 1.1 !important;
                        }
                        .print-table th,
                        .print-table td {
                            padding: 3px 5px !important;
                            white-space: nowrap !important;
                            overflow: hidden !important;
                            text-overflow: ellipsis !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>
                
                <div className="flex justify-between items-center mb-4 no-print">
                    <h2 className="text-xl font-bold text-gray-900">Announcements Report - Printable View</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <span className="material-symbols-outlined mr-1 text-sm">print</span>
                            Print to PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined mr-1 text-sm">close</span>
                            Close
                        </button>
                    </div>
                </div>

                <div className="text-center mb-4 border-b-2 border-gray-300 pb-2">
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Announcements Report</h1>
                    <p className="text-sm text-gray-600">Generated on: {data.generated_at}</p>
                    {data.status_filter && data.status_filter !== 'All' && (
                        <p className="text-sm text-gray-600">Filtered by Status: {data.status_filter.charAt(0).toUpperCase() + data.status_filter.slice(1)}</p>
                    )}
                    <p className="text-sm text-gray-600">Hermosa Water District Management System</p>
                </div>

                <div className="bg-gray-50 p-2 rounded mb-4">
                    <div className="flex justify-center gap-6 text-sm">
                        <div className="font-bold">
                            <span className="text-gray-700">Total Records:</span> {data.total_records.toLocaleString()}
                        </div>
                        {data.status_filter && data.status_filter !== 'All' && (
                            <div className="font-bold">
                                <span className="text-gray-700">Status Filter:</span> {data.status_filter.charAt(0).toUpperCase() + data.status_filter.slice(1)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 print-table" style={{fontSize: '9px'}}>
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '25%'}}>Title</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '35%'}}>Body</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '10%'}}>Status</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '15%'}}>Created At</th>
                                <th className="border border-gray-300 px-2 py-1 text-xs font-bold text-center" style={{width: '15%'}}>Updated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.announcements.map((announcement) => (
                                <tr key={announcement.id}>
                                    <td className="border border-gray-300 px-2 py-1" style={{fontSize: '8px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={announcement.title}>
                                        {announcement.title.length > 25 ? announcement.title.substring(0, 25) + '...' : announcement.title}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1" style={{fontSize: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={announcement.body}>
                                        {announcement.body.length > 50 ? announcement.body.substring(0, 50) + '...' : announcement.body}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1 text-center" style={{fontSize: '8px'}}>
                                        <span className={`px-1 py-0.5 rounded text-xs ${
                                            announcement.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`} style={{fontSize: '7px'}}>
                                            {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1" style={{fontSize: '8px'}}>
                                        {announcement.created_at !== 'N/A' ? new Date(announcement.created_at).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: '2-digit'}) : 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1" style={{fontSize: '8px'}}>
                                        {announcement.updated_at !== 'N/A' ? new Date(announcement.updated_at).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: '2-digit'}) : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-center mt-4 text-xs text-gray-600 border-t border-gray-300 pt-2">
                    <p>Report contains {data.total_records.toLocaleString()} announcement records.</p>
                    <p>To save as PDF, use your browser's "Print" function and select "Save as PDF" as the destination.</p>
                </div>
            </div>
        );
    };

    const PrintableAccountsReport = ({ data, onClose }) => {
        if (!data) return null;

        return (
            <div className="bg-white p-4 mb-6">
                <style jsx>{`
                    @media print {
                        @page {
                            size: A4 landscape;
                            margin: 0.5in;
                        }
                        body {
                            font-size: 10px !important;
                            line-height: 1.2 !important;
                        }
                        .print-table {
                            font-size: 8px !important;
                            line-height: 1.1 !important;
                        }
                        .print-table th,
                        .print-table td {
                            padding: 2px 3px !important;
                            white-space: nowrap !important;
                            overflow: hidden !important;
                            text-overflow: ellipsis !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>
                
                <div className="flex justify-between items-center mb-4 no-print">
                    <h2 className="text-xl font-bold text-gray-900">Accounts Report - Printable View</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <span className="material-symbols-outlined mr-1 text-sm">print</span>
                            Print to PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined mr-1 text-sm">close</span>
                            Close
                        </button>
                    </div>
                </div>

                <div className="text-center mb-4 border-b-2 border-gray-300 pb-2">
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Accounts Report</h1>
                    <p className="text-sm text-gray-600">Generated on: {data.generated_at}</p>
                    {data.account_type_filter && data.account_type_filter !== 'All' && (
                        <p className="text-sm text-gray-600">Filtered by Account Type: {data.account_type_filter.charAt(0).toUpperCase() + data.account_type_filter.slice(1)}</p>
                    )}
                    <p className="text-sm text-gray-600">Hermosa Water District Management System</p>
                </div>

                <div className="bg-gray-50 p-2 rounded mb-4">
                    <div className="flex justify-center gap-6 text-sm">
                        <div className="font-bold">
                            <span className="text-gray-700">Total Records:</span> {data.total_records.toLocaleString()}
                        </div>
                        {data.account_type_filter && data.account_type_filter !== 'All' && (
                            <div className="font-bold">
                                <span className="text-gray-700">Account Type:</span> {data.account_type_filter.charAt(0).toUpperCase() + data.account_type_filter.slice(1)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 print-table" style={{fontSize: '8px'}}>
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '18%'}}>Full Name</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '10%'}}>Account#</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '10%'}}>Type</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '20%'}}>Address</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '12%'}}>Contact</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '15%'}}>Email</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '8%'}}>Status</th>
                                <th className="border border-gray-300 px-1 py-1 text-xs font-bold text-center" style={{width: '7%'}}>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.accounts.map((account) => (
                                <tr key={account.id}>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={account.full_name}>
                                        {account.full_name.length > 22 ? account.full_name.substring(0, 22) + '...' : account.full_name}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-center" style={{fontSize: '7px'}}>{account.account_number}</td>
                                    <td className="border border-gray-300 px-1 py-1 text-center" style={{fontSize: '7px'}}>
                                        <span className={`px-1 py-0.5 rounded text-xs ${
                                            account.account_type === 'Residential' ? 'bg-blue-100 text-blue-800' :
                                            account.account_type === 'Commercial' ? 'bg-green-100 text-green-800' :
                                            account.account_type === 'Government' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`} style={{fontSize: '6px'}}>
                                            {account.account_type.substring(0, 8)}
                                        </span>
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={account.address}>
                                        {account.address.length > 28 ? account.address.substring(0, 28) + '...' : account.address}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px'}}>{account.contact_number}</td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={account.email}>
                                        {account.email.length > 18 ? account.email.substring(0, 18) + '...' : account.email}
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1 text-center" style={{fontSize: '7px'}}>
                                        <span className={`px-1 py-0.5 rounded text-xs ${
                                            account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`} style={{fontSize: '6px'}}>
                                            {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="border border-gray-300 px-1 py-1" style={{fontSize: '7px'}}>
                                        {account.created_at !== 'N/A' ? new Date(account.created_at).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: '2-digit'}) : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-center mt-4 text-xs text-gray-600 border-t border-gray-300 pt-2">
                    <p>Report contains {data.total_records.toLocaleString()} account records.</p>
                    <p>To save as PDF, use your browser's "Print" function and select "Save as PDF" as the destination.</p>
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

                        </div>

                        {/* Payment Report Table */}
                        {activeTab === 'paymentReport' && (
                            <div>
                                {/* Show Printable Report if active */}
                                {showPaymentReport && (
                                    <PrintablePaymentReport 
                                        data={printablePaymentData} 
                                        onClose={() => {
                                            setShowPaymentReport(false);
                                            setPrintablePaymentData(null);
                                        }} 
                                    />
                                )}

                                {/* Payment Report Filter Section */}
                                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <label className="font-medium text-gray-700">Payment Reports</label>

                        {/* Export Buttons */}
                                        <button
                                            onClick={handleExportPaymentReportsPdf}
                                            disabled={exporting}
                                            className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                <span className="material-symbols-outlined mr-1 text-sm">download</span>
                                {exporting ? 'Exporting...' : 'Export to PDF'}
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
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Payment Date
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Account Number
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Period
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Payment Method
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Reference
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Account Type
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Bill Amount
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Due Date
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Validated At
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paymentReports.map((payment) => (
                                            <tr key={payment.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.customer || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.account_number || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.period || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₱{parseFloat(payment.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.payment_method || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.reference || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full justify-center items-center text-center ${
                                                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`} style={{ minWidth: '70px', display: 'inline-flex' }}>
                                                        {payment.status === 'completed'
                                                            ? 'PAID'
                                                            : payment.status === 'pending'
                                                                ? 'UNPAID'
                                                                : payment.status
                                                                    ? payment.status.toUpperCase()
                                                                    : 'N/A'}
                                                                </span>
                                                            </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.account_type || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ₱{parseFloat(payment.bill_amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {payment.due_date ? new Date(payment.due_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {payment.validated_at ? new Date(payment.validated_at).toLocaleString() : '-'}
                                                </td>
                                                        </tr>
                                        ))}
                                        {paymentReports.length === 0 && (
                                                    <tr>
                                                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No payment records found
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
                                {/* Show Printable Report if active */}
                                {showMeterReport && (
                                    <PrintableMeterReport 
                                        data={printableMeterData} 
                                        onClose={() => {
                                            setShowMeterReport(false);
                                            setPrintableMeterData(null);
                                        }} 
                                    />
                                )}

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
                                        <button
                                            onClick={handleExportMeterReadingsPdf}
                                            disabled={exporting}
                                            className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined mr-1 text-sm">download</span>
                                            {exporting ? 'Exporting...' : 'Export to PDF'}
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
                                                                reading.account_type === 'Residential' ? 'bg-blue-100 text-blue-800' :
                                                                reading.account_type === 'Commercial' ? 'bg-green-100 text-green-800' :
                                                                reading.account_type === 'Government' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {reading.account_type || 'N/A'}
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
                                {/* Show Printable Report if active */}
                                {showAnnouncementReport && (
                                    <PrintableAnnouncementReport 
                                        data={printableAnnouncementData} 
                                        onClose={() => {
                                            setShowAnnouncementReport(false);
                                            setPrintableAnnouncementData(null);
                                        }} 
                                    />
                                )}

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
                                        <button
                                            onClick={handleExportAnnouncementsPdf}
                                            disabled={exporting}
                                            className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined mr-1 text-sm">download</span>
                                            {exporting ? 'Exporting...' : 'Export to PDF'}
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
                                {/* Show Printable Report if active */}
                                {showAccountsReport && (
                                    <PrintableAccountsReport 
                                        data={printableAccountsData} 
                                        onClose={() => {
                                            setShowAccountsReport(false);
                                            setPrintableAccountsData(null);
                                        }} 
                                    />
                                )}

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
                                        <button
                                            onClick={handleExportAccountsPdf}
                                            disabled={exporting}
                                            className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined mr-1 text-sm">download</span>
                                            {exporting ? 'Exporting...' : 'Export to PDF'}
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


                    </div>
                </div>
            </div>
        </DynamicTitleLayout>
    );
};

export default Reports; 