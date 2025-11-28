"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
const crypto_1 = require("crypto");
const brevo = __importStar(require("@getbrevo/brevo"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT ? Number(process.env.PORT) : 10000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
        // Initialize Supabase client
        const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE || '');
        // Generate cancel token
        const cancelToken = (0, crypto_1.randomUUID)();
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
                const apiInstance = new brevo.TransactionalEmailsApi();
                apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
                // Email to admin
                // eslint-disable-next-line no-console
                console.log(`📤 Sending admin email to: ${adminEmail}`);
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
        `;
                const adminResult = await apiInstance.sendTransacEmail(adminEmailObj);
                // eslint-disable-next-line no-console
                console.log('✅ Admin email sent:', adminResult);
                // Email to customer
                // eslint-disable-next-line no-console
                console.log(`📤 Sending confirmation email to: ${email}`);
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
          <p>We will contact you shortly to confirm your appointment.</p>
          <hr>
          <p><small>Need to cancel? <a href="${siteUrl}/unbook?token=${cancelToken}">Click here to cancel your booking</a></small></p>
        `;
                const userResult = await apiInstance.sendTransacEmail(userEmailObj);
                // eslint-disable-next-line no-console
                console.log('✅ Customer email sent:', userResult);
            }
            catch (emailErr) {
                // eslint-disable-next-line no-console
                console.error('❌ Email sending failed:', {
                    message: emailErr.message,
                    body: emailErr.response?.body,
                });
            }
        };
        // Execute email sending in background
        sendEmails();
    }
    catch (err) {
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
        const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE || '');
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
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error processing cancellation:', err);
        res.status(500).json({
            message: 'Error processing cancellation',
            details: err instanceof Error ? err.message : 'Unknown error',
        });
    }
});
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map