import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import LoadingSkeleton from '@/Components/BillingCycles/LoadingSkeleton';
import ErrorBoundary from '@/Components/ErrorBoundary';
import clientCache from '@/utils/clientCache';

// Lazy load components
const StatsCards = lazy(() => import('@/Components/BillingCycles/StatsCards'));
const Filters = lazy(() => import('@/Components/BillingCycles/Filters'));
const BillingTable = lazy(() => import('@/Components/BillingCycles/BillingTable'));

const ITEMS_PER_PAGE = 10;

export default function BillingCycles() {
    const [billingCycles, setBillingCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCycles: 0,
        activeCycles: 0,
        inactiveCycles: 0,
        totalAmount: 0
    });
    const [filters, setFilters] = useState({
        accountType: 'All',
        search: '',
        page: 1
    });

    const formatAmount = useCallback((amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    }, []);

    const fetchBillingCycles = useCallback(async () => {
        try {
            setLoading(true);

            // Generate cache key based on filters
            const cacheKey = `billing_cycles_${JSON.stringify(filters)}`;
            
            // Try to get from cache first
            const cachedData = clientCache.get(cacheKey);
            if (cachedData) {
                setBillingCycles(cachedData.cycles);
                setStats(cachedData.stats);
                setLoading(false);
                return;
            }

            // Calculate pagination offset
            const offset = (filters.page - 1) * ITEMS_PER_PAGE;
            
            const response = await axios.get('/api/bill-handler/billing-cycles', { 
                params: {
                    ...filters,
                    limit: ITEMS_PER_PAGE,
                    offset: offset
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            const cycles = Array.isArray(response.data) ? response.data : [];
            
            const total = cycles.length;
            const active = cycles.filter(cycle => cycle.status === 'active').length;
            const totalAmount = cycles.reduce((sum, cycle) => {
                const amount = parseFloat(cycle.amount_due || 0);
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            
            const newStats = {
                totalCycles: total,
                activeCycles: active,
                inactiveCycles: total - active,
                totalAmount: totalAmount
            };

            // Cache the results
            clientCache.set(cacheKey, {
                cycles,
                stats: newStats
            });

            setBillingCycles(cycles);
            setStats(newStats);
            
        } catch (error) {
            console.error('Error fetching billing cycles:', error);
            setBillingCycles([]);
            setStats({
                totalCycles: 0,
                activeCycles: 0,
                inactiveCycles: 0,
                totalAmount: 0
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchBillingCycles();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [fetchBillingCycles]);

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    return (
        <AdminLayout>
            <Head title="Billing Management" />

            <div className="p-6">
                {/* Header */}
                <h1 className="text-2xl font-bold mb-6">Billing Management</h1>

                {/* Navigation Tabs */}
                <div className="flex border-b mb-6">
                    <a href="/invoice-generation" className="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Invoice Generation
                    </a>
                    <a href="/bill-payment-validation" className="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Bill Payment Validation
                    </a>
                    <a href="/billing-cycles" className="px-4 py-2 text-blue-600 border-b-2 border-blue-600">
                        Billing Cycles
                    </a>
                    <a href="/billing-history" className="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Billing History
                    </a>
                </div>

                {/* Subheader */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Billing Cycles Management</h2>
                    <p className="text-gray-600">Billing cycles are automatically synced from customer data</p>
                </div>

                <ErrorBoundary>
                    {loading ? (
                        <LoadingSkeleton />
                    ) : (
                        <Suspense fallback={<LoadingSkeleton />}>
                            {/* Filters Component */}
                            <Filters 
                                filters={filters} 
                                onFiltersChange={setFilters} 
                            />

                            {/* Stats Component */}
                            <StatsCards 
                                stats={stats} 
                                formatAmount={formatAmount} 
                            />

                            {/* Table Component */}
                            <BillingTable 
                                loading={loading}
                                billingCycles={billingCycles}
                                formatAmount={formatAmount}
                                currentPage={filters.page}
                                onPageChange={handlePageChange}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </Suspense>
                    )}
                </ErrorBoundary>
            </div>
        </AdminLayout>
    );
} 