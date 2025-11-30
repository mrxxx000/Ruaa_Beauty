import * as brevo from '@getbrevo/brevo';

export class EmailService {
  private apiKey = process.env.BREVO_API_KEY || '';
  private adminEmail = process.env.ADMIN_EMAIL || 'akmalsafi43@gmail.com';
  private fromEmail = process.env.SMTP_FROM || 'akmalsafi43@gmail.com';
  private siteUrl = process.env.SITE_URL || 'https://ruaa-beauty.vercel.app';

  private getApiInstance() {
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, this.apiKey);
    return apiInstance;
  }

  private formatPricingRows(servicePricing: any[]) {
    return servicePricing && servicePricing.length > 0
      ? servicePricing.map((item: any) => {
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
  }

  private getPricingSection(servicePricing: any[], totalPrice: number) {
    if (!totalPrice || totalPrice <= 0) return '';

    const pricingRows = this.formatPricingRows(servicePricing);
    return `
      <hr>
      <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Pricing Summary:</h4>
      <table style="width: 100%; border-collapse: collapse;">
        ${pricingRows}
        <tr style="border-top: 2px solid #ff6fa3; font-weight: bold;">
          <td style="padding: 12px; text-align: left; font-size: 1.1em;">Total Price</td>
          <td style="padding: 12px; text-align: right; font-size: 1.2em; color: #ff6fa3;">${totalPrice} kr</td>
        </tr>
      </table>
    `;
  }

  async sendBookingConfirmation(bookingData: any) {
    if (!this.apiKey) {
      console.warn('⚠️ Brevo API key not configured');
      return;
    }

    try {
      console.log('📧 Sending booking confirmation emails via Brevo API...');

      const apiInstance = this.getApiInstance();

      // Email to admin
      console.log(`📤 Sending admin email to: ${this.adminEmail}`);
      const adminPricingRows = this.formatPricingRows(bookingData.servicePricing);
      const adminPricingSection = bookingData.totalPrice && bookingData.totalPrice > 0 ? `
        <h4 style="color: #1f2937; margin-top: 20px; margin-bottom: 10px;">Pricing Summary:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          ${adminPricingRows}
          <tr style="border-top: 2px solid #ff6fa3; font-weight: bold;">
            <td style="padding: 12px; text-align: left; font-size: 1.1em;">Total Price</td>
            <td style="padding: 12px; text-align: right; font-size: 1.2em; color: #ff6fa3;">${bookingData.totalPrice} kr</td>
          </tr>
        </table>
      ` : '';

      const adminEmailObj = new brevo.SendSmtpEmail();
      adminEmailObj.sender = { email: this.fromEmail, name: 'Ruaa Beauty Bookings' };
      adminEmailObj.to = [{ email: this.adminEmail }];
      adminEmailObj.subject = `New Booking from ${bookingData.name}`;
      adminEmailObj.htmlContent = `
        <h3>New Booking Request</h3>
        <p><strong>Name:</strong> ${bookingData.name}</p>
        <p><strong>Email:</strong> ${bookingData.email}</p>
        <p><strong>Phone:</strong> ${bookingData.phone}</p>
        <p><strong>Service:</strong> ${bookingData.service}</p>
        <p><strong>Date:</strong> ${bookingData.date}</p>
        <p><strong>Time:</strong> ${bookingData.time}</p>
        <p><strong>Location:</strong> ${bookingData.location}</p>
        <p><strong>Address:</strong> ${bookingData.address || 'N/A'}</p>
        <p><strong>Notes:</strong> ${bookingData.notes || 'None'}</p>
        ${adminPricingSection}
      `;

      await apiInstance.sendTransacEmail(adminEmailObj);
      console.log('✅ Admin email sent');

      // Email to customer
      console.log(`📤 Sending confirmation email to: ${bookingData.email}`);
      const userPricingSection = this.getPricingSection(bookingData.servicePricing, bookingData.totalPrice);

      const userEmailObj = new brevo.SendSmtpEmail();
      userEmailObj.sender = { email: this.fromEmail, name: 'Ruaa Beauty' };
      userEmailObj.to = [{ email: bookingData.email }];
      userEmailObj.subject = 'Booking Confirmation - Ruaa Beauty';
      userEmailObj.htmlContent = `
        <h3>Hi ${bookingData.name},</h3>
        <p>Thank you for booking with Ruaa Beauty! Here are your appointment details:</p>
        <ul>
          <li><strong>Service:</strong> ${bookingData.service}</li>
          <li><strong>Date:</strong> ${bookingData.date}</li>
          <li><strong>Time:</strong> ${bookingData.time}</li>
          <li><strong>Location:</strong> ${bookingData.location}</li>
          <li><strong>Address:</strong> ${bookingData.address || 'N/A'}</li>
        </ul>
        ${userPricingSection}
        <p>We will contact you shortly to confirm your appointment.</p>
        <hr>
        <p><small>Need to cancel? <a href="${this.siteUrl}/unbook?token=${bookingData.cancelToken}">Click here to cancel your booking</a></small></p>
      `;

      await apiInstance.sendTransacEmail(userEmailObj);
      console.log('✅ Customer email sent');
    } catch (emailErr: any) {
      console.error('❌ Email sending failed:', {
        message: emailErr.message,
        body: emailErr.response?.body,
      });
    }
  }

  async sendCancellationEmails(booking: any) {
    if (!this.apiKey) {
      console.warn('⚠️ Brevo API key not configured for cancellation emails');
      return;
    }

    try {
      console.log('📧 Sending cancellation emails via Brevo API...');

      const apiInstance = this.getApiInstance();

      // Email to admin
      console.log(`📤 Sending cancellation notification to admin: ${this.adminEmail}`);
      const adminCancelEmailObj = new brevo.SendSmtpEmail();
      adminCancelEmailObj.sender = { email: this.fromEmail, name: 'Ruaa Beauty Bookings' };
      adminCancelEmailObj.to = [{ email: this.adminEmail }];
      adminCancelEmailObj.subject = `Booking Cancelled - ${booking.name}`;
      adminCancelEmailObj.htmlContent = `
        <h3>Booking Cancellation Notification</h3>
        <p>A booking has been cancelled by the customer.</p>
        <hr>
        <h4>Booking Details:</h4>
        <ul>
          <li><strong>Name:</strong> ${booking.name}</li>
          <li><strong>Email:</strong> ${booking.email}</li>
          <li><strong>Phone:</strong> ${booking.phone}</li>
          <li><strong>Service:</strong> ${booking.service}</li>
          <li><strong>Date:</strong> ${booking.date}</li>
          <li><strong>Time:</strong> ${booking.time}</li>
          <li><strong>Location:</strong> ${booking.location}</li>
          <li><strong>Address:</strong> ${booking.address || 'N/A'}</li>
        </ul>
        <hr>
        <p><small>This booking has been automatically removed from the system.</small></p>
      `;

      await apiInstance.sendTransacEmail(adminCancelEmailObj);
      console.log('✅ Admin cancellation email sent');

      // Email to customer
      console.log(`📤 Sending cancellation confirmation to customer: ${booking.email}`);
      const userCancelEmailObj = new brevo.SendSmtpEmail();
      userCancelEmailObj.sender = { email: this.fromEmail, name: 'Ruaa Beauty' };
      userCancelEmailObj.to = [{ email: booking.email }];
      userCancelEmailObj.subject = 'Booking Cancelled - Ruaa Beauty';
      userCancelEmailObj.htmlContent = `
        <h3>Hi ${booking.name},</h3>
        <p>Your booking with Ruaa Beauty has been successfully cancelled.</p>
        <hr>
        <h4>Cancelled Booking Details:</h4>
        <ul>
          <li><strong>Service:</strong> ${booking.service}</li>
          <li><strong>Date:</strong> ${booking.date}</li>
          <li><strong>Time:</strong> ${booking.time}</li>
          <li><strong>Location:</strong> ${booking.location}</li>
        </ul>
        <hr>
        <p>If you have any questions or would like to rebook, please feel free to contact us.</p>
        <p>Thank you for your understanding.</p>
        <hr>
        <p><small>© Ruaa Beauty - Your beauty, our passion</small></p>
      `;

      await apiInstance.sendTransacEmail(userCancelEmailObj);
      console.log('✅ Customer cancellation email sent');
    } catch (emailErr: any) {
      console.error('❌ Cancellation email sending failed:', {
        message: emailErr.message,
        body: emailErr.response?.body,
      });
    }
  }
}
