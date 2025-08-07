import React, { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import api from '@/utils/api';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // First get CSRF cookie
            await api.get('/sanctum/csrf-cookie');
            
            // Attempt login
            const response = await api.post('/admin-login', {
                username,
                password,
                remember: rememberMe
            });

            console.log('Login response:', response);

            // Only proceed if response explicitly indicates success
            if (response.data && response.data.success === true) {
                const userRole = response.data.user.role;
                
                console.log('Login successful, user role:', userRole);

                if (userRole === 'admin') {
                    window.location.href = '/admin/dashboard';
                } else if (userRole === 'bill handler') {
                    window.location.href = '/bill-handler/dashboard';
                } else {
                    setError('You do not have permission to access this system.');
                }
            } else {
                // If success is not explicitly true, treat as error
                console.log('Login failed - success not true:', response.data);
                setError('Invalid credentials. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            console.error('Error response:', error.response);
            
            if (error.response?.status === 401) {
                setError('Invalid credentials. Please try again.');
            } else if (error.response?.status === 403) {
                setError('You do not have permission to access this system.');
            } else if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                if (validationErrors) {
                    const errorMessage = Object.values(validationErrors).flat().join(', ');
                    setError(`Validation error: ${errorMessage}`);
                }
            } else if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Staff Login" />
            <section className="bg-[#60B5FF] min-h-screen font-[Poppins] flex items-center justify-center">
                <div className="w-full max-w-md bg-[#23272f] rounded-lg shadow-lg p-8 flex flex-col items-center">
                    <img
                        src="https://i.postimg.cc/fTdMBwmQ/hermosa-logo.png"
                        alt="Hermosa Water District Logo"
                        className="w-36 h-36 mb-4 object-contain bg-white rounded-full p-2 shadow"
                    />
                    <h2 className="text-2xl font-bold text-white mb-1 text-center">Hermosa Water District</h2>
                    <p className="text-white text-lg mb-6 text-center">Sign in to your Account</p>
                    <form className="w-full" onSubmit={handleLogin}>
                        {error && (
                            <div className="mb-4 text-red-500 text-center">{error}</div>
                        )}
                        <div className="mb-4">
                            <label className="block text-white mb-1" htmlFor="username">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                className="w-full px-4 py-2 rounded bg-[#2e3440] text-white focus:outline-none"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-white mb-1" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full px-4 py-2 rounded bg-[#2e3440] text-white focus:outline-none"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2 text-gray-400"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    disabled={loading}
                                >
                                    {showPassword ? (
                                        <span className="material-symbols-outlined">visibility_off</span>
                                    ) : (
                                        <span className="material-symbols-outlined">visibility</span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center mb-6">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={() => setRememberMe(!rememberMe)}
                                className="mr-2"
                                disabled={loading}
                            />
                            <label htmlFor="remember" className="text-white text-sm">
                                Remember me
                            </label>
                        </div>
                        <button
                            type="submit"
                            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition ${
                                loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </section>
        </>
    );
};

export default AdminLogin;
