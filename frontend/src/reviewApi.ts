const API_URL = process.env.REACT_APP_API_URL || '/api';

// Get authentication token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Create a new review
export async function submitReview(rating: number, comment: string) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to submit a review');
  }

  const response = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      rating,
      comment,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit review');
  }

  return data.review;
}

// Get all reviews (public)
export async function getAllReviews(limit = 10, offset = 0) {
  const response = await fetch(
    `${API_URL}/reviews?limit=${limit}&offset=${offset}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch reviews');
  }

  return data;
}

// Get review statistics
export async function getReviewStats() {
  const response = await fetch(`${API_URL}/reviews/stats`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch statistics');
  }

  return data;
}

// Get user's own reviews
export async function getMyReviews(limit = 10, offset = 0) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in');
  }

  const response = await fetch(
    `${API_URL}/reviews/user/my-reviews?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch reviews');
  }

  return data;
}

// Get review with replies
export async function getReviewWithReplies(reviewId: number) {
  const response = await fetch(`${API_URL}/reviews/${reviewId}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch review');
  }

  return data;
}

// Add reply to review
export async function addReplyToReview(reviewId: number, reply: string) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to reply');
  }

  const response = await fetch(`${API_URL}/reviews/${reviewId}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      reply,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to add reply');
  }

  return data.reply;
}

// Delete reply to review
export async function deleteReply(reviewId: number, replyId: number) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to delete a reply');
  }

  const response = await fetch(`${API_URL}/reviews/${reviewId}/reply/${replyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete reply');
  }

  return data;
}

// Update review
export async function updateReview(
  reviewId: number,
  rating: number,
  comment: string
) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in');
  }

  const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      rating,
      comment,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update review');
  }

  return data.review;
}

// Delete review
export async function deleteReview(reviewId: number) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in');
  }

  const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete review');
  }

  return data;
}
