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
        admin_id: '',
        name: auth?.user?.name || '',
        address: '',
        contact: '',
        email: '',
        password: '••••••',
        role: '',
        profile_picture: null
    });

    const [isEditing, setIsEditing] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [tempBlobUrl, setTempBlobUrl] = useState(null);

    // Cleanup blob URL when component unmounts or when preview changes
    useEffect(() => {
        return () => {
            if (tempBlobUrl) {
                URL.revokeObjectURL(tempBlobUrl);
            }
        };
    }, [tempBlobUrl]);

    // Determine user role and layout based on current path
    const isBillHandler = typeof window !== 'undefined' && window.location.pathname.startsWith('/bill-handler');
    const userRole = isBillHandler ? 'bill handler' : 'admin';
    const Layout = isBillHandler ? BillHandlerLayout : AdminLayout;
    const apiEndpoint = isBillHandler ? '/bill-handler/profile' : '/admin/profile';
    const updateEndpoint = isBillHandler ? '/bill-handler/profile/update' : '/admin/profile/update';

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
                // Clear any existing messages
                setMessage({ type: '', text: '' });

                // Initialize CSRF protection
                await initializeCSRF();

                // Check authentication status
                const authCheck = await api.get('/check-auth');
                if (!authCheck.data.authenticated) {
                    router.visit('/');
                    return;
                }

                // Now fetch profile data
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
        console.log('=== FETCHING PROFILE DATA ===');
        try {
            // Ensure CSRF token is set before making request
            await initializeCSRF();
            
            const response = await api.get(apiEndpoint);
            if (response.data?.success) {
                const profileData = response.data.data;
                setProfileData(prevData => ({
                    ...prevData,
                    ...profileData,
                    profile_picture: profileData.profile_picture
                }));
                setPreviewImage(profileData.profile_picture);
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

    // Add effect to refresh profile data periodically
    useEffect(() => {
        // Only refresh if not in editing mode
        if (!isEditing) {
            const interval = setInterval(() => {
                fetchProfileData();
            }, 5000); // Refresh every 5 seconds

            return () => clearInterval(interval);
        }
    }, [isEditing]);

    const handleImageChange = (e) => {
        console.log('=== IMAGE CHANGE DEBUG ===');
        const file = e.target.files[0];
        console.log('Selected file:', file);
        
        if (file) {
            console.log('File details:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            });
            
            // Validate file type and size
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                console.log('Invalid file type:', file.type);
                setMessage({ type: 'error', text: 'Please upload a valid image file (JPEG, PNG, or GIF)' });
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                console.log('File too large:', file.size);
                setMessage({ type: 'error', text: 'Image size should be less than 2MB' });
                return;
            }

            console.log('File validation passed, updating state...');
            
            // Cleanup old blob URL if exists
            if (tempBlobUrl) {
                URL.revokeObjectURL(tempBlobUrl);
            }
            
            // Create new blob URL
            const newBlobUrl = URL.createObjectURL(file);
            setTempBlobUrl(newBlobUrl);
            setPreviewImage(newBlobUrl);
            setProfileData({ ...profileData, profile_picture: file });
        } else {
            console.log('No file selected');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData({ ...profileData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('=== PROFILE SUBMIT DEBUG ===');
        console.log('Profile data:', profileData);
        console.log('Has profile picture file:', profileData.profile_picture instanceof File);
        
        try {
            setMessage({ type: '', text: '' }); // Clear any existing messages
            const formData = new FormData();
            
            // Add all profile data to formData except password and profile_picture
            Object.keys(profileData).forEach(key => {
                if (key !== 'password' && key !== 'profile_picture' && profileData[key] !== null) {
                    console.log(`Adding to formData: ${key} = ${profileData[key]}`);
                    formData.append(key, profileData[key]);
                }
            });

            // Handle profile picture separately
            if (profileData.profile_picture instanceof File) {
                console.log('Adding profile picture file:', {
                    name: profileData.profile_picture.name,
                    size: profileData.profile_picture.size,
                    type: profileData.profile_picture.type
                });
                formData.append('profile_picture', profileData.profile_picture);
            } else {
                console.log('No profile picture file to upload');
            }

            console.log(`Sending request to ${updateEndpoint}`);
            const response = await api.post(updateEndpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                },
            });

            console.log('Response received:', response.data);

            if (response.data.success) {
                console.log('Profile update successful!');
                setMessage({ type: 'success', text: response.data.message || 'Profile updated successfully!' });
                setIsEditing(false);
                
                // Cleanup temporary blob URL
                if (tempBlobUrl) {
                    URL.revokeObjectURL(tempBlobUrl);
                    setTempBlobUrl(null);
                }
                
                // Update preview image if a new profile picture URL was returned
                if (response.data.profile_picture) {
                    setPreviewImage(response.data.profile_picture);
                }
                
                // Refresh profile data
                console.log('Fetching updated profile...');
                await fetchProfileData();
                
                // Reset the file input
                setProfileData(prev => ({
                    ...prev,
                    profile_picture: null
                }));
            } else {
                console.log('Profile update failed:', response.data.message);
                throw new Error(response.data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('=== PROFILE UPDATE ERROR ===');
            console.error('Error object:', error);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
            
            // Set error message with more detail
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
            setMessage({ 
                type: 'error', 
                text: errorMessage
            });
            
            // Keep editing mode active when there's an error
            setIsEditing(true);
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
                                    <img
                                        src={previewImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=0D8ABC&color=fff&size=200`}
                                        alt="Profile"
                                        className="w-48 h-48 rounded-full object-cover"
                                        onError={(e) => {
                                            console.log('Image load error:', e.target.src);
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=0D8ABC&color=fff&size=200`;
                                        }}
                                    />
                                    {isEditing && (
                                        <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer">
                                            <span className="material-symbols-outlined">edit</span>
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
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 w-full lg:w-auto md:w-auto"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-full lg:w-auto md:w-auto"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {/* Profile Details */}
                            <div className="flex-1 space-y-4 w-full">
                                <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            {isBillHandler ? 'Staff ID' : 'Admin ID'}
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.admin_id || profileData.staff_id || ''}
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
                                            name="contact"
                                            value={profileData.contact}
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