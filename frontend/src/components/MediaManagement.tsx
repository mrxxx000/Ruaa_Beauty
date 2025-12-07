import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Play, Image as ImageIcon, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { uploadMedia, getAllMedia, deleteMedia, MediaItem } from '../mediaApi';
import '../styles/media-management.css';

interface MediaManagementProps {
  token: string;
}

// Define upload rules for each service
const SERVICE_CONFIG = {
  mehendi: {
    label: 'Mehendi',
    allowedTypes: ['image'], // Route only - images only
    description: 'Upload images only for Mehendi page gallery',
  },
  mehendi_videos: {
    label: 'Mehendi Videos (Home)',
    allowedTypes: ['video'], // Home page videos only
    description: 'Upload videos only for Mehendi section on Home page',
  },
  makeup: {
    label: 'Makeup',
    allowedTypes: ['image', 'video'], // Both for route
    description: 'Upload both images and videos for Makeup page',
  },
  lashes: {
    label: 'Lashes',
    allowedTypes: ['image', 'video'], // Both for route
    description: 'Upload both images and videos for Lashes page',
  },
  lashes_videos: {
    label: 'Lashes Videos (Home)',
    allowedTypes: ['video'], // Home page videos only
    description: 'Upload videos only for Lashes section on Home page',
  },
  other: {
    label: 'Other',
    allowedTypes: ['image', 'video'],
    description: 'Upload any media for Other category',
  },
};

export default function MediaManagement({ token }: MediaManagementProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedService, setSelectedService] = useState<string>('mehendi');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');

  // Load media on component mount
  useEffect(() => {
    loadMedia();
  }, [selectedService]);

  const loadMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllMedia(selectedService);
      setMedia(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const getServiceConfig = (service: string) => {
    return SERVICE_CONFIG[service as keyof typeof SERVICE_CONFIG] || SERVICE_CONFIG.other;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const config = getServiceConfig(selectedService);

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit');
      return;
    }

    // Determine file type from MIME type
    const isImage = file.type.startsWith('image');
    const isVideo = file.type.startsWith('video');
    let fileType: 'image' | 'video' | null = null;

    if (isImage) fileType = 'image';
    else if (isVideo) fileType = 'video';

    // Validate file type against service rules
    if (!fileType) {
      setError('Invalid file type. Only images and videos are allowed.');
      return;
    }

    if (!config.allowedTypes.includes(fileType)) {
      const allowedTypesText = config.allowedTypes.join(' and ');
      setError(
        `${config.label} section only allows ${allowedTypesText}. This file is a ${fileType}.`
      );
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await uploadMedia(selectedFile, selectedService, token);
      setSuccess(`${selectedFile.name} uploaded successfully!`);
      setSelectedFile(null);
      setFilePreview('');
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload media
      setTimeout(() => loadMedia(), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: string, filename: string) => {
    if (!window.confirm(`Delete "${filename}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteMedia(mediaId, token);
      setSuccess('Media deleted successfully');
      loadMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete media');
      setLoading(false);
    }
  };

  const isImage = (item: MediaItem) => item.type === 'image';
  const isVideo = (item: MediaItem) => item.type === 'video';
  const config = getServiceConfig(selectedService);

  return (
    <div className="media-management">
      <div className="media-header">
        <h2>📁 Media Management</h2>
        <p>Upload and manage media for each service with specific rules</p>
      </div>

      {/* Service Selector */}
      <div className="service-selector">
        <label>Service Category:</label>
        <div className="service-buttons">
          {Object.entries(SERVICE_CONFIG).map(([key, svc]) => (
            <button
              key={key}
              className={`service-btn ${selectedService === key ? 'active' : ''}`}
              onClick={() => setSelectedService(key)}
              title={svc.description}
            >
              {svc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Service Info */}
      <div className="service-info">
        <Info size={18} />
        <div>
          <strong>{config.label}</strong>: {config.description}
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <h3>📤 Upload {config.label} Media</h3>
        
        <div className="upload-container">
          <div className="file-input-wrapper">
            <input
              id="file-input"
              type="file"
              accept={config.allowedTypes.includes('image') && config.allowedTypes.includes('video') 
                ? 'image/*,video/*'
                : config.allowedTypes.includes('image')
                ? 'image/*'
                : 'video/*'
              }
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="file-input" className="file-label">
              <Upload size={32} />
              <span>Click to select or drag & drop</span>
              <small>
                {config.allowedTypes.includes('image') && config.allowedTypes.includes('video')
                  ? 'Images (JPG, PNG, GIF, WebP) or Videos (MP4, WebM, MOV) - Max 100MB'
                  : config.allowedTypes.includes('image')
                  ? 'Images only (JPG, PNG, GIF, WebP) - Max 100MB'
                  : 'Videos only (MP4, WebM, MOV) - Max 100MB'}
              </small>
            </label>
          </div>

          {filePreview && (
            <div className="preview-section">
              <h4>Preview:</h4>
              {selectedFile?.type.startsWith('image') ? (
                <img src={filePreview} alt="Preview" className="preview-image" />
              ) : (
                <video src={filePreview} className="preview-video" controls />
              )}
              <p className="preview-name">{selectedFile?.name}</p>
            </div>
          )}
        </div>

        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="message success-message">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Media Gallery */}
      <div className="media-gallery-section">
        <h3>
          📸 {config.label} Media
          {!loading && ` (${media.length})`}
        </h3>

        {loading && <div className="loading">Loading media...</div>}

        {!loading && media.length === 0 && (
          <div className="empty-state">
            <p>No media uploaded yet for {selectedService}</p>
          </div>
        )}

        {!loading && media.length > 0 && (
          <div className="media-grid">
            {media.map((item) => (
              <div key={item.id} className="media-card">
                <div className="media-preview">
                  {isImage(item) ? (
                    <>
                      <img src={item.url} alt={item.filename} loading="lazy" />
                      <div className="media-badge">
                        <ImageIcon size={16} /> Image
                      </div>
                    </>
                  ) : (
                    <>
                      <video src={item.url} />
                      <div className="media-badge">
                        <Play size={16} /> Video
                      </div>
                    </>
                  )}
                </div>

                <div className="media-info">
                  <p className="media-name" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="media-date">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(item.id, item.filename)}
                  title="Delete media"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
