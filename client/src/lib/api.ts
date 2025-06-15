import { apiRequest } from './queryClient';

export const fetchPayments = async () => {
  const response = await apiRequest({
    method: 'GET',
    url: '/api/admin/payments'
  });
  return response;
};
