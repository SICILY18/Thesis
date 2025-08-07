import React, { useState, useEffect } from 'react';
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
import BillHandlerLayout from '@/Layouts/BillHandlerLayout';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';

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

const BillHandlerDashboard = () => {
    const { auth } = usePage().props;
    const [profilePicture, setProfilePicture] = useState(null);

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

    const [searchRecent, setSearchRecent] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('today');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch total number of customers
                const customersResponse = await axios.get('/admin/customers/count');
                if (customersResponse.data) {
                    setFilteredDashboardData(prev => ({
                        ...prev,
                        users: customersResponse.data.total || 0,
                        activeUsers: customersResponse.data.total || 0
                    }));
                }

                // Fetch payment stats
                const statsResponse = await axios.get('/admin/bill-payment-validation/stats');
                if (statsResponse.data && statsResponse.data.success) {
                    const { payment_status } = statsResponse.data.data;
                    setFilteredDashboardData(prev => ({
                        ...prev,
                        totalPayments: statsResponse.data.data.total_amount || 0,
                        paymentsDone: payment_status.completed.percentage || 0,
                        paymentsPending: payment_status.pending.percentage || 0,
                        completedAmount: payment_status.completed.formatted_amount || '₱0.00',
                        pendingAmount: payment_status.pending.formatted_amount || '₱0.00'
                    }));
                }

                // Fetch monthly payment totals for the graph
                const monthlyTotalsResponse = await axios.get('/admin/bill-payment-validation/monthly-totals');
                if (monthlyTotalsResponse.data) {
                    const monthlyData = monthlyTotalsResponse.data.map(item => item.total);
                    const monthLabels = monthlyTotalsResponse.data.map(item => item.month);
                    
                    // Calculate total this month and average
                    const totalThisMonth = monthlyData[monthlyData.length - 1] || 0;
                    const average = monthlyData.length > 0 
                        ? monthlyData.reduce((a, b) => a + b, 0) / monthlyData.length 
                        : 0;
                    
                    setFilteredDashboardData(prev => ({
                        ...prev,
                        monthlyData,
                        monthLabels,
                        totalThisMonth,
                        averageMonthly: average
                    }));
                }

                // Fetch recent payments
                const recentPaymentsResponse = await axios.get('/admin/bill-payment-validation', {
                    params: {
                        limit: 5,
                        sort: 'payment_date',
                        order: 'desc'
                    }
                });

                if (recentPaymentsResponse.data) {
                    const recentPayments = recentPaymentsResponse.data.map(payment => ({
                        id: payment.id,
                        accountNumber: payment.account_number,
                        name: payment.name,
                        amount: parseFloat(payment.amount) || 0,
                        time: payment.payment_date ? new Date(payment.payment_date).getTime() : null,
                        status: payment.status
                    }));

                    setFilteredDashboardData(prev => ({
                        ...prev,
                        recentPayments
                    }));
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, []);

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
    const filteredRecentPayments = filteredDashboardData.recentPayments.filter(payment =>
        payment.name?.toLowerCase().includes(searchRecent.toLowerCase()) ||
        payment.accountNumber?.toLowerCase().includes(searchRecent.toLowerCase())
    );

    // Chart data
    const lineChartData = {
        labels: filteredDashboardData.monthLabels,
        datasets: [
            {
                label: 'Monthly Collections',
                data: filteredDashboardData.monthlyData,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: '#3B82F6',
            },
        ],
    };

    const barChartData = {
        labels: ['Completed', 'Pending'],
        datasets: [
            {
                label: 'Payment Status',
                data: [
                    filteredDashboardData.paymentsDone,
                    filteredDashboardData.paymentsPending,
                ],
                backgroundColor: ['#3B82F6', '#93C5FD'],
                borderRadius: 6,
                barPercentage: 0.5,
            },
        ],
    };

    return (
        <DynamicTitleLayout>
            <BillHandlerLayout>
                <div className="p-6">
                    {/* Category Filter */}
                    <div className="mb-6">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {categoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500">Total Customers</p>
                                    <h3 className="text-2xl font-bold">{filteredDashboardData.users}</h3>
                                </div>
                                <span className="material-symbols-outlined text-3xl text-blue-500 bg-blue-100 p-3 rounded-full">
                                    group
                                </span>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500">Total Collections</p>
                                    <h3 className="text-2xl font-bold">{filteredDashboardData.completedAmount}</h3>
                                </div>
                                <span className="material-symbols-outlined text-3xl text-green-500 bg-green-100 p-3 rounded-full">
                                    payments
                                </span>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500">Pending Collections</p>
                                    <h3 className="text-2xl font-bold">{filteredDashboardData.pendingAmount}</h3>
                                </div>
                                <span className="material-symbols-outlined text-3xl text-yellow-500 bg-yellow-100 p-3 rounded-full">
                                    pending
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-semibold mb-4">Monthly Collections</h3>
                            <div className="h-[300px]">
                                <Line
                                    data={lineChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                        },
                                        scales: {
                                            y: { beginAtZero: true },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <h3 className="font-semibold mb-4">Payment Status</h3>
                            <div className="h-[300px]">
                                <Bar
                                    data={barChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                max: 100,
                                                ticks: {
                                                    callback: (value) => `${value}%`,
                                                },
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Recent Payments */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold">Recent Payments</h3>
                            <input
                                type="text"
                                value={searchRecent}
                                onChange={(e) => setSearchRecent(e.target.value)}
                                placeholder="Search payments..."
                                className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Account</th>
                                        <th className="text-left py-3 px-4">Name</th>
                                        <th className="text-right py-3 px-4">Amount</th>
                                        <th className="text-center py-3 px-4">Status</th>
                                        <th className="text-right py-3 px-4">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecentPayments.map((payment) => (
                                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">{payment.accountNumber}</td>
                                            <td className="py-3 px-4">{payment.name}</td>
                                            <td className="py-3 px-4 text-right">₱{typeof payment.amount === 'number' ? payment.amount.toFixed(2) : '0.00'}</td>
                                            <td className="py-3 px-4">
                                                <div className={`text-center rounded-full py-1 px-3 text-sm font-medium inline-block
                                                    ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'}`}>
                                                    {payment.status}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-500">
                                                {getTimeAgo(payment.time)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </BillHandlerLayout>
        </DynamicTitleLayout>
    );
};

export default BillHandlerDashboard; 