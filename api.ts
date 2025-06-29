import { api } from './axiosConfig';

// Payment History API calls
export const paymentHistoryAPI = {
  getPaymentHistory: async (filters?: {
    status?: string;
    period?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.period) params.append('period', filters.period);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/payment-history?${params.toString()}`);
    return response.data;
  },
  
  getPaymentStats: async () => {
    const response = await api.get('/payment-history/stats');
    return response.data;
  },
  
  validatePayment: async (id: string, action: 'approve' | 'reject', adminNotes?: string) => {
    const response = await api.post(`/payment-history/${id}/validate`, {
      action,
      admin_notes: adminNotes,
    });
    return response.data;
  },
  
  getCustomerPaymentHistory: async (accountNumber: string) => {
    const response = await api.get(`/public/payment-history/${accountNumber}`);
    return response.data;
  },
}; 