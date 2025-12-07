"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const MediaService_1 = require("../services/MediaService");
const AuthService_1 = require("../services/AuthService");
const router = express_1.default.Router();
const mediaService = new MediaService_1.MediaService();
const authService = new AuthService_1.AuthService();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// Configure multer for file uploads (keep files in memory)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
    },
    fileFilter: (_req, file, cb) => {
        // Allowed MIME types
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'video/x-msvideo',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type: ${file.mimetype}`));
        }
    },
});
// Middleware to verify admin token
const verifyAdminToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Check if user is admin
        const isAdmin = await authService.isAdmin(decoded.id);
        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
/**
 * POST /api/media/upload
 * Upload image or video (admin only)
 * Form data: file (multipart), service (string: 'mehendi', 'makeup', 'lashes', etc.)
 */
router.post('/upload', verifyAdminToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }
        const { service } = req.body;
        if (!service) {
            return res.status(400).json({ message: 'Service type is required (mehendi, makeup, lashes, etc.)' });
        }
        // Determine file type from MIME type
        const fileType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
        const result = await mediaService.uploadFile(req.file.buffer, req.file.originalname, fileType, service, req.userId);
        res.status(201).json({
            message: 'File uploaded successfully',
            data: result,
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            message: 'Upload failed',
            details: errorMessage,
        });
    }
});
/**
 * GET /api/media
 * Get all media files (optionally filtered by service or type)
 * Query params: service (optional), type (optional: 'image' or 'video')
 */
router.get('/', async (req, res) => {
    try {
        const { service, type } = req.query;
        const media = await mediaService.getAllMedia(service ? String(service) : undefined, type ? String(type) : undefined);
        res.status(200).json({
            message: 'Media retrieved successfully',
            data: media,
            count: media.length,
        });
    }
    catch (error) {
        console.error('Get media error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            message: 'Failed to fetch media',
            details: errorMessage,
        });
    }
});
/**
 * GET /api/media/service/:service
 * Get media by service (e.g., 'mehendi', 'makeup', 'lashes')
 */
router.get('/service/:service', async (req, res) => {
    try {
        const { service } = req.params;
        const media = await mediaService.getMediaByService(service);
        res.status(200).json({
            message: `Media for ${service} retrieved successfully`,
            service,
            data: media,
            count: media.length,
        });
    }
    catch (error) {
        console.error('Get service media error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            message: 'Failed to fetch media',
            details: errorMessage,
        });
    }
});
/**
 * DELETE /api/media/:mediaId
 * Delete a media file (admin only)
 */
router.delete('/:mediaId', verifyAdminToken, async (req, res) => {
    try {
        const { mediaId } = req.params;
        if (!mediaId) {
            return res.status(400).json({ message: 'Media ID is required' });
        }
        await mediaService.deleteMedia(mediaId);
        res.status(200).json({
            message: 'Media deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete media error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            message: 'Failed to delete media',
            details: errorMessage,
        });
    }
});
exports.default = router;
//# sourceMappingURL=mediaRoutes.js.map