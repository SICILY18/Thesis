import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmDialog from '@/Components/ConfirmDialog';

const LogoutContext = createContext();

export const LogoutProvider = ({ children }) => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const handleLogoutClick = (e) => {
            const logoutButton = e.target.closest('[data-logout]');
            if (logoutButton) {
                e.preventDefault();
                e.stopPropagation();
                setShowLogoutConfirm(true);
            }
        };

        // Prevent back navigation after logout
        window.addEventListener('popstate', function(event) {
            if (document.cookie.indexOf('logged_out=true') !== -1) {
                window.location.replace('/');
            }
        });

        document.addEventListener('click', handleLogoutClick);
        return () => {
            document.removeEventListener('click', handleLogoutClick);
        };
    }, []);

    const handleConfirmLogout = async () => {
        try {
            // Clear any stored state
            localStorage.clear();
            sessionStorage.clear();

            // Clear all cookies by setting their expiration to the past
            document.cookie.split(';').forEach(cookie => {
                document.cookie = cookie
                    .replace(/^ +/, '')
                    .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
            });

            // Set a temporary cookie to indicate logged out state
            document.cookie = 'logged_out=true;path=/';

            // Get CSRF token first
            await axios.get('/sanctum/csrf-cookie');

            // Perform logout
            await axios.post('/admin/logout', {}, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            // Clear browser history to prevent back navigation
            window.history.pushState(null, '', '/');
            window.history.pushState(null, '', '/');
            window.history.pushState(null, '', '/');
            window.history.go(-3);

            // Add cache-busting parameter and redirect
            const redirectUrl = '/?logout=' + new Date().getTime();
            window.location.replace(redirectUrl);

        } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, redirect to login
            window.location.replace('/?error=logout');
        }
    };

    const handleCancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <LogoutContext.Provider value={{}}>
            {children}
            <ConfirmDialog
                isOpen={showLogoutConfirm}
                message="Are you sure you want to log out?"
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
                confirmButtonText="Logout"
            />
        </LogoutContext.Provider>
    );
};

export const useLogout = () => {
    const context = useContext(LogoutContext);
    if (!context) {
        throw new Error('useLogout must be used within a LogoutProvider');
    }
    return context;
}; 