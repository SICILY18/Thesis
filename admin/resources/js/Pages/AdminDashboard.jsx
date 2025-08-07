import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import axios from 'axios';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';
import TicketCount from '@/Components/TicketCount';
import clientCache from '@/utils/clientCache';

// Lazy load components
const LoadingSkeleton = lazy(() => import('@/Components/LoadingSkeleton'));

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AdminDashboard = () => {
    const { auth } = usePage().props;
    const [loading, setLoading] = useState(true);
    const [profilePicture, setProfilePicture] = useState(null);
    const [totalPayments, setTotalPayments] = useState(0);

    const categoryOptions = [
        { label: 'All', value: 'all' },
        { label: 'Commercial', value: 'commercial' },
        { label: 'Residential', value: 'residential' },
        { label: 'Government', value: 'government' },
    ];

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredDashboardData, setFilteredDashboardData] = useState({
        users: 0,
        totalPayments: 0,
        activeUsers: 0,
        paymentsDone: 0,
        paymentsPending: 0,
        completedAmount: '₱0.00',
        pendingAmount: '₱0.00',
        recentPayments: [],
        monthlyData: [],
        monthLabels: [],
        todayCollections: 0,
        weeklyCollections: 0,
        pendingValidations: 0,
        successRate: 0,
        completedPercentage: 0,
        pendingPercentage: 0,
        failedPercentage: 0,
        totalAmount: 0,
        averageAmount: 0,
        transactionCount: 0
    });

    const [overviewStats, setOverviewStats] = useState({
        todayCollections: 0,
        thisWeek: 0,
        pendingValidations: 0,
        successRate: 0
    });
    const [distributionStats, setDistributionStats] = useState({
        completed: { amount: 0, formatted_amount: '₱0.00', percentage: 0 },
        pending: { amount: 0, formatted_amount: '₱0.00', percentage: 0 },
        failed: { amount: 0, formatted_amount: '₱0.00', percentage: 0 },
        totalAmount: 0,
        averageAmount: 0,
        transactionCount: 0
    });

    const [searchRecent, setSearchRecent] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('today');

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Try to get data from cache first
            const cachedData = clientCache.getMultiple([
                'dashboard_customers',
                'dashboard_payment_stats',
                'dashboard_monthly_totals',
                'dashboard_recent_payments',
                'dashboard_total_payments'
            ]);

            let customersData = cachedData.dashboard_customers;
            let paymentStats = cachedData.dashboard_payment_stats;
            let monthlyTotals = cachedData.dashboard_monthly_totals;
            let recentPayments = cachedData.dashboard_recent_payments;
            let totalPaymentsValue = cachedData.dashboard_total_payments;

            // Fetch only what's not in cache
            if (!customersData) {
                const customersResponse = await axios.get('/admin/customers/count');
                if (customersResponse.data) {
                    customersData = {
                        total: customersResponse.data.total || 0
                    };
                    clientCache.set('dashboard_customers', customersData);
                }
            }

            if (!paymentStats) {
                const statsResponse = await axios.get('/admin/bill-payment-validation/stats', {
                    params: { period: selectedPeriod }
                });
                if (statsResponse.data && statsResponse.data.success) {
                    paymentStats = statsResponse.data.data;
                    clientCache.set('dashboard_payment_stats', paymentStats, 2 * 60 * 1000); // 2 minutes cache
                }
            }

            if (!monthlyTotals) {
                const monthlyTotalsResponse = await axios.get('/admin/bill-payment-validation/monthly-totals');
                if (monthlyTotalsResponse.data) {
                    monthlyTotals = monthlyTotalsResponse.data;
                    clientCache.set('dashboard_monthly_totals', monthlyTotals);
                }
            }

            if (!recentPayments) {
                const recentPaymentsResponse = await axios.get('/admin/bill-payment-validation', {
                    params: {
                        limit: 5,
                        sort: 'payment_date',
                        order: 'desc'
                    }
                });

                // Use the correct array from the paginated response
                const paymentsArray = recentPaymentsResponse.data?.data?.data || [];
                recentPayments = paymentsArray.map(payment => ({
                    id: payment.id,
                    accountNumber: payment.account_number,
                    name: payment.name || payment.full_name,
                    amount: payment.amount,
                    time: payment.payment_date ? new Date(payment.payment_date).getTime() : null,
                    status: payment.status || payment.payment_status
                }));
                clientCache.set('dashboard_recent_payments', recentPayments, 30 * 1000); // 30 seconds cache for recent
            }

            // Fetch total payments (all-time) if not cached
            if (!totalPaymentsValue) {
                const totalPaymentsResponse = await axios.get('/admin/bill-payment-validation/total');
                if (totalPaymentsResponse.data && typeof totalPaymentsResponse.data.total_amount !== 'undefined') {
                    totalPaymentsValue = totalPaymentsResponse.data.total_amount;
                    clientCache.set('dashboard_total_payments', totalPaymentsValue, 2 * 60 * 1000);
                }
            }
            setTotalPayments(totalPaymentsValue || 0);

            // Update state with all data
            setFilteredDashboardData(prev => ({
                ...prev,
                users: customersData?.total || 0,
                activeUsers: customersData?.total || 0,
                // totalPayments is now handled separately
                paymentsDone: paymentStats?.payment_status?.completed?.percentage || 0,
                paymentsPending: paymentStats?.payment_status?.pending?.percentage || 0,
                completedAmount: paymentStats?.payment_status?.completed?.formatted_amount || '₱0.00',
                pendingAmount: paymentStats?.payment_status?.pending?.formatted_amount || '₱0.00',
                monthlyData: monthlyTotals?.map(item => item.total) || [],
                monthLabels: monthlyTotals?.map(item => item.month) || [],
                recentPayments: recentPayments || [],
                todayCollections: paymentStats?.today_collections || 0,
                weeklyCollections: paymentStats?.weekly_collections || 0,
                pendingValidations: paymentStats?.pending_validations || 0,
                successRate: paymentStats?.success_rate || 0
            }));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOverviewStats = async () => {
        try {
            const todayRes = await axios.get('/admin/bill-payment-validation/stats', { params: { period: 'today' } });
            const weekRes = await axios.get('/admin/bill-payment-validation/stats', { params: { period: 'week' } });
            setOverviewStats({
                todayCollections: todayRes.data.data.today_collections || 0,
                thisWeek: weekRes.data.data.weekly_collections || 0,
                pendingValidations: todayRes.data.data.pending_validations || 0, // or weekRes as needed
                successRate: todayRes.data.data.success_rate || 0 // or weekRes as needed
            });
        } catch (error) {
            console.error('Error fetching overview stats:', error);
        }
    };

    const fetchDistributionStats = async (period) => {
        try {
            const res = await axios.get('/admin/bill-payment-validation/stats', { params: { period } });
            setDistributionStats({
                completed: res.data.data.payment_status.completed,
                pending: res.data.data.payment_status.pending,
                failed: res.data.data.payment_status.failed || { amount: 0, formatted_amount: '₱0.00', percentage: 0 },
                totalAmount: res.data.data.total_amount || 0,
                averageAmount: res.data.data.average_amount || 0,
                transactionCount: res.data.data.transaction_count || 0
            });
        } catch (error) {
            console.error('Error fetching distribution stats:', error);
        }
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const cachedProfile = clientCache.get('admin_profile');
                if (cachedProfile) {
                    setProfilePicture(cachedProfile.profile_picture);
                    return;
                }

                const response = await axios.get('/api/admin/profile');
                if (response.data && response.data.profile_picture) {
                    setProfilePicture(response.data.profile_picture);
                    clientCache.set('admin_profile', response.data);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfileData();
    }, []);

    useEffect(() => {
        fetchOverviewStats();
    }, []);

    useEffect(() => {
        fetchDistributionStats(selectedPeriod);
    }, [selectedPeriod]);

    // Ensure fetchDashboardData is called when selectedPeriod changes
    useEffect(() => {
        fetchDashboardData();

        // Set up auto-refresh for dashboard stats and recent payments
        const refreshInterval = setInterval(() => {
            clientCache.delete('dashboard_payment_stats');
            clientCache.delete('dashboard_recent_payments');
            clientCache.delete('dashboard_total_payments');
            fetchDashboardData();
        }, 30 * 1000); // Refresh every 30 seconds

        return () => clearInterval(refreshInterval);
    }, [selectedPeriod]);

    // Function to format the time difference
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        const now = new Date().getTime();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (seconds < 60) return seconds + 's ago';
        if (minutes < 60) return minutes + 'm ago';
        if (hours < 24) return hours + 'h ago';
        return new Date(timestamp).toLocaleDateString();
    };

    // Filter recent payments based on search
    const filteredRecentPayments = (filteredDashboardData.recentPayments || []).filter(payment => {
        if (!payment) return false;
        const nameMatch = typeof payment.name === 'string' && payment.name.toLowerCase().includes(searchRecent.toLowerCase());
        const accountMatch = typeof payment.accountNumber === 'string' && payment.accountNumber.toLowerCase().includes(searchRecent.toLowerCase());
        return nameMatch || accountMatch;
    });

    const lineChartData = {
        labels: filteredDashboardData.monthLabels || [],
        datasets: [
            {
                label: 'Monthly Payments',
                data: filteredDashboardData.monthlyData || [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(59, 130, 246)',
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        family: 'Poppins'
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#000',
                bodyColor: '#000',
                borderColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 1,
                padding: 10,
                bodyFont: {
                    size: 14,
                    family: 'Poppins'
                },
                titleFont: {
                    size: 16,
                    family: 'Poppins',
                    weight: 'bold'
                },
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-PH', {
                                style: 'currency',
                                currency: 'PHP'
                            }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 12,
                        family: 'Poppins'
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    font: {
                        size: 12,
                        family: 'Poppins'
                    },
                    callback: function(value) {
                        return new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                            maximumFractionDigits: 0
                        }).format(value);
                    }
                }
            }
        }
    };

    const barChartData = {
        labels: ['Payments Done', 'Payments Pending'],
        datasets: [
            {
                data: [filteredDashboardData.paymentsDone, filteredDashboardData.paymentsPending],
                backgroundColor: [
                    'rgb(59, 130, 246)',
                    'rgb(191, 219, 254)',
                ],
                borderWidth: 0,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <DynamicTitleLayout title="Admin Dashboard">
            <div className="min-h-screen bg-[#60B5FF] font-[Poppins] overflow-x-hidden p-6">
                {loading ? (
                    <Suspense fallback={<div>Loading...</div>}>
                        <LoadingSkeleton />
                    </Suspense>
                ) : (
                    <>
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
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                                <div className="flex items-center gap-4">
                                    <select
                                        value={selectedCategory}
                                        onChange={e => setSelectedCategory(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {categoryOptions.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <Link href="/admin/profile">
                                        <img 
                                            src={profilePicture || `https://ui-avatars.com/api/?name=${auth?.user?.name || 'Admin'}&background=0D8ABC&color=fff`}
                                            alt="Profile" 
                                            className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
                                        />
                                    </Link>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {/* Users Card */}
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Users</h3>
                                            <p className="text-xl font-semibold mt-1">{filteredDashboardData.users || 23}</p>
                                        </div>
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Payments Card */}
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
                                            <p className="text-xl font-semibold mt-1">₱{(totalPayments || 0).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-1">From completed payments</p>
                                        </div>
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Users Card */}
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                                            <p className="text-xl font-semibold mt-1">{filteredDashboardData.activeUsers || 23}</p>
                                        </div>
                                        <div className="p-2 bg-purple-100 rounded-full">
                                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Analytics Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Payment Overview */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h2 className="text-lg font-semibold mb-4">Payment Overview</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <h3 className="text-sm text-gray-600 mb-2">Today's Collections</h3>
                                            <p className="text-2xl font-bold text-blue-600">
                                                ₱{(overviewStats.todayCollections || 0).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4">
                                            <h3 className="text-sm text-gray-600 mb-2">This Week</h3>
                                            <p className="text-2xl font-bold text-green-600">
                                                ₱{(overviewStats.thisWeek || 0).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-4">
                                            <h3 className="text-sm text-gray-600 mb-2">Pending Validations</h3>
                                            <p className="text-2xl font-bold text-purple-600">
                                                {overviewStats.pendingValidations || 0}
                                            </p>
                                        </div>
                                        <div className="bg-yellow-50 rounded-lg p-4">
                                            <h3 className="text-sm text-gray-600 mb-2">Success Rate</h3>
                                            <p className="text-2xl font-bold text-yellow-600">
                                                {((overviewStats.successRate || 0) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Status Distribution */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Payment Status Distribution</h2>
                                        <select 
                                            className="border rounded-lg px-3 py-1 text-sm"
                                            value={selectedPeriod}
                                            onChange={e => setSelectedPeriod(e.target.value)}
                                        >
                                            <option value="today">Today</option>
                                            <option value="week">This Week</option>
                                            <option value="month">This Month</option>
                                        </select>
                                    </div>
                                    <div className="relative pt-1">
                                        <div className="flex mb-2 items-center justify-between">
                                            <div>
                                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                                    Completed
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold inline-block text-green-600">
                                                    {distributionStats.completed.percentage || 0}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                                            <div style={{ width: `${distributionStats.completed.percentage || 0}%` }}
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500">
                                            </div>
                                        </div>
                                        <div className="flex mb-2 items-center justify-between">
                                            <div>
                                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">
                                                    Pending
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold inline-block text-yellow-600">
                                                    {distributionStats.pending.percentage || 0}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-yellow-200">
                                            <div style={{ width: `${distributionStats.pending.percentage || 0}%` }}
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500">
                                            </div>
                                        </div>
                                        <div className="flex mb-2 items-center justify-between">
                                            <div>
                                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                                                    Failed
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold inline-block text-red-600">
                                                    {distributionStats.failed.percentage || 0}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-red-200">
                                            <div style={{ width: `${distributionStats.failed.percentage || 0}%` }}
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500">
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                                        <div className="bg-gray-50 rounded p-2">
                                            <p className="text-gray-600">Total</p>
                                            <p className="font-semibold">₱{(distributionStats.totalAmount || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded p-2">
                                            <p className="text-gray-600">Average</p>
                                            <p className="font-semibold">₱{(distributionStats.averageAmount || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded p-2">
                                            <p className="text-gray-600">Count</p>
                                            <p className="font-semibold">{distributionStats.transactionCount || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Payments Section */}
                            <div className="bg-white rounded-lg shadow-md p-6 col-span-12 lg:col-span-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Recent Payments</h2>
                                    <input
                                        type="text"
                                        value={searchRecent}
                                        onChange={(e) => setSearchRecent(e.target.value)}
                                        placeholder="Search recent payments"
                                        className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-4">
                                    {filteredRecentPayments.length > 0 ? (
                                        filteredRecentPayments.map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-2">
                                                <div className="flex-1">
                                                    <div className="font-medium">{payment.name}</div>
                                                    <div className="text-sm text-gray-500">Account: {payment.accountNumber}</div>
                                                    <div className="text-sm text-gray-500">{getTimeAgo(payment.time)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium text-green-600">₱{(payment.amount || 0).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}</div>
                                                    <div className={`text-sm ${
                                                        payment.status === 'completed' ? 'text-green-500' :
                                                        payment.status === 'pending_validation' ? 'text-yellow-500' :
                                                        'text-red-500'
                                                    }`}>
                                                        {(payment.status || 'unknown').replace('_', ' ').charAt(0).toUpperCase() + (payment.status || 'unknown').slice(1).replace('_', ' ')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-4">
                                            No recent payments found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DynamicTitleLayout>
    );
};

export default AdminDashboard;
