import axios from 'axios';
import _ from 'lodash';
import { router } from '@inertiajs/react';
window._ = _;

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF-TOKEN" cookie.
 */

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

// Function to refresh CSRF token
const refreshCsrfToken = async () => {
    try {
        await axios.get('/sanctum/csrf-cookie');
        console.log('CSRF token refreshed successfully');
        return true;
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
        return false;
    }
};

// Refresh token periodically (every 24 hours)
setInterval(refreshCsrfToken, 24 * 60 * 60 * 1000);

// Refresh token when tab becomes visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        refreshCsrfToken();
    }
});

// Add request interceptor to handle token refresh
axios.interceptors.request.use(
    async config => {
        // Don't try to refresh for the csrf-cookie endpoint to avoid infinite loop
        if (!config.url.includes('sanctum/csrf-cookie')) {
            const token = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='));
            if (!token) {
                await refreshCsrfToken();
            }
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle CSRF token expiration
axios.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 419) {
            // Save form data before refresh
            const formData = document.querySelectorAll('form');
            formData.forEach(form => {
                const formId = form.id || 'default-form';
                const data = new FormData(form);
                const formObject = {};
                data.forEach((value, key) => formObject[key] = value);
                localStorage.setItem(`form-${formId}`, JSON.stringify(formObject));
            });

            // Try to refresh the token
            const refreshed = await refreshCsrfToken();
            
            if (refreshed) {
                // Retry the original request
                const retryConfig = error.config;
                // Clear the X-XSRF-TOKEN header so axios will use the new token
                delete retryConfig.headers['X-XSRF-TOKEN'];
                return axios(retryConfig);
            } else {
                // Show error notification
                const message = 'Your session has expired. The page will refresh.';
                if (window.Notification && Notification.permission === 'granted') {
                    new Notification('Session Expired', { body: message });
                }
                
                // Refresh the page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

// import Echo from 'laravel-echo';

// import Pusher from 'pusher-js';
// window.Pusher = Pusher;

// window.Echo = new Echo({
//     broadcaster: 'pusher',
//     key: import.meta.env.VITE_PUSHER_APP_KEY,
//     cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
//     wsHost: import.meta.env.VITE_PUSHER_HOST ? import.meta.env.VITE_PUSHER_HOST : `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER}.pusher.com`,
//     wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
//     wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
//     forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
//     enabledTransports: ['ws', 'wss'],
// });
