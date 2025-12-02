const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';

// Create PayPal order
export async function createPayPalOrder(bookingData: {
  totalPrice: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  bookingId?: string;
}): Promise<string> {
  const response = await fetch(`${API_URL}/api/payment/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create PayPal order');
  }

  return data.orderId;
}

// Capture PayPal order
export async function capturePayPalOrder(orderId: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/payment/capture-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to capture PayPal order');
  }

  return data.payment;
}

// Get PayPal order details
export async function getPayPalOrderDetails(orderId: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/payment/order-details/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get PayPal order details');
  }

  return data.order;
}
