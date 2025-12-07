import { createClient } from '@supabase/supabase-js';

export class PendingBookingService {
  private supabaseInstance: any = null;

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
   * Save a booking for a user who hasn't created an account yet
   * The booking will be stored with the email address and linked to user_id once they register
   */
  async savePendingBooking(bookingData: any) {
    const supabase = this.getSupabase();
    
    const insertData: any = {
      email: bookingData.email.toLowerCase(), // Store lowercase email for easier matching
      name: bookingData.name,
      phone: bookingData.phone,
      service: bookingData.service,
      date: bookingData.date,
      time: bookingData.time,
      location: bookingData.location,
      address: bookingData.address,
      notes: bookingData.notes,
      total_price: bookingData.totalPrice || 0,
      service_pricing: bookingData.servicePricing || [],
      mehendi_hours: bookingData.mehendiHours || 0,
      payment_method: bookingData.paymentMethod || 'none',
      payment_status: bookingData.paymentStatus || 'unpaid',
      booking_data: bookingData, // Store full booking data as JSON
      is_processed: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('pending_bookings')
      .insert([insertData])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Error saving pending booking: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all pending bookings by email
   */
  async getPendingBookingsByEmail(email: string) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('pending_bookings')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_processed', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching pending bookings: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Mark pending bookings as processed (when converting to actual bookings)
   */
  async markPendingBookingsAsProcessed(email: string) {
    const supabase = this.getSupabase();
    const { error } = await supabase
      .from('pending_bookings')
      .update({ is_processed: true, processed_at: new Date().toISOString() })
      .eq('email', email.toLowerCase())
      .eq('is_processed', false);

    if (error) {
      throw new Error(`Error marking pending bookings as processed: ${error.message}`);
    }
  }

  /**
   * Delete a pending booking
   */
  async deletePendingBooking(id: string) {
    const supabase = this.getSupabase();
    const { error } = await supabase
      .from('pending_bookings')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting pending booking: ${error.message}`);
    }
  }
}
