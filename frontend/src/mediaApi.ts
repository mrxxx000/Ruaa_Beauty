// Determine API base URL - use environment variable or construct from current location
let API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL;

if (!API_BASE_URL) {
  // Fallback: construct from current location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Development environment
    API_BASE_URL = 'http://localhost:10000/api';
  } else {
    // Production environment - use same domain
    API_BASE_URL = `${protocol}//${hostname}/api`;
  }
}

// Ensure API_BASE_URL ends without /api if REACT_APP_BACKEND_URL was used
if (API_BASE_URL && !API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = API_BASE_URL + '/api';
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video';
  service: string;
  createdAt: string;
  uploadedBy: number;
}

export interface UploadResponse {
  message: string;
  data: {
    id: string;
    url: string;
    filename: string;
  };
}

/**
 * Upload a file (image or video)
 */
export const uploadMedia = async (
  file: File,
  service: string,
  token: string
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('service', service);

  const response = await fetch(`${API_BASE_URL}/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.message || 'Upload failed');
  }

  return response.json();
};

/**
 * Get all media or filter by service/type
 */
export const getAllMedia = async (
  service?: string,
  type?: 'image' | 'video'
): Promise<MediaItem[]> => {
  const params = new URLSearchParams();
  if (service) params.append('service', service);
  if (type) params.append('type', type);

  const response = await fetch(
    `${API_BASE_URL}/media${params.toString() ? `?${params.toString()}` : ''}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch media');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Get media by service
 */
export const getMediaByService = async (
  service: string
): Promise<MediaItem[]> => {
  const response = await fetch(`${API_BASE_URL}/media/service/${service}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${service} media`);
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Delete a media file
 */
export const deleteMedia = async (
  mediaId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/media/${mediaId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.message || 'Delete failed');
  }
};
