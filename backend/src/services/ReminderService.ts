import * as cron from 'node-cron';
import SibApiV3Sdk from 'sib-api-v3-sdk';
import { createClient } from '@supabase/supabase-js';

export class ReminderService {
  private supabase;
  private brevoClient;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    // Initialize Supabase
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE || ''
    );

    // Initialize Brevo client
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY || '';
    
    this.brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  // Start the cron job (runs every hour)
  start() {
    if (this.cronJob) {
      console.log('⚠️ Reminder service already running');
      return;
    }

    // Run every hour at minute 0
    this.cronJob = cron.schedule('0 * * * *', async () => {
      console.log('🔔 Running 24-hour reminder check...');
      await this.sendReminders();
    });

    console.log('✅ 24-hour reminder service started (runs every hour)');
  }

  // Stop the cron job
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('⏹️ Reminder service stopped');
    }
  }

  // Send reminders for appointments 24 hours away
  private async sendReminders() {
    try {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Fetch upcoming bookings (confirmed or paid)
      const { data: bookings, error } = await this.supabase
        .from('bookings')
        .select('*')
        .in('status', ['confirmed', 'pending'])
        .neq('payment_status', 'cancelled');

      if (error) {
        console.error('❌ Error fetching bookings:', error);
        return;
      }

      if (!bookings || bookings.length === 0) {
        console.log('📭 No bookings to check for reminders');
        return;
      }

      let remindersSent = 0;

      for (const booking of bookings) {
        try {
          // Parse booking date and time
          const bookingDate = new Date(`${booking.date}T${booking.time}:00`);
          
          // Check if appointment is ~24 hours away (±30 minutes window)
          const timeDiff = Math.abs(bookingDate.getTime() - reminderTime.getTime());
          const thirtyMinutes = 30 * 60 * 1000;

          if (timeDiff < thirtyMinutes) {
            // Check if reminder already sent (to avoid duplicates)
            const { data: existingReminder } = await this.supabase
              .from('booking_reminders')
              .select('*')
              .eq('booking_id', booking.id)
              .single();

            if (existingReminder) {
              console.log(`⏭️ Reminder already sent for booking ${booking.id}`);
              continue;
            }

            // Send reminder email
            await this.sendReminderEmail(booking);
            
            // Mark reminder as sent
            await this.supabase.from('booking_reminders').insert({
              booking_id: booking.id,
              sent_at: new Date().toISOString(),
            });

            remindersSent++;
            console.log(`✅ Reminder sent to ${booking.email} for ${booking.date} ${booking.time}`);
          }
        } catch (err) {
          console.error(`❌ Failed to process reminder for booking ${booking.id}:`, err);
        }
      }

      console.log(`📧 Sent ${remindersSent} reminder(s)`);
    } catch (err) {
      console.error('❌ Error in sendReminders:', err);
    }
  }

  // Send individual reminder email
  private async sendReminderEmail(booking: any) {
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .reminder-badge { background: #ff6fa3; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Appointment Reminder</h1>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="reminder-badge">Your appointment is tomorrow!</span>
            </div>
            <p>Hello <strong>${booking.name}</strong>,</p>
            <p>This is a friendly reminder that your appointment is scheduled for tomorrow:</p>
            
            <div class="booking-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span>${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏰ Time:</span>
                <span>${booking.time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">💄 Service:</span>
                <span>${booking.service}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📍 Location:</span>
                <span>${booking.address || 'Studio'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">💰 Total:</span>
                <span>${booking.total_price || 0} kr</span>
              </div>
            </div>

            <p>We look forward to seeing you! If you need to reschedule or have any questions, please contact us as soon as possible.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Ruaa Beauty Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Ruaa Beauty. All rights reserved.</p>
            <p>Odengatan 56, 274 31 Skurup</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const sendSmtpEmail = {
      sender: { 
        name: 'Ruaa Beauty', 
        email: process.env.SMTP_FROM || 'noreply@ruaabeauty.com' 
      },
      to: [{ email: booking.email, name: booking.name }],
      subject: '🔔 Reminder: Your appointment is tomorrow!',
      htmlContent: emailContent,
    };

    await this.brevoClient.sendTransacEmail(sendSmtpEmail);
  }

}
