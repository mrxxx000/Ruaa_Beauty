import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Service configuration with duration and staff group
interface ServiceConfig {
  duration: number; // hours
  staffGroup: string; // which staff handles this
}

export class BookingService {
  private supabaseInstance: any = null;

  // Service configurations: duration in hours and staff group assignment
  private serviceConfig: { [key: string]: ServiceConfig } = {
    // Group A - Mehendi Staff
    'mehendi': { duration: 0, staffGroup: 'mehendi' }, // duration set by user
    
    // Group B - Beauty Staff (all share same person)
    'lash-lift': { duration: 2, staffGroup: 'beauty' },
    'brow-lift': { duration: 2, staffGroup: 'beauty' },
    'threading': { duration: 2, staffGroup: 'beauty' },
    'makeup': { duration: 3, staffGroup: 'beauty' },
    'bridal-makeup': { duration: 9, staffGroup: 'beauty' }, // full day: 9-18
  };

  private getSupabase() {
    if (!this.supabaseInstance) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE;
      if (!url || !key) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables are required');
      }
      this.supabaseInstance = createClient(url, key);
    }
    return this.supabaseInstance;
  }

  /**
   * Get the staff group for services being booked
   */
  private getStaffGroupsForServices(services: string[], mehendiHours: number = 0): Set<string> {
    const staffGroups = new Set<string>();
    
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
  private getServiceDuration(service: string, mehendiHours: number = 0): number {
    const config = this.serviceConfig[service];
    if (!config) return 1; // default 1 hour
    
    if (service === 'mehendi') {
      return mehendiHours || 1;
    }
    
    return config.duration;
  }

  /**
   * Check if a time slot is available
   * Returns true if the booking can fit without conflicts
   */
  private isTimeSlotAvailable(
    startHour: number,
    totalDuration: number,
    existingBookings: any[],
    staffGroupsNeeded: Set<string>
  ): boolean {
    const endHour = startHour + totalDuration;
    
    // Check if booking fits within working hours (9-18)
    if (startHour < 9 || endHour > 18) {
      return false;
    }

    // Check for conflicts with existing bookings in the same staff group
    for (const booking of existingBookings) {
      const bookingHour = parseInt(booking.time.split(':')[0]);
      const bookingServices = booking.service.split(',').map((s: string) => s.trim());
      const bookingMehendiHours = booking.mehendi_hours || 0;
      
      // Get staff groups used by this existing booking
      const existingStaffGroups = this.getStaffGroupsForServices(bookingServices, bookingMehendiHours);
      
      // Calculate existing booking duration
      let existingDuration = 0;
      bookingServices.forEach((svc: string) => {
        const duration = this.getServiceDuration(svc, bookingMehendiHours);
        existingDuration = Math.max(existingDuration, duration);
      });
      
      const existingEndHour = bookingHour + existingDuration;
      
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

  async validateTimeSlot(date: string, time: string, service: string, mehendiHours: number = 0) {
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
    const requestedServices = service.split(',').map((s: string) => s.trim());
    
    // Calculate total duration needed for this booking
    let totalDuration = 0;
    requestedServices.forEach((svc: string) => {
      const duration = this.getServiceDuration(svc, mehendiHours);
      totalDuration = Math.max(totalDuration, duration);
    });
    
    // Get staff groups needed
    const staffGroupsNeeded = this.getStaffGroupsForServices(requestedServices, mehendiHours);
    
    // Check if slot is available
    const isAvailable = this.isTimeSlotAvailable(
      requestedHour,
      totalDuration,
      existingBookings || [],
      staffGroupsNeeded
    );

    if (!isAvailable) {
      return {
        isAvailable: false,
        conflictingHour: requestedHour,
        conflictingService: requestedServices[0],
      };
    }

    return { isAvailable: true };
  }

  async createBooking(bookingData: any) {
    const supabase = this.getSupabase();
    const cancelToken = randomUUID();

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
        payment_method: bookingData.paymentMethod || 'none',
        payment_status: bookingData.paymentStatus || 'unpaid',
        user_id: bookingData.userId || null,
      },
    ]);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    return { cancelToken };
  }

  async getBookingByToken(token: string) {
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

  async cancelBooking(id: string) {
    const supabase = this.getSupabase();
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error cancelling booking: ${error.message}`);
    }
  }

  async updateBookingPaymentStatus(bookingId: string, paymentStatus: string, paypalOrderId?: string) {
    const supabase = this.getSupabase();
    const updateData: any = { payment_status: paymentStatus };
    if (paypalOrderId) {
      updateData.paypal_order_id = paypalOrderId;
    }

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (error) {
      throw new Error(`Error updating payment status: ${error.message}`);
    }
  }

  async getAvailableTimes(date: string, services: string[], mehendiHours: number = 0) {
    const supabase = this.getSupabase();
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', date)
      .neq('status', 'cancelled'); // Exclude cancelled bookings

    if (fetchError) {
      throw new Error(`Error fetching bookings: ${fetchError.message}`);
    }

    const allHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const availableHours: number[] = [];
    
    // Calculate total duration needed for requested services
    let totalDuration = 0;
    services.forEach((svc: string) => {
      const duration = this.getServiceDuration(svc, mehendiHours);
      totalDuration = Math.max(totalDuration, duration);
    });
    
    // Get staff groups needed
    const staffGroupsNeeded = this.getStaffGroupsForServices(services, mehendiHours);
    
    // Check each hour
    for (const hour of allHours) {
      const isAvailable = this.isTimeSlotAvailable(
        hour,
        totalDuration,
        bookings || [],
        staffGroupsNeeded
      );
      
      if (isAvailable) {
        availableHours.push(hour);
      }
    }

    return {
      availableHours,
      unavailableHours: allHours.filter(h => !availableHours.includes(h)),
    };
  }

  async getBookingsByUserId(userId: number) {
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

  async cancelBookingByUserAndId(bookingId: string, userId: number) {
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

  async updateBookingStatus(bookingId: string, status: 'pending' | 'completed' | 'cancelled') {
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
          throw new Error(
            'Status column not found. Please run the migration: ALTER TABLE bookings ADD COLUMN status VARCHAR(50) DEFAULT \'pending\';'
          );
        }
        throw new Error(`Error updating booking status: ${error.message}`);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Error updating booking status: ${errorMessage}`);
    }
  }

  async cancelBookingAdmin(bookingId: string) {
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
