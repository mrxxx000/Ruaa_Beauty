"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const BookingService_1 = require("../services/BookingService");
const EmailService_1 = require("../services/EmailService");
const router = express_1.default.Router();
const bookingService = new BookingService_1.BookingService();
const emailService = new EmailService_1.EmailService();
// POST /api/booking - Create a new booking
router.post('/booking', async (req, res) => {
    const { name, email, phone, service, date, time, location, address, notes, totalPrice, servicePricing, mehendiHours } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }
    if (!date || !time) {
        return res.status(400).json({ message: 'Date and time are required' });
    }
    try {
        // Validate time slot
        const validation = await bookingService.validateTimeSlot(date, time, service, mehendiHours);
        if (!validation.isAvailable) {
            return res.status(409).json({
                message: 'This time slot is already booked. Please select a different date or time.',
                conflictingService: validation.conflictingService,
                conflictingHour: validation.conflictingHour,
                conflictingDate: date,
            });
        }
        // Create booking
        const { cancelToken } = await bookingService.createBooking({
            name,
            email,
            phone,
            service,
            date,
            time,
            location,
            address,
            notes,
            totalPrice,
            servicePricing,
            mehendiHours,
        });
        console.log('✅ Booking saved to database');
        // Send response immediately
        res.status(200).json({
            message: 'Booking saved successfully. Confirmation email will be sent shortly.',
            cancelToken,
        });
        // Send emails asynchronously
        emailService.sendBookingConfirmation({
            name,
            email,
            phone,
            service,
            date,
            time,
            location,
            address,
            notes,
            totalPrice,
            servicePricing,
            mehendiHours,
            cancelToken,
        });
    }
    catch (err) {
        console.error('❌ Error processing booking:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error processing booking',
            details: errorMessage,
        });
    }
});
// POST /api/unbook - Cancel a booking
router.post('/unbook', async (req, res) => {
    const { token } = req.body || req.query || {};
    if (!token) {
        return res.status(400).json({ message: 'Cancel token is required' });
    }
    try {
        // Get booking
        const booking = await bookingService.getBookingByToken(token);
        // Cancel booking
        await bookingService.cancelBooking(booking.id);
        // Send response immediately
        res.status(200).json({
            message: 'Booking cancelled successfully',
            booking: {
                name: booking.name,
                email: booking.email,
                service: booking.service,
                date: booking.date,
            },
        });
        // Send cancellation emails asynchronously
        emailService.sendCancellationEmails(booking);
    }
    catch (err) {
        console.error('Error processing cancellation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('not found')) {
            return res.status(404).json({ message: 'Booking not found or already cancelled' });
        }
        res.status(500).json({
            message: 'Error processing cancellation',
            details: errorMessage,
        });
    }
});
// GET /api/available-times - Get available time slots
router.get('/available-times', async (req, res) => {
    const { date, services } = req.query;
    if (!date || !services) {
        return res.status(400).json({ message: 'Date and services are required' });
    }
    try {
        const servicesArray = typeof services === 'string'
            ? services.split(',').map(s => s.trim())
            : Array.isArray(services) ? services : [];
        const { availableHours, unavailableHours } = await bookingService.getAvailableTimes(date, servicesArray);
        res.status(200).json({
            date,
            availableHours,
            unavailableHours,
        });
    }
    catch (err) {
        console.error('Error fetching available times:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({
            message: 'Error fetching available times',
            details: errorMessage,
        });
    }
});
exports.default = router;
//# sourceMappingURL=bookingRoutes.js.map