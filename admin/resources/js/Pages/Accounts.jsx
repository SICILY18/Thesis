import React, { useState, useEffect, useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import Notification from '@/Components/Notification';
import ConfirmDialog from '@/Components/ConfirmDialog';
import DynamicTitleLayout from '@/Layouts/DynamicTitleLayout';
import TicketCount from '@/Components/TicketCount';
import clientCache from '@/utils/clientCache';

const iconStyle = {
    cursor: 'pointer',
    margin: '0 6px',
    fontSize: '18px',
};

const Accounts = () => {
    const { auth } = usePage().props;
    const [profilePicture, setProfilePicture] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    });
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('staff');
    const [showPassword, setShowPassword] = useState(false);
    const [tabs] = useState([
        { id: 'all', label: 'All Accounts' },
        { id: 'admin', label: 'Admins' },
        { id: 'meter handler', label: 'Meter Readers' },
        { id: 'bill handler', label: 'Bill Handlers' },
        { id: 'customer', label: 'Customers' }
    ]);
    const [formData, setFormData] = useState({
        name: '',
        first_name: '',
        last_name: '',
        username: '',
        password: '',
        role: 'admin',
        address: '',
        contact_number: '',
        email: '',
        customer_type: 'residential',
        account_number: '',
        meter_number: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [editingAccount, setEditingAccount] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        accountId: null,
        type: null
    });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
    const [loading, setLoading] = useState(true); // Add loading state
    const [newTicketsCount, setNewTicketsCount] = useState(0);
    const [viewedTickets, setViewedTickets] = useState(() => {
        const saved = localStorage.getItem('viewedTickets');
        return new Set(saved ? JSON.parse(saved) : []);
    });

    // Add validation state
    const [formErrors, setFormErrors] = useState({
        name: '', // Only used for staff
        first_name: '', // Only used for customers
        last_name: '', // Only used for customers
        username: '',
        account_number: '',
        meter_number: '',
        address: '',
        email: '',
        contact_number: ''
    });

    // Add validation functions
    const validateName = (name) => {
        return /^[A-Za-z\s]+$/.test(name);
    };

    const validateUsername = (username) => {
        return /^[A-Za-z0-9]+$/.test(username);
    };

    const validateAccountNumber = (accountNumber) => {
        return /^\d{2}-\d{6}$/.test(accountNumber) && accountNumber.length === 9;
    };

    const validateContactNumber = (contactNumber) => {
        return /^\d{11}$/.test(contactNumber);
    };

    const validateMeterNumber = (meterNumber) => {
        return /^\d{9}$/.test(meterNumber);
    };

    const validateAddress = (address) => {
        return /^[A-Za-z0-9\s,.-]+$/.test(address);
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Add password validation function
    const validatePassword = (password) => {
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return hasNumber && hasSpecialChar;
    };

    // Filter accounts based on active tab and search term
    const filteredAccounts = useMemo(() => {
        return accounts.filter(account => {
            const matchesSearch = searchTerm === '' || 
                account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                account.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                account.email?.toLowerCase().includes(searchTerm.toLowerCase());
            if (activeTab === 'customer') {
                const matchesType = customerTypeFilter === 'all' || (account.customer_type && account.customer_type.toLowerCase() === customerTypeFilter);
                return account.type?.toLowerCase() === 'customer' && matchesSearch && matchesType;
            }
            if (activeTab === 'all') return matchesSearch;
            if (activeTab === 'admin') return account.role?.toLowerCase() === 'admin' && matchesSearch;
            if (activeTab === 'meter handler') return account.role?.toLowerCase() === 'meter handler' && matchesSearch;
            if (activeTab === 'bill handler') return account.role?.toLowerCase() === 'bill handler' && matchesSearch;
            return false;
        });
    }, [accounts, activeTab, searchTerm, customerTypeFilter]);

    const fetchNewTicketsCount = async () => {
        try {
            const response = await axios.get('/admin/tickets/data');
            if (response.data.success) {
                const savedViewedTickets = new Set(JSON.parse(localStorage.getItem('viewedTickets') || '[]'));
                
                const openTickets = response.data.data.filter(ticket => {
                    const isOpen = ticket.status.toLowerCase() === 'open';
                    const isUnviewed = !savedViewedTickets.has(ticket.ticket_id);
                    return isOpen && isUnviewed;
                });
                setNewTicketsCount(openTickets.length);

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

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const cachedProfile = clientCache.get('admin_profile');
                if (cachedProfile) {
                    setProfilePicture(cachedProfile.profile_picture);
                    return;
                }

                const response = await axios.get('/api/admin/profile');
                if (response.data && response.data.profile_picture) {
                    setProfilePicture(response.data.profile_picture);
                    clientCache.set('admin_profile', response.data, 5 * 60 * 1000); // Cache for 5 minutes
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfileData();
        fetchNewTicketsCount();

        const profileInterval = setInterval(fetchProfileData, 5000);
        const ticketsInterval = setInterval(fetchNewTicketsCount, 3000);

        return () => {
            clearInterval(profileInterval);
            clearInterval(ticketsInterval);
        };
    }, []);

    async function fetchAccounts(page = 1) {
        setLoading(true);
        try {
            console.log('Fetching accounts with type:', activeTab, 'page:', page);

            // Try to get from cache first
            const cacheKey = `accounts_${activeTab}_${searchTerm}_${page}`;
            const cachedData = clientCache.get(cacheKey);
            
            if (cachedData) {
                setAccounts(cachedData.accounts);
                setPagination(cachedData.pagination);
                setLoading(false);
                return;
            }

            const response = await axios.get(`/api/accounts?type=${activeTab}&search=${searchTerm}&page=${page}`);
            console.log('API Response:', response.data);
            
            if (response.data.success) {
                // Ensure role names are consistent and add unique IDs if missing
                const processedAccounts = response.data.data.data.map((account, index) => ({
                    ...account,
                    id: account.id || `temp-${index}`, // Ensure each account has a unique ID
                    role: account.role?.toLowerCase().trim()
                }));

                // Update state
                setAccounts(processedAccounts);
                
                // Update pagination state
                const paginationData = {
                    current_page: response.data.data.current_page,
                    last_page: response.data.data.last_page,
                    per_page: response.data.data.per_page,
                    total: response.data.data.total,
                    from: response.data.data.from,
                    to: response.data.data.to
                };
                setPagination(paginationData);

                // Cache the results
                clientCache.set(cacheKey, {
                    accounts: processedAccounts,
                    pagination: paginationData
                }, 60 * 1000); // Cache for 1 minute
                
                console.log('Updated accounts state:', processedAccounts);
                console.log('Updated pagination state:', response.data.data);
            } else {
                console.error('API returned success=false:', response.data.message);
                setAccounts([]);
                setPagination(prev => ({ ...prev, total: 0 }));
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
            console.error('Error details:', error.response?.data);
            setAccounts([]);
            setPagination(prev => ({ ...prev, total: 0 }));
            } finally {
                setLoading(false);
        }
    }
        
    useEffect(() => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        fetchAccounts(1);
    }, [activeTab, searchTerm]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let error = '';

        // Only validate if the field has content (not empty)
        if (value.trim() !== '') {
            switch (name) {
                case 'name':
                    if (!validateName(value)) {
                        error = 'Name should only contain letters';
                    }
                    break;
                case 'first_name':
                    if (!validateName(value)) {
                        error = 'First name should only contain letters';
                    }
                    break;
                case 'last_name':
                    if (!validateName(value)) {
                        error = 'Last name should only contain letters';
                    }
                    break;
                case 'username':
                    if (!validateUsername(value)) {
                        error = 'Username should not contain spaces or special characters';
                    }
                    break;
                case 'password':
                    if (!validatePassword(value)) {
                        error = 'Password must contain at least one number and one special character';
                    }
                    break;
                case 'account_number':
                    if (!validateAccountNumber(value)) {
                        error = 'Account number should be in format XX-XXXXXX (9 characters)';
                    }
                    break;
                case 'contact_number':
                    if (!validateContactNumber(value)) {
                        error = 'Contact number should be 11 digits';
                    }
                    break;
                case 'meter_number':
                    if (!validateMeterNumber(value)) {
                        error = 'Meter number should be 9 digits';
                    }
                    break;
                case 'address':
                    if (!validateAddress(value)) {
                        error = 'Address should not contain special characters';
                    }
                    break;
                case 'email':
                    if (!validateEmail(value)) {
                        error = 'Please enter a valid email address';
                    }
                    break;
            }
        }

        setFormErrors(prev => ({
            ...prev,
            [name]: error
        }));

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormType(account.type === 'customer' ? 'customer' : 'staff');
        setFormData({
            name: account.type === 'staff' ? account.name : '', // Only set name for staff
            first_name: account.first_name || '',
            last_name: account.last_name || '',
            username: account.username,
            password: '', // Empty for edit
            role: account.role || 'admin',
            address: account.address,
            contact_number: account.contact_number,
            email: account.email,
            customer_type: account.customer_type || 'residential',
            account_number: account.account_number || '',
            meter_number: account.meter_number || ''
        });
        setShowForm(true);
    };

    const handleConfirmAction = async () => {
        try {
            let response;
            if (confirmDialog.type === 'staff') {
                response = await axios.delete(`/api/accounts/staff/${confirmDialog.accountId}`);
            } else {
                response = await axios.delete(`/api/accounts/customer/${confirmDialog.accountId}`);
            }
            
            if (response.data.success) {
                showNotification('Account deleted successfully');
                fetchAccounts();
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            showNotification(error.response?.data?.message || 'Error deleting account', 'error');
        }
        setConfirmDialog({ isOpen: false, accountId: null, type: null });
    };

    const handleCancelAction = () => {
        setConfirmDialog({ isOpen: false, accountId: null, type: null });
    };

    const handleDelete = async (id, type) => {
        setConfirmDialog({
            isOpen: true,
            accountId: id,
            type: type
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all fields before submission
        const errors = {};
        
        // Common validations for all forms
        if (!formData.username || !validateUsername(formData.username)) {
            errors.username = 'Username is required and should not contain spaces or special characters';
        }
        if (!formData.email || !validateEmail(formData.email)) {
            errors.email = 'Email is required and must be a valid email address';
        }
        if (!formData.address || !validateAddress(formData.address)) {
            errors.address = 'Address is required and should not contain special characters';
        }
        if (!formData.contact_number || !validateContactNumber(formData.contact_number)) {
            errors.contact_number = 'Contact number is required and should be 11 digits';
        }

        // Validate name fields based on form type
        if (formType === 'staff') {
            // For staff, validate the single name field
            if (!formData.name || !validateName(formData.name)) {
                errors.name = 'Name is required and should only contain letters';
            }
        } else if (formType === 'customer') {
            // For customers, validate first_name and last_name
            if (!formData.first_name || !validateName(formData.first_name)) {
                errors.first_name = 'First name is required and should only contain letters';
            }
            if (!formData.last_name || !validateName(formData.last_name)) {
                errors.last_name = 'Last name is required and should only contain letters';
            }
            if (!formData.account_number || !validateAccountNumber(formData.account_number)) {
                errors.account_number = 'Account number is required and should be in format XX-XXXXXX (9 characters)';
            }
            if (!formData.meter_number || !validateMeterNumber(formData.meter_number)) {
                errors.meter_number = 'Meter number is required and should be 9 digits';
            }
        }

        // Only validate password for new accounts
        if (!editingAccount && (!formData.password || !validatePassword(formData.password))) {
            errors.password = 'Password is required and must contain at least one number and one special character';
        }

        setFormErrors(errors);

        // Check if there are any errors
        if (Object.keys(errors).length > 0) {
            showNotification('Please fix the form errors before submitting', 'error');
            return;
        }

        try {
            let response;
            
            if (formType === 'staff') {
                if (editingAccount) {
                    response = await axios.put(`/api/accounts/staff/${editingAccount.id}`, formData);
                } else {
                    response = await axios.post('/api/accounts/staff', formData);
                }
            } else {
                // Handle customer creation/update
                const customerData = {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    username: formData.username,
                    customer_type: formData.customer_type,
                    address: formData.address,
                    contact_number: formData.contact_number,
                    email: formData.email,
                    account_number: formData.account_number,
                    meter_number: formData.meter_number
                };

                // Only include password for new accounts
                if (!editingAccount) {
                    customerData.password = formData.password;
                }
                
                if (editingAccount) {
                    response = await axios.put(`/api/accounts/customer/${editingAccount.id}`, customerData);
                } else {
                    // Use the correct customer creation endpoint
                    response = await axios.post('/api/accounts/customer', customerData);
                }
            }
            
            if (response.data.success) {
                setShowForm(false);
                setEditingAccount(null);
                setFormData({
                    name: '',
                    first_name: '',
                    last_name: '',
                    username: '',
                    password: '',
                    role: 'admin',
                    address: '',
                    contact_number: '',
                    email: '',
                    customer_type: 'residential',
                    account_number: '',
                    meter_number: ''
                });
                setFormErrors({});
                fetchAccounts();
                showNotification(formType === 'staff' 
                    ? (editingAccount ? 'Staff account updated successfully!' : 'Staff account created successfully!')
                    : (editingAccount ? 'Customer account updated successfully!' : 'Customer account created successfully!'));
            }
        } catch (error) {
            console.error('Error saving account:', error);
            showNotification(error.response?.data?.message || 'Error saving account', 'error');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                profile_picture: file
            }));
        }
    };

    const clearFormData = () => {
        setFormData({
            name: '',
            first_name: '',
            last_name: '',
            username: '',
            password: '',
            role: 'admin',
            address: '',
            contact_number: '',
            email: '',
            customer_type: 'residential',
            account_number: '',
            meter_number: ''
        });
        setEditingAccount(null);
    };

    const handleFormClose = () => {
        setShowForm(false);
        clearFormData();
    };

    const handleFormTypeChange = (type) => {
        setFormType(type);
        clearFormData();
        setShowForm(true);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.last_page) {
            fetchAccounts(page);
        }
    };

    const handlePreviousPage = () => {
        if (pagination.current_page > 1) {
            handlePageChange(pagination.current_page - 1);
        }
    };

    const handleNextPage = () => {
        if (pagination.current_page < pagination.last_page) {
            handlePageChange(pagination.current_page + 1);
        }
    };

    const renderForm = () => {
        if (!showForm) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            {formType === 'staff' 
                                ? (editingAccount ? 'Edit Staff Account' : 'Create Staff Account')
                                : (editingAccount ? 'Edit Customer Account' : 'Create Customer Account')
                            }
                        </h2>
                        <button 
                            onClick={handleFormClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            {formType === 'staff' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Role
                                        </label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="meter handler">Meter Reader</option>
                                            <option value="bill handler">Bill Handler</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleInputChange}
                                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                                    formErrors.first_name ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {formErrors.first_name && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors.first_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleInputChange}
                                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                                    formErrors.last_name ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {formErrors.last_name && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors.last_name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Customer Type
                                        </label>
                                        <select
                                            name="customer_type"
                                            value={formData.customer_type}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="residential">Residential</option>
                                            <option value="commercial">Commercial</option>
                                            <option value="government">Government</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Account Number
                                        </label>
                                        <input
                                            type="text"
                                            name="account_number"
                                            value={formData.account_number}
                                            onChange={handleInputChange}
                                            maxLength="9"
                                            placeholder="XX-XXXXXX"
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                                formErrors.account_number ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {formErrors.account_number && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.account_number}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Meter Number
                                        </label>
                                        <input
                                            type="text"
                                            name="meter_number"
                                            value={formData.meter_number}
                                            onChange={handleInputChange}
                                            maxLength="9"
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                                formErrors.meter_number ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {formErrors.meter_number && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.meter_number}</p>
                                        )}
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                        formErrors.username ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.username && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                                )}
                            </div>
                            {!editingAccount && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                                formErrors.password ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            <span className="material-symbols-outlined">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>
                                    {formErrors.password && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                                    )}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    name="contact_number"
                                    value={formData.contact_number}
                                    onChange={handleInputChange}
                                    maxLength="11"
                                    placeholder="Enter 11 digits"
                                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                        formErrors.contact_number ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.contact_number && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.contact_number}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.email && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                        formErrors.address ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.address && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={handleFormClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {formType === 'staff' ? (editingAccount ? 'Update Account' : 'Create Account') : (editingAccount ? 'Update Customer' : 'Create Customer')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const handleConfirmLogout = async () => {
        try {
            await axios.get('/sanctum/csrf-cookie');
            await axios.post('/admin/logout');
            window.location.href = '/';
        } catch (error) {
            window.location.href = '/';
        }
    };

    const handleCancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <DynamicTitleLayout>
            <div className="min-h-screen bg-[#60B5FF] font-[Poppins] overflow-x-hidden">
                {/* Sidebar */}
                <div className="fixed left-0 top-0 h-full w-[240px] bg-white shadow-lg transform transition-transform duration-200 lg:translate-x-0 md:translate-x-0 -translate-x-full flex flex-col">
                    <div className="p-3 flex-shrink-0">
                        <img src="https://i.postimg.cc/fTdMBwmQ/hermosa-logo.png" alt="Logo" className="w-50 h-50 mx-auto mb-3" />
                    </div>
                    <nav className="flex flex-col flex-1 overflow-y-auto">
                        <div className="flex-1 pb-4">
                            <Link href="/admin/dashboard" className="flex items-center px-6 py-3 text-base text-gray-600 hover:bg-gray-50">
                                <span className="material-symbols-outlined mr-3">dashboard</span>
                                Dashboard
                            </Link>
                            <Link href="/admin/announcement" className="flex items-center px-6 py-3 text-base text-gray-600 hover:bg-gray-50">
                                <span className="material-symbols-outlined mr-3">campaign</span>
                                Announcement
                            </Link>
                            <Link href="/admin/accounts" className="flex items-center px-6 py-3 text-base text-blue-600 bg-blue-50">
                                <span className="material-symbols-outlined mr-3">manage_accounts</span>
                                Accounts
                            </Link>
                            <Link href="/admin/rate-management" className="flex items-center px-6 py-3 text-base text-gray-600 hover:bg-gray-50">
                                <span className="material-symbols-outlined mr-3">price_change</span>
                                Rate Management
                            </Link>
                            <Link href="/admin/payment" className="flex items-center px-6 py-3 text-base text-gray-600 hover:bg-gray-50">
                                <span className="material-symbols-outlined mr-3">payments</span>
                                Payments
                            </Link>
                            <Link href="/admin/reports" className="flex items-center px-6 py-3 text-base text-gray-600 hover:bg-gray-50">
                                <span className="material-symbols-outlined mr-3">description</span>
                                Reports
                            </Link>
                            <Link href="/admin/tickets" className="flex items-center px-6 py-3 text-base text-gray-600 hover:bg-gray-50">
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
                            <Link href="/admin/dispute" className="flex items-center px-6 py-3 text-base text-gray-600 hover:bg-gray-50">
                                <span className="material-symbols-outlined mr-3">gavel</span>
                                Dispute
                            </Link>
                            <Link href="/admin/sms-configuration" className="flex items-center px-6 py-3 text-base text-gray-600 hover:bg-gray-50">
                                <span className="material-symbols-outlined mr-3">sms</span>
                                SMS Configuration
                            </Link>
                            <Link href="/admin/profile" className="flex items-center px-6 py-3 text-base text-gray-600 hover:bg-gray-50">
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

                {/* Main Content */}
                <div className="lg:ml-[240px] p-3 sm:p-4 md:p-6 lg:p-6 pt-16 lg:pt-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{auth?.user?.name}</span>
                            <Link href="/admin/profile">
                                <img 
                                    src={profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth?.user?.name || 'Admin')}&background=0D8ABC&color=fff`}
                                    alt="Profile" 
                                    className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(auth?.user?.name || 'Admin')}&background=0D8ABC&color=fff`;
                                    }}
                                />
                            </Link>
                        </div>
                    </div>

                {/* Add Account Buttons */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleFormTypeChange('staff')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                            <span className="material-symbols-outlined mr-2">person_add</span>
                            Add Staff
                        </button>
                        <button
                            onClick={() => handleFormTypeChange('customer')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                        >
                            <span className="material-symbols-outlined mr-2">person_add</span>
                            Add Customer
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md mb-6">
                    <div className="flex overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Input */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <div className="relative w-full md:w-auto flex-1">
                            <input
                                type="text"
                                placeholder="Search accounts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                search
                            </span>
                        </div>
                        {activeTab === 'customer' && (
                            <select
                                value={customerTypeFilter}
                                onChange={e => setCustomerTypeFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                            >
                                <option value="all">All Types</option>
                                <option value="commercial">Commercial</option>
                                <option value="residential">Residential</option>
                                <option value="government">Government</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* Accounts Table */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead>
                                <tr>
                                    {activeTab === 'customer' ? (
                                        <>
                                            <th className="py-3 px-4 font-semibold">Name</th>
                                            <th className="py-3 px-4 font-semibold">Username</th>
                                            <th className="py-3 px-4 font-semibold">Type</th>
                                            <th className="py-3 px-4 font-semibold">Address</th>
                                            <th className="py-3 px-4 font-semibold">Contact Number</th>
                                            <th className="py-3 px-4 font-semibold">Email</th>
                                            <th className="py-3 px-4 font-semibold">Account Number</th>
                                            <th className="py-3 px-4 font-semibold">Meter Number</th>
                                            <th className="py-3 px-4 font-semibold">Actions</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="py-3 px-4 font-semibold">Name</th>
                                            <th className="py-3 px-4 font-semibold">Username</th>
                                            <th className="py-3 px-4 font-semibold">Role/Type</th>
                                            <th className="py-3 px-4 font-semibold">Address</th>
                                            <th className="py-3 px-4 font-semibold">Contact Number</th>
                                            <th className="py-3 px-4 font-semibold">Email</th>
                                            <th className="py-3 px-4 font-semibold">Actions</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={activeTab === 'customer' ? 10 : 7} className="py-12 text-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                                <p className="mt-4 text-gray-600">Loading accounts...</p>
                                            </td>
                                        </tr>
                                    ) : filteredAccounts.length === 0 ? (
                                        <tr>
                                            <td colSpan={activeTab === 'customer' ? 10 : 7} className="py-12 text-center text-gray-500">
                                                No accounts found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAccounts.map((account, index) => {
                                    // Generate a truly unique key for each row
                                    const rowKey = `${activeTab}-${account.id || account.account_number || account.username || index}-${index}`;
                                    
                                    return (
                                        <tr key={rowKey} className="border-b hover:bg-blue-50">
                                            {activeTab === 'customer' ? (
                                                <>
                                                    <td className="py-3 px-4">
                                                        {account.first_name && account.last_name 
                                                            ? `${account.first_name} ${account.last_name}` 
                                                            : account.name}
                                                    </td>
                                                    <td className="py-3 px-4">{account.username}</td>
                                                    <td className="py-3 px-4">{account.customer_type}</td>
                                                    <td className="py-3 px-4">{account.address}</td>
                                                    <td className="py-3 px-4">{account.contact_number}</td>
                                                    <td className="py-3 px-4">{account.email}</td>
                                                    <td className="py-3 px-4">{account.account_number}</td>
                                                    <td className="py-3 px-4">{account.meter_number}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center">
                                                            <button
                                                                onClick={() => handleEdit(account)}
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                <span className="material-symbols-outlined">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(account.id, 'customer')}
                                                                className="text-red-600 hover:text-red-800 ml-4"
                                                            >
                                                                <span className="material-symbols-outlined">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="py-3 px-4">{account.name}</td>
                                                    <td className="py-3 px-4">{account.username}</td>
                                                    <td className="py-3 px-4">
                                                        {account.type === 'customer' ? account.customer_type : account.role}
                                                    </td>
                                                    <td className="py-3 px-4">{account.address}</td>
                                                    <td className="py-3 px-4">{account.contact_number}</td>
                                                    <td className="py-3 px-4">{account.email}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center">
                                                            <button
                                                                onClick={() => handleEdit(account)}
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                <span className="material-symbols-outlined">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(account.id, 'staff')}
                                                                className="text-red-600 hover:text-red-800 ml-4"
                                                            >
                                                                <span className="material-symbols-outlined">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                        })
                                    )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {pagination.total > 0 && (
                        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={pagination.current_page === 1}
                                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing{' '}
                                        <span className="font-medium">{pagination.from}</span> to{' '}
                                        <span className="font-medium">{pagination.to}</span> of{' '}
                                        <span className="font-medium">{pagination.total}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={handlePreviousPage}
                                            disabled={pagination.current_page === 1}
                                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                                        </button>
                                        
                                        {/* Page Numbers */}
                                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => {
                                            // Show first page, last page, current page, and pages around current page
                                            const showPage = page === 1 || 
                                                            page === pagination.last_page || 
                                                            Math.abs(page - pagination.current_page) <= 1;
                                            
                                            if (!showPage) {
                                                // Show ellipsis
                                                if ((page === 2 && pagination.current_page > 4) || 
                                                    (page === pagination.last_page - 1 && pagination.current_page < pagination.last_page - 3)) {
                                                    return (
                                                        <span
                                                            key={`ellipsis-${page}`}
                                                            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                                                        >
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            }
                                            
                                            return (
                                                <button
                                                    key={`page-${page}`}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                        page === pagination.current_page
                                                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                        
                                        <button
                                            onClick={handleNextPage}
                                            disabled={pagination.current_page === pagination.last_page}
                                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Account Form Modal */}
                {renderForm()}

                {/* Add Notification component */}
                {notification.show && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification({ ...notification, show: false })}
                    />
                )}

                {/* Add ConfirmDialog component */}
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    message="Are you sure you want to delete this account? This action cannot be undone."
                    onConfirm={handleConfirmAction}
                    onCancel={handleCancelAction}
                />

                {/* Add Logout Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={showLogoutConfirm}
                    message="Are you sure you want to log out?"
                    onConfirm={handleConfirmLogout}
                    onCancel={handleCancelLogout}
                />
                </div>
            </div>
        </DynamicTitleLayout>
    );
};

export default Accounts;    