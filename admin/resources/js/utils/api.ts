import axios, { AxiosInstance } from 'axios';

// Configure axios to include CSRF token
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

interface TicketData {
    status: string;
    remarks: string;
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

const api: AxiosInstance = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true
});

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

export default api; 