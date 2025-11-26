import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello from backend');
});

// POST /api/booking - accepts booking data and sends email to admin and user
app.post('/api/booking', async (req, res) => {
  const { name, email, phone, service, date, time, location, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    // Transporter configuration from environment variables (robust defaults)
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const secure = typeof process.env.SMTP_SECURE !== 'undefined' ? process.env.SMTP_SECURE === 'true' : port === 465;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || undefined,
      port: port,
      secure,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
      tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false' },
    });

    // Verify transporter configuration early to give a clear error
    try {
      // this will throw if credentials/connection fail
      // eslint-disable-next-line no-await-in-loop
      await transporter.verify();
    } catch (verifyErr) {
      // eslint-disable-next-line no-console
      console.error('SMTP transporter verification failed', verifyErr);
      return res.status(500).json({ message: 'SMTP configuration invalid. Check environment variables.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'akmal123@gmail.com';

    // Email to admin
    await transporter.sendMail({
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
        <p><strong>Notes:</strong> ${notes}</p>
      `,
    });

    // Email to user
    await transporter.sendMail({
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
        </ul>
        <p>We will contact you shortly to confirm.</p>
      `,
    });

    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error sending booking emails', err);
    res.status(500).json({ message: 'Error sending emails' });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});
