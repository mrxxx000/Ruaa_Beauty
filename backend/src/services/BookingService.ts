import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export class BookingService {
  private supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE || ''
  );

  async validateTimeSlot(date: string, time: string, service: string, mehendiHours: number = 0) {
    const { data: existingBookings, error: fetchError } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('date', date);

    if (fetchError) {
      throw new Error(`Error checking existing bookings: ${fetchError.message}`);
    }

    const requestedHour = parseInt(time?.split(':')[0] || '0');
    const requestedServices = service.split(',').map((s: string) => s.trim());
    const hoursToBlock = this.calculateBlockedHours(requestedServices, requestedHour, mehendiHours);

    // Check for conflicts
    for (const booking of existingBookings || []) {
      const bookingHour = parseInt(booking.time.split(':')[0]);
      const bookingServices = booking.service.split(',').map((s: string) => s.trim());
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

  private calculateBlockedHours(services: string[], startHour: number, mehendiHours: number = 0): Set<number> {
    const blockedHours = new Set<number>();

    services.forEach((svc: string) => {
      if (svc === 'bridal-makeup') {
        for (let i = 9; i <= 18; i++) {
          blockedHours.add(i);
        }
      } else if (svc === 'lash-lift' || svc === 'brow-lift' || svc === 'threading') {
        blockedHours.add(startHour);
      } else if (svc === 'makeup') {
        for (let i = 0; i < 3; i++) {
          blockedHours.add(startHour + i);
        }
      } else if (svc === 'mehendi') {
        const hours = mehendiHours || 1;
        for (let i = 0; i < hours; i++) {
          blockedHours.add(startHour + i);
        }
      }
    });

    return blockedHours;
  }

  async createBooking(bookingData: any) {
    const cancelToken = randomUUID();

    const { error: dbError } = await this.supabase.from('bookings').insert([
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
      },
    ]);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    return { cancelToken };
  }

  async getBookingByToken(token: string) {
    const { data, error } = await this.supabase
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
    const { error } = await this.supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error cancelling booking: ${error.message}`);
    }
  }

  async getAvailableTimes(date: string, services: string[]) {
    const { data: bookings, error: fetchError } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('date', date);

    if (fetchError) {
      throw new Error(`Error fetching bookings: ${fetchError.message}`);
    }

    const allHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const unavailableHours = new Set<number>();

    bookings?.forEach((booking: any) => {
      const bookingTime = parseInt(booking.time.split(':')[0]);
      const bookingServices = booking.service.split(',').map((s: string) => s.trim());
      const blockedHours = this.calculateBlockedHours(bookingServices, bookingTime, booking.mehendi_hours || 0);

      blockedHours.forEach(hour => unavailableHours.add(hour));
    });

    const availableHours = allHours.filter(hour => !unavailableHours.has(hour));

    return {
      availableHours,
      unavailableHours: Array.from(unavailableHours),
    };
  }
}
