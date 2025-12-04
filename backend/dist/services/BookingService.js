"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = require("crypto");
class BookingService {
    supabaseInstance = null;
    // Service configurations: duration in hours and staff group assignment
    serviceConfig = {
        // Group A - Mehendi Staff
        'mehendi': { duration: 0, staffGroup: 'mehendi' }, // duration set by user
        // Group B - Beauty Staff (all share same person)
        'lash-lift': { duration: 1, staffGroup: 'beauty' },
        'brow-lift': { duration: 1, staffGroup: 'beauty' },
        'threading': { duration: 1, staffGroup: 'beauty' },
        'makeup': { duration: 2, staffGroup: 'beauty' },
        'bridal-makeup': { duration: 4, staffGroup: 'beauty' }, // 4-hour block
    };
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
    /**
     * Get the staff group for services being booked
     */
    getStaffGroupsForServices(services, mehendiHours = 0) {
        const staffGroups = new Set();
        services.forEach(svc => {
            const config = this.serviceConfig[svc];
            if (config) {
                staffGroups.add(config.staffGroup);
            }
        });
        return staffGroups;
    }
    /**
     * Get the duration for a service
     */
    getServiceDuration(service, mehendiHours = 0) {
        const config = this.serviceConfig[service];
        if (!config)
            return 1; // default 1 hour
        if (service === 'mehendi') {
            return mehendiHours || 1;
        }
        return config.duration;
    }
    /**
     * Check if a time slot is available
     * Returns true if the booking can fit without conflicts
     */
    isTimeSlotAvailable(startHour, totalDuration, existingBookings, staffGroupsNeeded) {
        // Allow any start time from 9 onwards (can extend beyond 18)
        // Reasonable max is 22 to prevent midnight bookings
        if (startHour < 9 || startHour > 22) {
            return false;
        }
        // Check for conflicts with existing bookings in the same staff group
        for (const booking of existingBookings) {
            const bookingHour = parseInt(booking.time.split(':')[0]);
            const bookingServices = booking.service.split(',').map((s) => s.trim());
            const bookingMehendiHours = booking.mehendi_hours || 0;
            // Get staff groups used by this existing booking
            const existingStaffGroups = this.getStaffGroupsForServices(bookingServices, bookingMehendiHours);
            // Calculate existing booking duration
            let existingDuration = 0;
            bookingServices.forEach((svc) => {
                const duration = this.getServiceDuration(svc, bookingMehendiHours);
                existingDuration = Math.max(existingDuration, duration);
            });
            const existingEndHour = bookingHour + existingDuration;
            const endHour = startHour + totalDuration;
            // Check if any staff group overlaps
            for (const staffGroup of staffGroupsNeeded) {
                if (existingStaffGroups.has(staffGroup)) {
                    // Same staff group - check for time overlap
                    if (!(endHour <= bookingHour || startHour >= existingEndHour)) {
                        // There's a conflict
                        return false;
                    }
                }
            }
        }
        return true;
    }
    async validateTimeSlot(date, time, service, mehendiHours = 0) {
        const supabase = this.getSupabase();
        const { data: existingBookings, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('date', date)
            .neq('status', 'cancelled'); // Exclude cancelled bookings
        if (fetchError) {
            throw new Error(`Error checking existing bookings: ${fetchError.message}`);
        }
        const requestedHour = parseInt(time?.split(':')[0] || '0');
        const requestedServices = service.split(',').map((s) => s.trim());
        // Check if any requested service is a makeup service
        const isMakeupService = requestedServices.some(svc => ['makeup', 'bridal-makeup'].includes(svc));
        // Calculate total duration needed for this booking
        let totalDuration = 0;
        requestedServices.forEach((svc) => {
            const duration = this.getServiceDuration(svc, mehendiHours);
            totalDuration = Math.max(totalDuration, duration);
        });
        // Get staff groups needed
        const staffGroupsNeeded = this.getStaffGroupsForServices(requestedServices, mehendiHours);
        // Check if slot is available
        const isAvailable = this.isTimeSlotAvailable(requestedHour, totalDuration, existingBookings || [], staffGroupsNeeded);
        if (!isAvailable) {
            return {
                isAvailable: false,
                conflictingHour: requestedHour,
                conflictingService: requestedServices[0],
            };
        }
        return { isAvailable: true };
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
    async getAvailableTimes(date, services, mehendiHours = 0) {
        const supabase = this.getSupabase();
        const { data: bookings, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('date', date)
            .neq('status', 'cancelled'); // Exclude cancelled bookings
        if (fetchError) {
            throw new Error(`Error fetching bookings: ${fetchError.message}`);
        }
        // Check if any service is makeup (allows extra hours 17-18)
        const isMakeupService = services.some(svc => ['makeup', 'bridal-makeup'].includes(svc));
        // Generate hours list: all services can book from 9-21 (can extend beyond 18:00)
        let allHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
        const availableHours = [];
        // Calculate total duration needed for requested services
        let totalDuration = 0;
        services.forEach((svc) => {
            const duration = this.getServiceDuration(svc, mehendiHours);
            totalDuration = Math.max(totalDuration, duration);
        });
        // Get staff groups needed
        const staffGroupsNeeded = this.getStaffGroupsForServices(services, mehendiHours);
        // Check each hour
        for (const hour of allHours) {
            const isAvailable = this.isTimeSlotAvailable(hour, totalDuration, bookings || [], staffGroupsNeeded);
            if (isAvailable) {
                availableHours.push(hour);
            }
        }
        return {
            availableHours,
            unavailableHours: allHours.filter(h => !availableHours.includes(h)),
        };
    }
    async getBookingsByUserId(userId) {
        const supabase = this.getSupabase();
        console.log('🔍 Fetching bookings for userId:', userId);
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        if (error) {
            console.error('❌ Error fetching bookings:', error);
            throw new Error(`Error fetching bookings: ${error.message}`);
        }
        console.log(`✅ Found ${data?.length || 0} bookings for userId ${userId}`);
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
    async getAllBookings() {
        const supabase = this.getSupabase();
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('date', { ascending: false });
        if (error) {
            throw new Error(`Error fetching bookings: ${error.message}`);
        }
        return data || [];
    }
    async updateBookingStatus(bookingId, status) {
        const supabase = this.getSupabase();
        try {
            const { data, error } = await supabase
                .from('bookings')
                .update({ status })
                .eq('id', bookingId)
                .select()
                .single();
            if (error) {
                // If error is about missing column, provide helpful message
                if (error.message.includes('status')) {
                    throw new Error('Status column not found. Please run the migration: ALTER TABLE bookings ADD COLUMN status VARCHAR(50) DEFAULT \'pending\';');
                }
                throw new Error(`Error updating booking status: ${error.message}`);
            }
            return data;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            throw new Error(`Error updating booking status: ${errorMessage}`);
        }
    }
    async cancelBookingAdmin(bookingId) {
        const supabase = this.getSupabase();
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);
        if (error) {
            throw new Error(`Error cancelling booking: ${error.message}`);
        }
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=BookingService.js.map