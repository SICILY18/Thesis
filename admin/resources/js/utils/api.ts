import axios from 'axios';

// Create an axios instance
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true
});

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        // Handle authentication errors
        if (error.response?.status === 401) {
            console.error('Authentication error:', error);
            window.location.href = '/login';
        }
        // Handle other errors
        else if (error.response?.status === 403) {
            console.error('Authorization error:', error);
        }
        return Promise.reject(error);
    }
);

// Export configured axios instance
export default api;

interface TicketData {
    status: string;
    remarks: string;
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

// Ticket APIs
export const fetchTickets = async (): Promise<ApiResponse<any[]>> => {
    try {
        const response = await api.get('/tickets');
        return response.data;
    } catch (error) {
        console.error('Error fetching tickets:', error);
        throw error;
    }
};

export const createTicket = async (formData: FormData): Promise<ApiResponse<any>> => {
    try {
        const response = await api.post('/tickets', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating ticket:', error);
        throw error;
    }
};

export const updateTicket = async (ticketId: number, data: TicketData): Promise<ApiResponse<any>> => {
    try {
        const response = await api.put(`/tickets/${ticketId}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating ticket:', error);
        throw error;
    }
};

export const fetchCustomers = async (): Promise<ApiResponse<any[]>> => {
    try {
        const response = await api.get('/tickets/customers');
        return response.data;
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
};

export const fetchCategories = async (): Promise<ApiResponse<Record<string, string[]>>> => {
    try {
        const response = await api.get('/tickets/categories');
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}; 