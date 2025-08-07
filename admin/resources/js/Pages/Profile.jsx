import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import api from '@/utils/api';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';
import BillHandlerLayout from '@/Layouts/BillHandlerLayout';
import AdminLayout from '@/Layouts/AdminLayout';

// Configure axios defaults
api.defaults.withCredentials = true;
api.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const Profile = () => {
    const { auth } = usePage().props;
    const [profileData, setProfileData] = useState({
        staff_id: '',
        name: auth?.user?.name || '',
        username: '',
        address: '',
        contact_number: '',
        email: auth?.user?.email || '',
        role: auth?.user?.role || '',
        profile_picture: null
    });

    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // Determine user role and layout based on current path
    const isBillHandler = typeof window !== 'undefined' && window.location.pathname.startsWith('/bill-handler');
    const userRole = isBillHandler ? 'bill handler' : 'admin';
    const Layout = isBillHandler ? BillHandlerLayout : AdminLayout;
    const apiEndpoint = isBillHandler ? '/staff/profile' : '/admin/profile';
    const updateEndpoint = isBillHandler ? '/bill-handler/profile/update' : '/admin/profile/update';

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const initializeCSRF = async () => {
        try {
            await api.get('/sanctum/csrf-cookie');
        } catch (error) {
            console.error('Error getting CSRF cookie:', error);
        }
    };

    useEffect(() => {
        const initializeProfile = async () => {
            try {
                setMessage({ type: '', text: '' });
                await initializeCSRF();
                const authCheck = await api.get('/check-auth');
                if (!authCheck.data.authenticated) {
                    router.visit('/');
                    return;
                }
                await fetchProfileData();
            } catch (error) {
                console.error('Initialization error:', error);
                if (error.response?.status === 401) {
                    router.visit('/');
                } else {
                    setMessage({ 
                        type: 'error', 
                        text: 'Failed to load profile data. Please refresh the page.' 
                    });
                }
            }
        };

        if (!auth?.user) {
            router.visit('/');
            return;
        }

        initializeProfile();
    }, [auth]);

    const fetchProfileData = async () => {
        try {
            await initializeCSRF();
            const response = await api.get(apiEndpoint);
            if (response.data?.success) {
                const data = response.data.data;
                setProfileData({
                    staff_id: data.id || data.staff_id || '',
                    name: data.name || '',
                    username: data.username || '',
                    email: data.email || '',
                    role: data.role || '',
                    address: data.address || '',
                    contact_number: data.contact || data.contact_number || '',
                    profile_picture: data.profile_picture || null
                });
                setPreviewImage(data.profile_picture || null);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            if (error.response?.status === 401) {
                router.visit('/');
            } else {
                setMessage({ 
                    type: 'error', 
                    text: 'Failed to load profile data. Please refresh the page.' 
                });
            }
        }
    };

    useEffect(() => {
        if (!isEditing) {
            const interval = setInterval(() => {
                fetchProfileData();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isEditing]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value || '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setMessage({ type: '', text: '' });
            const formData = new FormData();
            
            formData.append('name', profileData.name || '');
            formData.append('username', profileData.username || '');
            formData.append('email', profileData.email || '');
            formData.append('address', profileData.address || '');
            formData.append('contact', profileData.contact_number || '');

            if (selectedFile) {
                formData.append('profile_picture', selectedFile);
            }

            const response = await api.post(updateEndpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data?.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                setIsEditing(false);
                setSelectedFile(null);
                await fetchProfileData();
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to update profile' 
            });
        }
    };

    return (
        <DynamicTitleLayout userRole={userRole}>
            <Layout>
                <div className="max-w-4xl mx-auto p-6">
                    <h1 className="text-2xl font-semibold mb-8">Profile</h1>

                    {message.text && (
                        <div className={`p-4 mb-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow p-4 lg:p-6 md:p-6">
                        <div className="flex flex-col lg:flex-row md:flex-row items-center lg:items-start md:items-start gap-8">
                            {/* Profile Picture Section */}
                            <div className="flex flex-col items-center w-full lg:w-auto md:w-auto">
                                <div className="relative">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Profile"
                                            className="w-48 h-48 rounded-full object-cover"
                                            onError={() => {
                                                setPreviewImage(null);
                                            }}
                                        />
                                    ) : (
                                        <div className="w-48 h-48 rounded-full bg-[#0D8ABC] flex items-center justify-center text-white text-6xl">
                                            {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'BH'}
                                        </div>
                                    )}
                                    {isEditing && (
                                        <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                                            <span className="material-symbols-outlined">photo_camera</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div className="mt-4 flex flex-col lg:flex-row md:flex-row gap-2">
                                        <button
                                            onClick={handleSubmit}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-full lg:w-auto md:w-auto"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setPreviewImage(profileData.profile_picture);
                                                setSelectedFile(null);
                                            }}
                                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 w-full lg:w-auto md:w-auto"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {/* Profile Details */}
                            <div className="flex-1 space-y-4 w-full">
                                <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Staff ID</label>
                                        <input
                                            type="text"
                                            value={profileData.staff_id}
                                            className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50"
                                            disabled
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={profileData.name}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={profileData.username}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profileData.email}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={profileData.address}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                        <input
                                            type="text"
                                            name="contact_number"
                                            value={profileData.contact_number}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-lg border-gray-300"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Role</label>
                                        <input
                                            type="text"
                                            value={profileData.role}
                                            className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </DynamicTitleLayout>
    );
};

export default Profile; 