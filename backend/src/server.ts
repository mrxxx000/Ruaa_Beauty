import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as brevo from '@getbrevo/brevo';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 10000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello from backend');
});

// POST /api/booking - accepts booking data, saves to Supabase, and sends emails
app.post('/api/booking', async (req, res) => {
  const { name, email, phone, service, date, time, location, address, notes, totalPrice, servicePricing, mehendiHours } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE || ''
    );

    // Generate cancel token
    const cancelToken = randomUUID();

    // Save booking to database
    const { error: dbError } = await supabase.from('bookings').insert([
      {
        name,
        email,
        phone,
        service,
        date,
        time,
        location,
        address,
        notes,
        cancel_token: cancelToken,
        total_price: totalPrice || 0,
        service_pricing: servicePricing || [],
        mehendi_hours: mehendiHours || 0,
      },
    ]);

    if (dbError) {
      // eslint-disable-next-line no-console
      console.error('Supabase insert error:', dbError);
      return res.status(500).json({ message: 'Database error', details: dbError.message });
    }

    // eslint-disable-next-line no-console
    console.log('✅ Booking saved to database');

    // Email configuration
    const apiKey = process.env.BREVO_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'akmalsafi43@gmail.com';
    const siteUrl = process.env.SITE_URL || 'https://ruaa-beauty.vercel.app';
    const fromEmail = process.env.SMTP_FROM || 'akmalsafi43@gmail.com';

    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Brevo API key not configured');
      return res.status(200).json({
        message: 'Booking saved to database (emails skipped - API key not configured)',
        cancelToken,
      });
    }

    // Send response immediately
    res.status(200).json({
      message: 'Booking saved successfully. Confirmation email will be sent shortly.',
      cancelToken,
    });

    // Send emails asynchronously
    const sendEmails = async () => {
      try {
        // eslint-disable-next-line no-console
        console.log('📧 Sending emails via Brevo API...');

        // DEBUG: Check API key
        // eslint-disable-next-line no-console
        console.log('🔑 Debug API Key Info:', {
          keyExists: !!apiKey,
          keyLength: apiKey?.length,
          keyPrefix: apiKey?.substring(0, 15),
          keySuffix: apiKey?.substring(apiKey.length - 10),
        });

        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

        // Email to admin
        // eslint-disable-next-line no-console
        console.log(`📤 Sending admin email to: ${adminEmail}`);
        
        // Build pricing details for admin email
        const adminPricingRows = servicePricing && servicePricing.length > 0
          ? servicePricing.map((item: any) => {
              // For Mehendi, show hours breakdown
              if (item.name === 'mehendi' && item.hours) {
                return `
                  <tr>
                    <td style="padding: 8px; text-align: left;">${item.name} (${item.hours}h)</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">${item.price} kr</td>
                  </tr>
                `;
              }
              return `
                <tr>
                  <td style="padding: 8px; text-align: left;">${item.name}</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold;">${item.price} kr</td>
                </tr>
              `;
            }).join('')
          : '';
        
        const adminPricingSection = totalPrice && totalPrice > 0 ? `
          <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Pricing Summary:</h4>
          <table style="width: 100%; border-collapse: collapse;">
            ${adminPricingRows}
            <tr style="border-top: 2px solid #ff6fa3; font-weight: bold;">
              <td style="padding: 12px; text-align: left; font-size: 1.1em;">Total Price</td>
              <td style="padding: 12px; text-align: right; font-size: 1.2em; color: #ff6fa3;">${totalPrice} kr</td>
            </tr>
          </table>
        ` : '';
        
        const adminEmailObj = new brevo.SendSmtpEmail();
        adminEmailObj.sender = { email: fromEmail, name: 'Ruaa Beauty Bookings' };
        adminEmailObj.to = [{ email: adminEmail }];
        adminEmailObj.subject = `New Booking from ${name}`;
        adminEmailObj.htmlContent = `
          <h3>New Booking Request</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Address:</strong> ${address || 'N/A'}</p>
          <p><strong>Notes:</strong> ${notes || 'None'}</p>
          ${adminPricingSection}
        `;

        const adminResult = await apiInstance.sendTransacEmail(adminEmailObj);
        // eslint-disable-next-line no-console
        console.log('✅ Admin email sent:', adminResult);

        // Email to customer
        // eslint-disable-next-line no-console
        console.log(`📤 Sending confirmation email to: ${email}`);
        
        // Build pricing details for email
        const pricingRows = servicePricing && servicePricing.length > 0
          ? servicePricing.map((item: any) => {
              // For Mehendi, show hours breakdown
              if (item.name === 'mehendi' && item.hours) {
                return `
                  <tr>
                    <td style="padding: 8px; text-align: left;">${item.name} (${item.hours}h)</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">${item.price} kr</td>
                  </tr>
                `;
              }
              return `
                <tr>
                  <td style="padding: 8px; text-align: left;">${item.name}</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold;">${item.price} kr</td>
                </tr>
              `;
            }).join('')
          : '';
        
        const pricingSection = totalPrice && totalPrice > 0 ? `
          <hr>
          <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Pricing Summary:</h4>
          <table style="width: 100%; border-collapse: collapse;">
            ${pricingRows}
            <tr style="border-top: 2px solid #ff6fa3; font-weight: bold;">
              <td style="padding: 12px; text-align: left; font-size: 1.1em;">Total Price</td>
              <td style="padding: 12px; text-align: right; font-size: 1.2em; color: #ff6fa3;">${totalPrice} kr</td>
            </tr>
          </table>
        ` : '';

        const userEmailObj = new brevo.SendSmtpEmail();
        userEmailObj.sender = { email: fromEmail, name: 'Ruaa Beauty' };
        userEmailObj.to = [{ email: email }];
        userEmailObj.subject = 'Booking Confirmation - Ruaa Beauty';
        userEmailObj.htmlContent = `
          <h3>Hi ${name},</h3>
          <p>Thank you for booking with Ruaa Beauty! Here are your appointment details:</p>
          <ul>
            <li><strong>Service:</strong> ${service}</li>
            <li><strong>Date:</strong> ${date}</li>
            <li><strong>Time:</strong> ${time}</li>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Address:</strong> ${address || 'N/A'}</li>
          </ul>
          ${pricingSection}
          <p>We will contact you shortly to confirm your appointment.</p>
          <hr>
          <p><small>Need to cancel? <a href="${siteUrl}/unbook?token=${cancelToken}">Click here to cancel your booking</a></small></p>
        `;

        const userResult = await apiInstance.sendTransacEmail(userEmailObj);
        // eslint-disable-next-line no-console
        console.log('✅ Customer email sent:', userResult);
      } catch (emailErr: any) {
        // eslint-disable-next-line no-console
        console.error('❌ Email sending failed:', {
          message: emailErr.message,
          body: emailErr.response?.body,
        });
      }
    };

    // Execute email sending in background
    sendEmails();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Error processing booking:', err);
    res.status(500).json({
      message: 'Error processing booking',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// POST /api/unbook - cancel booking by token
app.post('/api/unbook', async (req, res) => {
  const { token } = req.body || req.query || {};

  if (!token) {
    return res.status(400).json({ message: 'Cancel token is required' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE || ''
    );

    // Find booking by cancel_token
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('cancel_token', token)
      .single();

    if (fetchError || !data) {
      // eslint-disable-next-line no-console
      console.error('Booking fetch error:', fetchError);
      return res.status(404).json({ message: 'Booking not found or already cancelled' });
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error('Delete error:', deleteError);
      return res.status(500).json({ message: 'Error cancelling booking', details: deleteError.message });
    }

    // Send response immediately
    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: {
        name: data.name,
        email: data.email,
        service: data.service,
        date: data.date,
      },
    });

    // Send cancellation emails asynchronously
    const sendCancellationEmails = async () => {
      try {
        const apiKey = process.env.BREVO_API_KEY;
        const adminEmail = process.env.ADMIN_EMAIL || 'akmalsafi43@gmail.com';
        const fromEmail = process.env.SMTP_FROM || 'akmalsafi43@gmail.com';

        if (!apiKey) {
          // eslint-disable-next-line no-console
          console.warn('⚠️ Brevo API key not configured for cancellation emails');
          return;
        }

        // eslint-disable-next-line no-console
        console.log('📧 Sending cancellation emails via Brevo API...');

        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

        // Email to admin - Cancellation Notification
        // eslint-disable-next-line no-console
        console.log(`📤 Sending cancellation notification to admin: ${adminEmail}`);
        const adminCancelEmailObj = new brevo.SendSmtpEmail();
        adminCancelEmailObj.sender = { email: fromEmail, name: 'Ruaa Beauty Bookings' };
        adminCancelEmailObj.to = [{ email: adminEmail }];
        adminCancelEmailObj.subject = `Booking Cancelled - ${data.name}`;
        adminCancelEmailObj.htmlContent = `
          <h3>Booking Cancellation Notification</h3>
          <p>A booking has been cancelled by the customer.</p>
          <hr>
          <h4>Booking Details:</h4>
          <ul>
            <li><strong>Name:</strong> ${data.name}</li>
            <li><strong>Email:</strong> ${data.email}</li>
            <li><strong>Phone:</strong> ${data.phone}</li>
            <li><strong>Service:</strong> ${data.service}</li>
            <li><strong>Date:</strong> ${data.date}</li>
            <li><strong>Time:</strong> ${data.time}</li>
            <li><strong>Location:</strong> ${data.location}</li>
            <li><strong>Address:</strong> ${data.address || 'N/A'}</li>
          </ul>
          <hr>
          <p><small>This booking has been automatically removed from the system.</small></p>
        `;

        const adminResult = await apiInstance.sendTransacEmail(adminCancelEmailObj);
        // eslint-disable-next-line no-console
        console.log('✅ Admin cancellation email sent:', adminResult);

        // Email to customer - Cancellation Confirmation
        // eslint-disable-next-line no-console
        console.log(`📤 Sending cancellation confirmation to customer: ${data.email}`);
        const userCancelEmailObj = new brevo.SendSmtpEmail();
        userCancelEmailObj.sender = { email: fromEmail, name: 'Ruaa Beauty' };
        userCancelEmailObj.to = [{ email: data.email }];
        userCancelEmailObj.subject = 'Booking Cancelled - Ruaa Beauty';
        userCancelEmailObj.htmlContent = `
          <h3>Hi ${data.name},</h3>
          <p>Your booking with Ruaa Beauty has been successfully cancelled.</p>
          <hr>
          <h4>Cancelled Booking Details:</h4>
          <ul>
            <li><strong>Service:</strong> ${data.service}</li>
            <li><strong>Date:</strong> ${data.date}</li>
            <li><strong>Time:</strong> ${data.time}</li>
            <li><strong>Location:</strong> ${data.location}</li>
          </ul>
          <hr>
          <p>If you have any questions or would like to rebook, please feel free to contact us.</p>
          <p>Thank you for your understanding.</p>
          <hr>
          <p><small>© Ruaa Beauty - Your beauty, our passion</small></p>
        `;

        const userResult = await apiInstance.sendTransacEmail(userCancelEmailObj);
        // eslint-disable-next-line no-console
        console.log('✅ Customer cancellation email sent:', userResult);
      } catch (emailErr: any) {
        // eslint-disable-next-line no-console
        console.error('❌ Cancellation email sending failed:', {
          message: emailErr.message,
          body: emailErr.response?.body,
        });
      }
    };

    // Execute email sending in background
    sendCancellationEmails();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error processing cancellation:', err);
    res.status(500).json({
      message: 'Error processing cancellation',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// GET /api/available-times - get available time slots for a specific date and services
app.get('/api/available-times', async (req, res) => {
  const { date, services } = req.query;

  if (!date || !services) {
    return res.status(400).json({ message: 'Date and services are required' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE || ''
    );

    // Get all bookings for this date
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', date);

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ message: 'Error fetching bookings' });
    }

    // Define all available hours
    const allHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const unavailableHours = new Set<number>();

    // Parse services array
    const servicesArray: string[] = typeof services === 'string' 
      ? services.split(',').map(s => s.trim()) 
      : Array.isArray(services) ? (services as string[]) : [];

    // Check each booking and mark unavailable hours based on service type
    bookings?.forEach((booking: any) => {
      const bookingTime = parseInt(booking.time.split(':')[0]); // Get hour from time
      const bookingServices = booking.service.split(',').map((s: string) => s.trim());

      bookingServices.forEach((bookedService: string) => {
        if (bookedService === 'bridal-makeup') {
          // Bridal makeup blocks entire day
          allHours.forEach(h => unavailableHours.add(h));
        } else if (bookedService === 'lash-lift' || bookedService === 'brow-lift' || bookedService === 'threading') {
          // These services block 1 hour
          unavailableHours.add(bookingTime);
        } else if (bookedService === 'makeup') {
          // Professional makeup blocks 3 hours
          for (let i = 0; i < 3; i++) {
            unavailableHours.add(bookingTime + i);
          }
        } else if (bookedService === 'mehendi') {
          // Mehendi blocks hours based on booking duration
          const mehendiHours = booking.mehendi_hours || 1;
          for (let i = 0; i < mehendiHours; i++) {
            unavailableHours.add(bookingTime + i);
          }
        }
      });
    });

    // Filter available hours based on requested services
    const availableHours = allHours.filter(hour => !unavailableHours.has(hour));

    res.status(200).json({
      date,
      availableHours,
      unavailableHours: Array.from(unavailableHours),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching available times:', err);
    res.status(500).json({
      message: 'Error fetching available times',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});
