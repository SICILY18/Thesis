import React, { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import api from '@/utils/api';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const getCsrfToken = async () => {
            await api.get('/sanctum/csrf-cookie');
        };
        getCsrfToken();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/admin-login', {
                username,
                password,
            });

            if (response.data.success) {
                const userRole = response.data.user.role;
                if (userRole === 'admin') {
                    router.visit('/admin/dashboard');
                } else if (userRole === 'bill handler') {
                    router.visit('/bill-handler/dashboard');
                } else {
                    setError('You do not have permission to access this system.');
                }
            } else {
                setError(response.data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.message || 'Login failed. Please try again.');
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
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-2 text-gray-400"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
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
                            />
                            <label htmlFor="remember" className="text-white text-sm">
                                Remember me
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
                        >
                            Sign in
                        </button>
                    </form>
                </div>
            </section>
        </>
    );
};

export default AdminLogin;
