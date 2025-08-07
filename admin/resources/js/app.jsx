import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import axios from 'axios';
import { LogoutProvider } from './Contexts/LogoutContext';
import SessionWarning from './Components/SessionWarning';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Function to request notification permission
const requestNotificationPermission = async () => {
    if (window.Notification && Notification.permission === 'default') {
        try {
            await Notification.requestPermission();
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }
};

// Function to refresh CSRF token
const refreshCsrfToken = async () => {
    try {
        await axios.get('/sanctum/csrf-cookie');
        console.log('CSRF token refreshed successfully');
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
    }
};

// Function to warn user before session expiration
const warnBeforeExpiration = () => {
    const message = 'Your session will expire soon. Please save your work and refresh the page if needed.';
    
    // Show browser notification
    if (window.Notification && Notification.permission === 'granted') {
        new Notification('Session Expiring Soon', { body: message });
    }

    // Create a container for the warning if it doesn't exist
    let container = document.getElementById('session-warnings');
    if (!container) {
        container = document.createElement('div');
        container.id = 'session-warnings';
        document.body.appendChild(container);
    }

    // Render the SessionWarning component
    const warningRoot = createRoot(container);
    warningRoot.render(
        <SessionWarning 
            message={message} 
            onClose={() => {
                warningRoot.unmount();
                container.remove();
            }}
            duration={30000} // Show for 30 seconds
        />
    );
};

// Initialize session management
const initializeSessionManagement = () => {
    // Request notification permission
    requestNotificationPermission();

    // Refresh token every 2 days
    setInterval(refreshCsrfToken, 2 * 24 * 60 * 60 * 1000);

    // Set warning 30 minutes before expiration (for 3-day session)
    setTimeout(warnBeforeExpiration, (3 * 24 * 60 - 30) * 60 * 1000);

    // Also refresh token on tab focus
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            refreshCsrfToken();
        }
    });
};

createInertiaApp({
    title: (title) => title,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        
        // Initialize session management after app setup
        initializeSessionManagement();

        root.render(
            <LogoutProvider>
                <App {...props} />
            </LogoutProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
