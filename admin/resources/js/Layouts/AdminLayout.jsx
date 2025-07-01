import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import ConfirmDialog from '@/Components/ConfirmDialog';

const AdminLayout = ({ children }) => {
    const { auth } = usePage().props;
    const [profilePicture, setProfilePicture] = useState(null);
    const [currentPath, setCurrentPath] = useState('');
    const [newTicketsCount, setNewTicketsCount] = useState(0);
    const [viewedTickets, setViewedTickets] = useState(() => {
        const saved = localStorage.getItem('viewedTickets');
        return new Set(saved ? JSON.parse(saved) : []);
    });

    // Update current path in a separate useEffect
    useEffect(() => {
        setCurrentPath(window.location.pathname);
    }, [window.location.pathname]);

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

    const fetchNewTicketsCount = async () => {
        try {
            const response = await axios.get('/admin/tickets/data');
            if (response.data.success) {
                // Get viewed tickets from localStorage
                const savedViewedTickets = new Set(JSON.parse(localStorage.getItem('viewedTickets') || '[]'));
                
                // Only count tickets that are 'open' and haven't been viewed
                const openTickets = response.data.data.filter(ticket => {
                    const isOpen = ticket.status.toLowerCase() === 'open';
                    const isUnviewed = !savedViewedTickets.has(ticket.ticket_id);
                    return isOpen && isUnviewed;
                });
                setNewTicketsCount(openTickets.length);

                // Update viewed tickets for non-open tickets
                const newViewedTickets = new Set(savedViewedTickets);
                response.data.data.forEach(ticket => {
                    if (ticket.status.toLowerCase() !== 'open') {
                        newViewedTickets.add(ticket.ticket_id);
                    }
                });
                localStorage.setItem('viewedTickets', JSON.stringify([...newViewedTickets]));
                setViewedTickets(newViewedTickets);
            }
        } catch (error) {
            console.error('Error fetching new tickets count:', error);
        }
    };

    // Separate useEffect for data fetching without currentPath dependency
    useEffect(() => {
        fetchProfileData();
        fetchNewTicketsCount();

        const profileInterval = setInterval(fetchProfileData, 5000);
        const ticketsInterval = setInterval(fetchNewTicketsCount, 5000);

        return () => {
            clearInterval(profileInterval);
            clearInterval(ticketsInterval);
        };
    }, []); // Removed currentPath dependency

    return (
        <div className="min-h-screen bg-[#60B5FF] font-[Poppins] overflow-x-hidden">
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-[240px] bg-white shadow-lg transform transition-transform duration-200 lg:translate-x-0 md:translate-x-0 -translate-x-full flex flex-col">
                <div className="p-3 flex-shrink-0">
                    <img src="https://i.postimg.cc/fTdMBwmQ/hermosa-logo.png" alt="Logo" className="w-50 h-50 mx-auto mb-3" />
                </div>
                <nav className="flex flex-col flex-1 overflow-y-auto">
                    <div className="flex-1 pb-4">
                        <Link href="/admin/dashboard" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">dashboard</span>
                            Dashboard
                        </Link>
                        <Link href="/admin/announcement" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/announcement' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">campaign</span>
                            Announcement
                        </Link>
                        <Link href="/admin/accounts" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/accounts' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">manage_accounts</span>
                            Manage Accounts
                        </Link>
                        <Link href="/admin/rate-management" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/rate-management' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">price_change</span>
                            Rate Management
                        </Link>
                        <Link href="/admin/payment" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/payment' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">payments</span>
                            Payment
                        </Link>
                        <Link href="/admin/reports" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/reports' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">description</span>
                            Reports
                        </Link>
                        <Link href="/admin/tickets" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/tickets' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">confirmation_number</span>
                            <div className="flex items-center">
                                Tickets
                                {newTicketsCount > 0 && (
                                    <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {newTicketsCount}
                                    </span>
                                )}
                            </div>
                        </Link>
                        <Link href="/admin/profile" className={`flex items-center px-6 py-3 text-base ${currentPath === '/admin/profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
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
                    <h1 className="text-3xl font-bold text-gray-900">
                        {currentPath === '/admin/dashboard' ? 'Dashboard' :
                         currentPath === '/admin/announcement' ? 'Announcement' :
                         currentPath === '/admin/accounts' ? 'Manage Accounts' :
                         currentPath === '/admin/rate-management' ? 'Rate Management' :
                         currentPath === '/admin/payment' ? 'Payment Management' :
                         currentPath === '/admin/reports' ? 'Reports' :
                         currentPath === '/admin/tickets' ? 'Tickets' :
                         currentPath === '/admin/profile' ? 'Profile' :
                         'Admin Dashboard'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{auth?.user?.name}</span>
                        <Link href="/admin/profile">
                            <img 
                                src={profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth?.user?.name || 'Admin')}&background=0D8ABC&color=fff`}
                                alt="Profile" 
                                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
                                onError={(e) => {
                                    console.log('Profile image load error:', e.target.src);
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(auth?.user?.name || 'Admin')}&background=0D8ABC&color=fff`;
                                }}
                            />
                        </Link>
                    </div>
                </div>

                {/* Page Content */}
                {children}
            </div>
        </div>
    );
};

export default AdminLayout; 