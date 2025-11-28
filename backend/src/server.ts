import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello from backend');
});

// POST /api/booking - accepts booking data, saves to Supabase, and sends emails
app.post('/api/booking', async (req, res) => {
  const { name, email, phone, service, date, time, location, address, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    // --- Initialize Supabase client ---
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
      },
    ]);

    if (dbError) {
      // eslint-disable-next-line no-console
      console.error('Supabase insert error:', dbError);
      return res.status(500).json({ message: 'Database error', details: dbError.message });
    }

    // --- Email logic ---
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const secure = process.env.SMTP_SECURE === 'true' ? true : false;

    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
    
    // eslint-disable-next-line no-console
    console.log('SMTP Config Check:', {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: smtpPort,
      SMTP_SECURE: secure,
      SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
      SMTP_FROM: process.env.SMTP_FROM,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      smtpConfigured,
    });

    if (!smtpConfigured) {
      // eslint-disable-next-line no-console
      console.warn('SMTP not configured; booking saved to database but emails will not be sent.');
      return res.status(200).json({
        message: 'Booking saved to database (emails skipped - SMTP not configured)',
        cancelToken,
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL || 'akmal123@gmail.com';
    const siteUrl = process.env.SITE_URL || 'https://ruaa-beauty.vercel.app';

    // Send emails asynchronously (don't block the response)
    transporter.verify()
      .then(() => {
        // eslint-disable-next-line no-console
        console.log('SMTP verification successful, sending emails...');
        
        // Email to admin
        transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: adminEmail,
          subject: `New Booking from ${name}`,
          html: `
            <h3>New Booking Request</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Address:</strong> ${address || 'N/A'}</p>
            <p><strong>Notes:</strong> ${notes}</p>
          `,
        }).then(() => {
          // eslint-disable-next-line no-console
          console.log('Admin email sent successfully to:', adminEmail);
        }).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Failed to send admin email:', err.message);
        });

        // Email to user
        transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Booking Confirmation',
          html: `
            <h3>Hi ${name},</h3>
            <p>Thank you for booking with us! Here are your appointment details:</p>
            <ul>
              <li><strong>Service:</strong> ${service}</li>
              <li><strong>Date:</strong> ${date}</li>
              <li><strong>Time:</strong> ${time}</li>
              <li><strong>Location:</strong> ${location}</li>
              <li><strong>Address:</strong> ${address || 'N/A'}</li>
            </ul>
            <p>We will contact you shortly to confirm.</p>
            <hr>
            <p><strong>Need to cancel?</strong> <a href="${siteUrl}/unbook?token=${cancelToken}">Click here to cancel your booking</a></p>
          `,
        }).then(() => {
          // eslint-disable-next-line no-console
          console.log('User email sent successfully to:', email);
        }).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Failed to send user email:', err.message);
        });
      })
      .catch((verifyErr) => {
        // eslint-disable-next-line no-console
        console.error('SMTP verification failed:', verifyErr.message);
      });

    res.status(200).json({ message: 'Booking saved successfully. Confirmation email will be sent shortly.', cancelToken });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error processing booking:', err);
    res.status(500).json({ message: 'Error processing booking', details: err instanceof Error ? err.message : 'Unknown error' });
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

    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: {
        name: data.name,
        email: data.email,
        service: data.service,
        date: data.date,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error processing cancellation:', err);
    res.status(500).json({ message: 'Error processing cancellation', details: err instanceof Error ? err.message : 'Unknown error' });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});
