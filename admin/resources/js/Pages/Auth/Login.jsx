import { useEffect, useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';

export default function Login({ status, canResetPassword }) {
    const [loginError, setLoginError] = useState('');
    const { data, setData, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const handleOnChange = (event) => {
        setData(event.target.name, event.target.type === 'checkbox' ? event.target.checked : event.target.value);
        setLoginError(''); // Clear error when user starts typing
    };

    const submit = async (e) => {
        e.preventDefault();
        setLoginError(''); // Clear any previous errors

        try {
            // First get CSRF cookie
            await axios.get('/sanctum/csrf-cookie');
            
            // Then attempt login
            const response = await axios.post('/admin-login', data);
            
            console.log('Login response:', response.data);
            
            // Only redirect if the response explicitly indicates success
            if (response.data && response.data.success === true) {
                console.log('Login successful, redirecting to dashboard');
                window.location.href = '/admin/dashboard';
            } else {
                // If success is not explicitly true, treat as error
                console.log('Login failed - success not true:', response.data);
                setLoginError('Invalid credentials. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            console.error('Error response:', error.response);
            
            if (error.response?.status === 401) {
                setLoginError('Invalid credentials. Please try again.');
            } else if (error.response?.status === 403) {
                setLoginError('You do not have permission to access this system.');
            } else if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                if (validationErrors) {
                    const errorMessage = Object.values(validationErrors).flat().join(', ');
                    setLoginError(`Validation error: ${errorMessage}`);
                }
            } else if (error.response?.data?.message) {
                setLoginError(error.response.data.message);
            } else {
                setLoginError('An error occurred. Please try again later.');
            }
        }
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}
            
            {loginError && (
                <div className="mb-4 font-medium text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                    {loginError}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="username" value="Username" />

                    <TextInput
                        id="username"
                        type="text"
                        name="username"
                        value={data.username}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={handleOnChange}
                    />

                    <InputError message={errors.username} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={handleOnChange}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="block mt-4">
                    <label className="flex items-center">
                        <Checkbox name="remember" checked={data.remember} onChange={handleOnChange} />
                        <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                </div>

                <div className="flex items-center justify-end mt-4">
                    {canResetPassword && (
                        <Link
                            href="/forgot-password"
                            className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton className="ml-4" disabled={processing}>
                        Log in
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
