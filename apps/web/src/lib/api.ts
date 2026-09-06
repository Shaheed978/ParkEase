const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('parkease_token');
};

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('parkease_token', token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('parkease_token');
    localStorage.removeItem('parkease_user');
  }
};

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message: string; data?: T; errorCode?: string }> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'API request failed',
        errorCode: data.errorCode || 'HTTP_ERROR',
      };
    }
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network request failed. Is backend running?',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

export const api = {
  // Auth
  register: (body: any) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => fetchApi('/auth/me'),

  // Vehicles
  getVehicles: () => fetchApi('/users/vehicles'),
  addVehicle: (body: any) => fetchApi('/users/vehicles', { method: 'POST', body: JSON.stringify(body) }),
  deleteVehicle: (id: string) => fetchApi(`/users/vehicles/${id}`, { method: 'DELETE' }),

  // Parking
  searchParking: (queryParams: string) => fetchApi(`/parking/search?${queryParams}`),
  getFacilityDetails: (id: string, queryParams: string = '') => fetchApi(`/parking/${id}?${queryParams}`),

  // Bookings
  holdSlot: (body: any) => fetchApi('/bookings/hold-slot', { method: 'POST', body: JSON.stringify(body) }),
  calculatePrice: (body: any) => fetchApi('/bookings/calculate', { method: 'POST', body: JSON.stringify(body) }),
  createBooking: (body: any) => fetchApi('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  getMyBookings: () => fetchApi('/bookings/my'),
  getBookingById: (id: string) => fetchApi(`/bookings/${id}`),
  cancelBooking: (id: string, body: any) => fetchApi(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify(body) }),

  // Gate Operator
  operatorCheckIn: (body: any) => fetchApi('/bookings/operator/check-in', { method: 'POST', body: JSON.stringify(body) }),
  operatorCheckOut: (body: any) => fetchApi('/bookings/operator/check-out', { method: 'POST', body: JSON.stringify(body) }),

  // Owner Portal
  getOwnerDashboard: () => fetchApi('/owner/dashboard'),
  createFacility: (body: any) => fetchApi('/owner/facility', { method: 'POST', body: JSON.stringify(body) }),
  bulkGenerateSlots: (facilityId: string, body: any) =>
    fetchApi(`/owner/facility/${facilityId}/slots/bulk`, { method: 'POST', body: JSON.stringify(body) }),

  // Admin Portal
  getAdminDashboard: () => fetchApi('/admin/dashboard'),
  getPendingFacilities: () => fetchApi('/admin/facilities/pending'),
  updateFacilityStatus: (id: string, body: any) => fetchApi(`/admin/facilities/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
  getCoupons: () => fetchApi('/admin/coupons'),
  createCoupon: (body: any) => fetchApi('/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),

  // Extras
  addReview: (body: any) => fetchApi('/extras/reviews', { method: 'POST', body: JSON.stringify(body) }),
  toggleFavorite: (body: any) => fetchApi('/extras/favorites/toggle', { method: 'POST', body: JSON.stringify(body) }),
  getFavorites: () => fetchApi('/extras/favorites'),
  getNotifications: () => fetchApi('/extras/notifications'),
  markNotificationsRead: () => fetchApi('/extras/notifications/read', { method: 'POST' }),
  createTicket: (body: any) => fetchApi('/extras/tickets', { method: 'POST', body: JSON.stringify(body) }),
};
