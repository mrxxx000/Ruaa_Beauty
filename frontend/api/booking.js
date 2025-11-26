const nodemailer = require('nodemailer');

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
    notes,
  } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const secure = typeof process.env.SMTP_SECURE !== 'undefined' ? process.env.SMTP_SECURE === 'true' : port === 465;

    const smtpConfigured = !!(process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_FROM);
    if (!smtpConfigured) {
      console.warn('SMTP not configured; skipping email send. Booking will be accepted but emails will not be sent.');
      console.log('Booking details:', { name, email, phone, service, date, time, location, notes });
      return res.status(200).json({ message: 'Booking received (emails skipped - SMTP not configured)' });
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
        </ul>
        <p>We will contact you shortly to confirm.</p>
      `,
    });

    return res.status(200).json({ message: 'Emails sent successfully' });
  } catch (err) {
    console.error('Error sending booking emails', err);
    return res.status(500).json({ message: 'Error sending emails' });
  }
};
