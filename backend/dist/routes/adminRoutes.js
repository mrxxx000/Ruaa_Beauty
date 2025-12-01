"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const BookingService_1 = require("../services/BookingService");
const AuthService_1 = require("../services/AuthService");
const EmailService_1 = require("../services/EmailService");
const router = express_1.default.Router();
const bookingService = new BookingService_1.BookingService();
const authService = new AuthService_1.AuthService();
const emailService = new EmailService_1.EmailService();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// Middleware to verify JWT token and check admin role
const verifyAdminToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    console.log('🔐 verifyAdminToken middleware - Authorization header:', authHeader);
    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log('✅ Token verified, decoded:', { id: decoded.id, email: decoded.email, role: decoded.role });
        // Check if user is admin
        const isAdmin = await authService.isAdmin(decoded.id);
        if (!isAdmin) {
            console.log('❌ User is not admin');
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    }
    catch (err) {
        console.log('❌ Token verification failed:', err instanceof Error ? err.message : err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
// GET /api/admin/bookings - Get all bookings (admin only)
router.get('/bookings', verifyAdminToken, async (req, res) => {
    console.log('📋 GET /admin/bookings request');
    try {
        const bookings = await bookingService.getAllBookings();
        res.status(200).json({
            message: 'All bookings retrieved successfully',
            bookings,
        });
    }
    catch (err) {
        console.error('Error fetching bookings:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error fetching bookings',
            details: errorMessage,
        });
    }
});
// GET /api/admin/users - Get all users (admin only)
router.get('/users', verifyAdminToken, async (req, res) => {
    console.log('👥 GET /admin/users request');
    try {
        const users = await authService.getAllUsers();
        res.status(200).json({
            message: 'All users retrieved successfully',
            users,
        });
    }
    catch (err) {
        console.error('Error fetching users:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error fetching users',
            details: errorMessage,
        });
    }
});
// PUT /api/admin/bookings/:bookingId/status - Update booking status (admin only)
router.put('/bookings/:bookingId/status', verifyAdminToken, async (req, res) => {
    const bookingId = req.params.bookingId;
    const { status } = req.body;
    if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID is required' });
    }
    if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required: pending, completed, or cancelled' });
    }
    console.log(`📝 Updating booking ${bookingId} status to ${status}`);
    try {
        const booking = await bookingService.updateBookingStatus(bookingId, status);
        // Send status update emails
        const adminEmail = process.env.ADMIN_EMAIL || 'akmalsafi43@gmail.com';
        const fromEmail = process.env.SMTP_FROM || 'akmalsafi43@gmail.com';
        const statusMessage = status === 'completed' ? '✅ Completed' : status === 'cancelled' ? '❌ Cancelled' : '⏳ Pending';
        // Email to user
        const userEmailSubject = `Booking Status Update - ${statusMessage}`;
        const userEmailContent = `
      <h3>Hi ${booking.name},</h3>
      <p>Your booking status has been updated to: <strong>${statusMessage}</strong></p>
      <hr>
      <h4>Booking Details:</h4>
      <ul>
        <li><strong>Service:</strong> ${booking.service}</li>
        <li><strong>Date:</strong> ${booking.date}</li>
        <li><strong>Time:</strong> ${booking.time}</li>
        <li><strong>Location:</strong> ${booking.location}</li>
      </ul>
      <hr>
      <p>If you have any questions, please contact us.</p>
    `;
        try {
            const brevo = require('@getbrevo/brevo');
            const apiInstance = new brevo.TransactionalEmailsApi();
            apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');
            const userEmailObj = new brevo.SendSmtpEmail();
            userEmailObj.sender = { email: fromEmail, name: 'Ruaa Beauty' };
            userEmailObj.to = [{ email: booking.email }];
            userEmailObj.subject = userEmailSubject;
            userEmailObj.htmlContent = userEmailContent;
            await apiInstance.sendTransacEmail(userEmailObj);
            console.log('✅ Status update email sent to user');
            // Email to admin
            const adminEmailSubject = `Booking Status Updated - ${booking.name}`;
            const adminEmailContent = `
        <h3>Booking Status Updated</h3>
        <p><strong>Name:</strong> ${booking.name}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>New Status:</strong> ${statusMessage}</p>
        <hr>
        <h4>Booking Details:</h4>
        <ul>
          <li><strong>Service:</strong> ${booking.service}</li>
          <li><strong>Date:</strong> ${booking.date}</li>
          <li><strong>Time:</strong> ${booking.time}</li>
          <li><strong>Location:</strong> ${booking.location}</li>
        </ul>
      `;
            const adminEmailObj = new brevo.SendSmtpEmail();
            adminEmailObj.sender = { email: fromEmail, name: 'Ruaa Beauty Bookings' };
            adminEmailObj.to = [{ email: adminEmail }];
            adminEmailObj.subject = adminEmailSubject;
            adminEmailObj.htmlContent = adminEmailContent;
            await apiInstance.sendTransacEmail(adminEmailObj);
            console.log('✅ Status update email sent to admin');
        }
        catch (emailErr) {
            console.warn('⚠️ Email sending failed (non-critical):', emailErr.message);
        }
        res.status(200).json({
            message: 'Booking status updated successfully',
            booking,
        });
    }
    catch (err) {
        console.error('Error updating booking status:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error updating booking status',
            details: errorMessage,
        });
    }
});
// DELETE /api/admin/bookings/:bookingId - Cancel a booking (admin only)
router.delete('/bookings/:bookingId', verifyAdminToken, async (req, res) => {
    const bookingId = req.params.bookingId;
    if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID is required' });
    }
    console.log(`🗑️ Cancelling booking ${bookingId}`);
    try {
        await bookingService.cancelBookingAdmin(bookingId);
        res.status(200).json({
            message: 'Booking cancelled successfully',
        });
    }
    catch (err) {
        console.error('Error cancelling booking:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error cancelling booking',
            details: errorMessage,
        });
    }
});
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map