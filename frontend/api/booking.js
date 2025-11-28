const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    name,
    email,
    phone,
    service,
    date,
    time,
    location,
    address,
    notes,
  } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    // --- Initialize Supabase client ---
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE // use SERVICE ROLE key for serverless functions
    );

    // Generate cancel token
    const cancelToken = crypto.randomUUID();

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
      console.error('Supabase insert error:', dbError);
      return res.status(500).json({ message: 'Database error', details: dbError.message });
    }

    // --- Email logic (unchanged) ---
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const secure = typeof process.env.SMTP_SECURE !== 'undefined' ? process.env.SMTP_SECURE === 'true' : port === 465;

    const smtpConfigured = !!(process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_FROM);
    if (!smtpConfigured) {
      console.warn('SMTP not configured; booking saved to database but emails will not be sent.');
      return res.status(200).json({ message: 'Booking saved to database (emails skipped - SMTP not configured)' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
      tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false' },
    });

    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error('SMTP transporter verification failed', verifyErr);
      return res.status(500).json({ message: 'SMTP configuration invalid. Check environment variables.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    // Email to admin
    await transporter.sendMail({
      from,
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
    });

    // Email to user
    await transporter.sendMail({
      from,
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
        <p><strong>Need to cancel?</strong> <a href="${process.env.SITE_URL || 'https://your-site.com'}/unbook?token=${cancelToken}">Click here to cancel your booking</a></p>
      `,
    });

    return res.status(200).json({ message: 'Booking saved & emails sent successfully' });
  } catch (err) {
    console.error('Error processing booking:', err);
    return res.status(500).json({ message: 'Error processing booking', details: err.message });
  }
};
