const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
  role: string;
}

export async function getUserProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch profile');
  }

  const data = await response.json();
  return data.user;
}

export async function updateUserProfile(
  token: string,
  name: string,
  phone_number?: string
): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      phone_number: phone_number || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  const data = await response.json();
  return data.user;
}
