const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';

interface LoyaltyPoints {
  points: number;
  canRedeem: boolean;
  rewardThreshold: number;
  discountPercent: number;
}

interface PointsHistory {
  id: string;
  points_earned: number;
  points_spent: number;
  balance_after: number;
  transaction_type: string;
  service_type: string;
  notes: string;
  created_at: string;
}

export async function getUserLoyaltyPoints(): Promise<LoyaltyPoints> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${BACKEND_URL}/api/loyalty/points`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch loyalty points');
  }

  return await response.json();
}

export async function getPointsHistory(limit: number = 50): Promise<{ history: PointsHistory[] }> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${BACKEND_URL}/api/loyalty/history?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch points history');
  }

  return await response.json();
}

export async function redeemLoyaltyPoints(bookingId: string): Promise<{ message: string; discount: number }> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${BACKEND_URL}/api/loyalty/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to redeem points');
  }

  return await response.json();
}

export async function calculatePoints(services: string[]): Promise<{ points: number; category: string }> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${BACKEND_URL}/api/loyalty/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ services }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate points');
  }

  return await response.json();
}
