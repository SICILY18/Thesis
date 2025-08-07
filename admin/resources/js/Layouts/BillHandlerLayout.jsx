import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import api from '@/utils/api';

const BillHandlerLayout = ({ children }) => {
    const { auth } = usePage().props;
    const [profilePicture, setProfilePicture] = useState(null);
    const [currentPath, setCurrentPath] = useState('');

    const fetchProfileData = async () => {
        try {
            console.log('Fetching profile data for header...');
            const response = await api.get('/bill-handler/profile');
            if (response.data?.success && response.data?.data?.profile_picture) {
                console.log('New profile picture URL:', response.data.data.profile_picture);
                setProfilePicture(response.data.data.profile_picture);
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    };

    useEffect(() => {
        setCurrentPath(window.location.pathname);
        fetchProfileData();

        // Set up periodic refresh
        const interval = setInterval(fetchProfileData, 5000); // Refresh every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const getDefaultAvatarUrl = (name) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Bill Handler')}&background=0D8ABC&color=fff`;
    };

    return (
        <div className="min-h-screen bg-[#60B5FF] font-[Poppins] overflow-x-hidden">
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-[240px] bg-white shadow-lg transform transition-transform duration-200 lg:translate-x-0 md:translate-x-0 -translate-x-full flex flex-col">
                <div className="p-3 flex-shrink-0">
                    <img src="https://i.postimg.cc/fTdMBwmQ/hermosa-logo.png" alt="Logo" className="w-50 h-50 mx-auto mb-3" />
                </div>
                <nav className="flex flex-col flex-1 overflow-y-auto">
                    <div className="flex-1 pb-4">
                        <Link href="/bill-handler/dashboard" className={`flex items-center px-6 py-3 text-base ${currentPath === '/bill-handler/dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">dashboard</span>
                            Dashboard
                        </Link>
                        <Link href="/bill-handler/customers" className={`flex items-center px-6 py-3 text-base ${currentPath === '/bill-handler/customers' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">group</span>
                            Customers
                        </Link>
                        <Link href="/bill-handler/billing" className={`flex items-center px-6 py-3 text-base ${currentPath === '/bill-handler/billing' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">receipt_long</span>
                            Billing
                        </Link>
                        <Link href="/bill-handler/profile" className={`flex items-center px-6 py-3 text-base ${currentPath === '/bill-handler/profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <span className="material-symbols-outlined mr-3">person</span>
                            Profile
                        </Link>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            data-logout
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
                        Bill Panel
                        {currentPath !== '/bill-handler/dashboard' && (
                            <span className="text-xl font-normal text-gray-600 ml-2">
                                / {currentPath === '/bill-handler/customers' ? 'Customers' :
                                   currentPath === '/bill-handler/billing' ? 'Billing' :
                                   currentPath === '/bill-handler/profile' ? 'Profile' : ''}
                            </span>
                        )}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{auth?.user?.name}</span>
                        <Link href="/bill-handler/profile">
                            <img 
                                src={profilePicture || getDefaultAvatarUrl(auth?.user?.name)}
                                alt="Profile" 
                                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
                                onError={(e) => {
                                    console.log('Profile image load error:', e.target.src);
                                    e.target.src = getDefaultAvatarUrl(auth?.user?.name);
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

export default BillHandlerLayout; 