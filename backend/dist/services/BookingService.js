"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = require("crypto");
class BookingService {
    supabaseInstance = null;
    getSupabase() {
        if (!this.supabaseInstance) {
            const url = process.env.SUPABASE_URL;
            const key = process.env.SUPABASE_SERVICE_ROLE;
            if (!url || !key) {
                throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables are required');
            }
            this.supabaseInstance = (0, supabase_js_1.createClient)(url, key);
        }
        return this.supabaseInstance;
    }
    async validateTimeSlot(date, time, service, mehendiHours = 0) {
        const supabase = this.getSupabase();
        const { data: existingBookings, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('date', date);
        if (fetchError) {
            throw new Error(`Error checking existing bookings: ${fetchError.message}`);
        }
        const requestedHour = parseInt(time?.split(':')[0] || '0');
        const requestedServices = service.split(',').map((s) => s.trim());
        const hoursToBlock = this.calculateBlockedHours(requestedServices, requestedHour, mehendiHours);
        // Check for conflicts
        for (const booking of existingBookings || []) {
            const bookingHour = parseInt(booking.time.split(':')[0]);
            const bookingServices = booking.service.split(',').map((s) => s.trim());
            const bookedHours = this.calculateBlockedHours(bookingServices, bookingHour, booking.mehendi_hours || 0);
            // Check for overlap
            for (const hour of hoursToBlock) {
                if (bookedHours.has(hour)) {
                    return {
                        isAvailable: false,
                        conflictingHour: hour,
                        conflictingService: bookingServices[0],
                    };
                }
            }
        }
        return { isAvailable: true };
    }
    calculateBlockedHours(services, startHour, mehendiHours = 0) {
        const blockedHours = new Set();
        services.forEach((svc) => {
            if (svc === 'bridal-makeup') {
                for (let i = 9; i <= 18; i++) {
                    blockedHours.add(i);
                }
            }
            else if (svc === 'lash-lift' || svc === 'brow-lift' || svc === 'threading') {
                blockedHours.add(startHour);
            }
            else if (svc === 'makeup') {
                for (let i = 0; i < 3; i++) {
                    blockedHours.add(startHour + i);
                }
            }
            else if (svc === 'mehendi') {
                const hours = mehendiHours || 1;
                for (let i = 0; i < hours; i++) {
                    blockedHours.add(startHour + i);
                }
            }
        });
        return blockedHours;
    }
    async createBooking(bookingData) {
        const supabase = this.getSupabase();
        const cancelToken = (0, crypto_1.randomUUID)();
        const { error: dbError } = await supabase.from('bookings').insert([
            {
                name: bookingData.name,
                email: bookingData.email,
                phone: bookingData.phone,
                service: bookingData.service,
                date: bookingData.date,
                time: bookingData.time,
                location: bookingData.location,
                address: bookingData.address,
                notes: bookingData.notes,
                cancel_token: cancelToken,
                total_price: bookingData.totalPrice || 0,
                service_pricing: bookingData.servicePricing || [],
                mehendi_hours: bookingData.mehendiHours || 0,
                user_id: bookingData.userId || null,
            },
        ]);
        if (dbError) {
            throw new Error(`Database error: ${dbError.message}`);
        }
        return { cancelToken };
    }
    async getBookingByToken(token) {
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('cancel_token', token)
            .single();
        if (error || !data) {
            throw new Error('Booking not found or already cancelled');
        }
        return data;
    }
    async cancelBooking(id) {
        const supabase = this.getSupabase();
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Error cancelling booking: ${error.message}`);
        }
    }
    async getAvailableTimes(date, services) {
        const supabase = this.getSupabase();
        const { data: bookings, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('date', date);
        if (fetchError) {
            throw new Error(`Error fetching bookings: ${fetchError.message}`);
        }
        const allHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
        const unavailableHours = new Set();
        bookings?.forEach((booking) => {
            const bookingTime = parseInt(booking.time.split(':')[0]);
            const bookingServices = booking.service.split(',').map((s) => s.trim());
            const blockedHours = this.calculateBlockedHours(bookingServices, bookingTime, booking.mehendi_hours || 0);
            blockedHours.forEach(hour => unavailableHours.add(hour));
        });
        const availableHours = allHours.filter(hour => !unavailableHours.has(hour));
        return {
            availableHours,
            unavailableHours: Array.from(unavailableHours),
        };
    }
    async getBookingsByUserId(userId) {
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        if (error) {
            throw new Error(`Error fetching bookings: ${error.message}`);
        }
        return data || [];
    }
    async cancelBookingByUserAndId(bookingId, userId) {
        const supabase = this.getSupabase();
        // First, get the booking to verify ownership
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();
        if (fetchError || !booking) {
            throw new Error('Booking not found');
        }
        // Check if booking belongs to user
        if (booking.user_id !== userId) {
            throw new Error('Not authorized to cancel this booking');
        }
        // Delete the booking
        const { error: deleteError } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);
        if (deleteError) {
            throw new Error(`Error cancelling booking: ${deleteError.message}`);
        }
        return booking;
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=BookingService.js.map