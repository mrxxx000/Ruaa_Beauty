const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  location: string;
  address: string;
  notes: string;
  total_price: number;
  service_pricing: any[];
  mehendi_hours: number;
  user_id: number | null;
  status?: string;
  created_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  role: string;
}

// Get all bookings (admin only)
export async function getAllBookings(token: string): Promise<Booking[]> {
  const response = await fetch(`${API_URL}/api/admin/bookings`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch bookings');
  }

  const data = await response.json();
  return data.bookings;
}

// Get all users (admin only)
export async function getAllUsers(token: string): Promise<User[]> {
  const response = await fetch(`${API_URL}/api/admin/users`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch users');
  }

  const data = await response.json();
  return data.users;
}

// Update booking status (admin only)
export async function updateBookingStatus(
  token: string,
  bookingId: string,
  status: 'pending' | 'completed' | 'cancelled'
): Promise<Booking> {
  const response = await fetch(`${API_URL}/api/admin/bookings/${bookingId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update booking status');
  }

  const data = await response.json();
  return data.booking;
}

// Cancel booking (admin only)
export async function cancelBookingAdmin(token: string, bookingId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/admin/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel booking');
  }
}
